import * as functions from 'firebase-functions';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { GoogleAuth } from 'google-auth-library';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

app.post('/gemini/:model/generate', async (req, res) => {
  try {
    const model = req.params.model;
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const response = await fetch(
      `https://generative.googleapis.com/v1/models/${model}:generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.token || accessToken}`,
        },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send({ error: String(err) });
  }
});

exports.api = functions.https.onRequest(app);
