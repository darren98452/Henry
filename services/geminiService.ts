import type { Word, SrsInteraction } from '../types';
import { getSaktPythonScript } from './saktScript';

// --- Configuration ---
const API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  process.env.API_KEY ||
  process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not set (Cloud Function will handle auth).');
}

// Must match Cloud Function base URL
const FUNCTION_BASE = 'https://us-central1-henry-1b5f9.cloudfunctions.net/api';

// --- Constants ---
export const Type = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
} as const;

export const HarmCategory = {
  HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
} as const;

export const HarmBlockThreshold = {
  BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
} as const;

// --- SMART PARSER ---
function parseGeminiResponse(rawInput: any): any {
  let text = typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput);

  try {
    const json = JSON.parse(text);
    if (json.candidates && Array.isArray(json.candidates)) {
      text = json.candidates[0]?.content?.parts?.[0]?.text || '{}';
    }
  } catch {
    // not a wrapper, continue
  }

  const withoutFences = text.replace(/``````/g, '');
  const match = withoutFences.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : withoutFences;

  try {
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse cleaned JSON. Raw:', text, 'JSON:', jsonText);
    return null;
  }
}


// --- Helper: REST call to Cloud Function ---
async function _restGenerate(model: string, promptText: string) {
  const url = `${FUNCTION_BASE}/gemini/${encodeURIComponent(model)}/generate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: { text: promptText },
      maxOutputTokens: 512,
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {
    console.error('Gemini Proxy Error:', rawText);
    throw new Error(`Gemini REST error ${res.status}: ${rawText}`);
  }

  return { text: rawText };
}

// --- Adapter ---
const GoogleGenAI = {
  models: {
    async generateContent(opts: { model: string; contents: string | string[]; config?: any }) {
      const contents = Array.isArray(opts.contents)
        ? opts.contents.join('\n')
        : String(opts.contents ?? '');
      return await _restGenerate(opts.model, contents);
    },
  },
};

const ai = API_KEY ? (GoogleGenAI as any) : GoogleGenAI;

// --- Safety Settings ---
const safetySettings = [
  { category: (HarmCategory as any).HARM_CATEGORY_HARASSMENT, threshold: (HarmBlockThreshold as any).BLOCK_MEDIUM_AND_ABOVE },
  { category: (HarmCategory as any).HARM_CATEGORY_HATE_SPEECH, threshold: (HarmBlockThreshold as any).BLOCK_MEDIUM_AND_ABOVE },
  { category: (HarmCategory as any).HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: (HarmBlockThreshold as any).BLOCK_MEDIUM_AND_ABOVE },
  { category: (HarmCategory as any).HARM_CATEGORY_DANGEROUS_CONTENT, threshold: (HarmBlockThreshold as any).BLOCK_MEDIUM_AND_ABOVE },
];

// --- Mocks ---
const mockDictionaryWord: Word = {
  word: 'Query',
  pronunciation: '/ˈkwɪəri/',
  definition: 'A question.',
  example: 'He posed a query.',
  synonyms: ['question'],
  difficulty: 'easy',
};
const mockReverseSearchResult = ['Vocabulary', 'Lexicon', 'Glossary'];

// --- MAIN FUNCTIONS ---
export const findWordFromDefinition = async (definition: string): Promise<string[]> => {
  if (!ai) return mockReverseSearchResult;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Reverse dictionary for: "${definition}". Return JSON with property "words": [list of 3-5 strings].`,
      config: { safetySettings },
    });

    const parsed = parseGeminiResponse(response.text);
    return parsed && Array.isArray(parsed.words) ? parsed.words : [];
  } catch (error) {
    console.error('Reverse dictionary error:', error);
    return mockReverseSearchResult;
  }
};

export const getWordDetails = async (word: string): Promise<Word | null> => {
  if (!ai) return word.toLowerCase() === 'query' ? mockDictionaryWord : null;

  try {
    const prompt = `Dictionary entry for "${word}". JSON format: { word, pronunciation, definition, example, synonyms (array), difficulty (easy/medium/hard) }. If invalid word, return empty object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { safetySettings },
    });

    const parsed = parseGeminiResponse(response.text);

    if (parsed && parsed.word && parsed.definition) {
      return { ...parsed, difficulty: parsed.difficulty || 'medium' };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching details for "${word}":`, error);
    throw new Error('Failed to fetch word details.');
  }
};

export const calculateKnowledgeState = async (
  word: string,
  history: SrsInteraction[],
): Promise<{ mastery: number; interval: number; repetition: number } | null> => {
  if (!ai) return null;
  try {
    const now = new Date().toISOString();
    const pythonCode = getSaktPythonScript(word, history.slice(-50), now);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Run this python logic mentally and return JSON:\n${pythonCode}`,
      config: { safetySettings },
    });

    const parsed = parseGeminiResponse(response.text);

    return {
      mastery: parsed.mastery,
      interval: parsed.interval,
      repetition: parsed.repetition || 0,
    };
  } catch {
    return null;
  }
};
