/**
 * saktService.ts
 *
 * Replaces the Gemini-simulated knowledge tracing with a real call to the
 * Python SAKT Cloud Function.
 *
 * Drop-in replacement: same input/output contract as the old
 * `calculateKnowledgeState` in geminiService.ts.
 *
 * Flow:
 *   recordInteraction (apiService.ts)
 *     → calculateKnowledgeState (this file)
 *       → POST /sakt_predict  (functions/main.py)
 *         ← { mastery, interval, repetition }
 *
 * On any network/parse failure the caller falls back to the local heuristic
 * already present in apiService.ts — no change needed there.
 */

import type { SrsInteraction } from '../types';

// ─────────────────────────────────────────────────────────────
// ⚙️  CONFIG — update this to your deployed Cloud Function URL.
//
//   Format:
//     https://<region>-<project-id>.cloudfunctions.net/sakt_predict
//
//   You can also store it in .env as VITE_SAKT_URL and reference it here:
//     const SAKT_URL = import.meta.env.VITE_SAKT_URL as string;
// ─────────────────────────────────────────────────────────────
const SAKT_URL: string =
  (import.meta as any).env?.VITE_SAKT_URL ??
  'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sakt_predict';

export interface SAKTResult {
  mastery:    number;   // 0–1  knowledge strength
  interval:   number;   // days until next review
  repetition: number;   // consecutive correct answers
}

/**
 * Call the Python SAKT Cloud Function.
 *
 * @param word    - The vocabulary word being reviewed (used for embedding)
 * @param history - Full SRS interaction history for this word
 * @returns SAKTResult or null (caller should fall back to heuristic on null)
 */
export async function calculateKnowledgeState(
  word:    string,
  history: SrsInteraction[],
): Promise<SAKTResult | null> {
  try {
    const response = await fetch(SAKT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        history,
        now: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`SAKT endpoint returned ${response.status} — using fallback`);
      return null;
    }

    const data = await response.json() as Partial<SAKTResult> & { error?: string };

    if (data.error) {
      console.warn('SAKT error from server:', data.error);
      return null;
    }

    // Validate the three required fields
    if (
      typeof data.mastery    !== 'number' ||
      typeof data.interval   !== 'number' ||
      typeof data.repetition !== 'number'
    ) {
      console.warn('SAKT response missing fields:', data);
      return null;
    }

    return {
      mastery:    Math.max(0, Math.min(1, data.mastery)),
      interval:   Math.max(1, data.interval),
      repetition: Math.max(0, data.repetition),
    };

  } catch (err) {
    console.warn('SAKT fetch failed — using fallback:', err);
    return null;
  }
}
