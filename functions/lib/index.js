"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// functions/src/index.ts
const functions = __importStar(require("firebase-functions/v1"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const google_auth_library_1 = require("google-auth-library");
const app = (0, express_1.default)();
// Allow all origins in dev; tighten in prod.
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '1mb' }));
// 1. We define the variable as 'auth' here
const auth = new google_auth_library_1.GoogleAuth({
    scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language'
    ]
});
async function getAccessToken() {
    // 2. FIXED: We must use 'auth' here, not 'googleAuth'
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse)
        throw new Error('Failed to get access token');
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
        const r = await (0, node_fetch_1.default)(targetUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const text = await r.text();
        res.status(r.status).type('application/json').send(text);
    }
    catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: err?.message ?? String(err) });
    }
});
exports.api = functions.region('us-central1').https.onRequest(app);
