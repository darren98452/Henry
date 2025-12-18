import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function getAccessToken() {
  const client = await googleAuth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse) throw new Error('Failed to get access token');
  return typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
}

app.post('/gemini/:model/generate', async (req, res) => {
  try {
    const model = req.params.model;
    const clientBody = req.body || {};
    const promptText = String(clientBody?.prompt?.text ?? clientBody?.text ?? '');

    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const accessToken = await getAccessToken();

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      maxOutputTokens: clientBody.maxOutputTokens ?? 512,
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
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

// Export using functions.https.onRequest for best compatibility
export const api = functions.https.onRequest(app);
