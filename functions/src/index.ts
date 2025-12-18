// functions/src/index.ts
import * as functions from 'firebase-functions/v1';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

const app = express();

// Allow all origins in dev; tighten in prod.
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// 1. We define the variable as 'auth' here
const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language' 
  ]
});

async function getAccessToken() {
  // 2. FIXED: We must use 'auth' here, not 'googleAuth'
  const client = await auth.getClient(); 
  const tokenResponse = await client.getAccessToken();
  
  if (!tokenResponse) throw new Error('Failed to get access token');
  return typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token;
}

app.post('/gemini/:model/generate', async (req, res) => {
  try {
    const model = 'gemini-2.0-flash'; 
    const clientBody = req.body || {};
    const promptText = String(clientBody?.prompt?.text ?? clientBody?.text ?? '');

    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;


    const accessToken = await getAccessToken();

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      // FIXED: maxOutputTokens must be inside 'generationConfig'
      generationConfig: {
        maxOutputTokens: clientBody.maxOutputTokens ?? 512,
      },
    };

    const r = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (err: any) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

export const api = functions.region('us-central1').https.onRequest(app);