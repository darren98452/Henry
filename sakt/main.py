import json
import math
import hashlib
from datetime import datetime, timezone

from firebase_admin import initialize_app
from firebase_functions import https_fn

initialize_app()

D_MODEL   = 32
D_FF      = 64
MAX_SEQ   = 50
DECAY_K   = 0.05

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def mat_vec(M, v):
    return [dot(row, v) for row in M]

def add_vec(a, b):
    return [x + y for x, y in zip(a, b)]

def scale_vec(s, v):
    return [s * x for x in v]

def relu(v):
    return [max(0.0, x) for x in v]

def sigmoid(x):
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)

def softmax(v):
    m = max(v)
    e = [math.exp(x - m) for x in v]
    s = sum(e)
    return [x / s for x in e]

def layer_norm(v, eps=1e-6):
    mean = sum(v) / len(v)
    var  = sum((x - mean) ** 2 for x in v) / len(v)
    std  = math.sqrt(var + eps)
    return [(x - mean) / std for x in v]

def _lcg(seed):
    a, c, m = 1664525, 1013904223, 2**32
    state = seed % m
    while True:
        state = (a * state + c) % m
        yield (state / m) * 2 - 1

def xavier_matrix(rows, cols, seed):
    gen   = _lcg(seed)
    limit = math.sqrt(6.0 / (rows + cols))
    return [[next(gen) * limit for _ in range(cols)] for _ in range(rows)]

def xavier_vector(size, seed):
    gen   = _lcg(seed)
    limit = math.sqrt(6.0 / size)
    return [next(gen) * limit for _ in range(size)]

def word_embedding(word):
    h   = int(hashlib.md5(word.lower().encode()).hexdigest(), 16)
    gen = _lcg(h)
    raw = [next(gen) for _ in range(D_MODEL)]
    norm = math.sqrt(sum(x * x for x in raw)) + 1e-9
    return [x / norm for x in raw]

def positional_encoding(pos, d=D_MODEL):
    enc = []
    for i in range(d):
        angle = pos / (10000 ** (2 * (i // 2) / d))
        enc.append(math.sin(angle) if i % 2 == 0 else math.cos(angle))
    return enc

class SAKTLayer:
    def __init__(self, seed_offset=0):
        s = seed_offset
        self.W_q = xavier_matrix(D_MODEL, D_MODEL, s + 1)
        self.W_k = xavier_matrix(D_MODEL, D_MODEL, s + 2)
        self.W_v = xavier_matrix(D_MODEL, D_MODEL, s + 3)
        self.W_o = xavier_matrix(D_MODEL, D_MODEL, s + 4)
        self.W_1 = xavier_matrix(D_FF,    D_MODEL, s + 5)
        self.b_1 = xavier_vector(D_FF,             s + 6)
        self.W_2 = xavier_matrix(D_MODEL, D_FF,    s + 7)
        self.b_2 = xavier_vector(D_MODEL,           s + 8)
        self.W_out = xavier_vector(D_MODEL, s + 9)
        self.b_out = 0.0

    def attention(self, queries, keys, values, decay_weights):
        scale = math.sqrt(D_MODEL)
        out   = []
        for i in range(len(queries)):
            q = mat_vec(self.W_q, queries[i])
            scores = []
            for j in range(i + 1):
                k = mat_vec(self.W_k, keys[j])
                scores.append(dot(q, k) / scale * decay_weights[j])
            attn = softmax(scores) if scores else [1.0]
            ctx = [0.0] * D_MODEL
            for j, a in enumerate(attn):
                v = mat_vec(self.W_v, values[j])
                ctx = add_vec(ctx, scale_vec(a, v))
            out.append(mat_vec(self.W_o, ctx))
        return out

    def forward(self, exercise_embs, interaction_embs, decay_weights):
        N = len(exercise_embs)
        attn_out = self.attention(exercise_embs, interaction_embs, interaction_embs, decay_weights)
        attn_out = [layer_norm(add_vec(exercise_embs[i], attn_out[i])) for i in range(N)]
        ff_out = []
        for i in range(N):
            h = add_vec(mat_vec(self.W_1, attn_out[i]), self.b_1)
            h = relu(h)
            h = add_vec(mat_vec(self.W_2, h), self.b_2)
            ff_out.append(layer_norm(add_vec(attn_out[i], h)))
        return [sigmoid(dot(self.W_out, h) + self.b_out) for h in ff_out]

_sakt_layer = SAKTLayer(seed_offset=42)
_W_interact = xavier_matrix(D_MODEL, D_MODEL, seed=7)

def interaction_embedding(exercise_emb, response):
    sign = 1.0 if response >= 3 else -1.0
    return layer_norm(mat_vec(_W_interact, scale_vec(sign, exercise_emb)))

def mastery_to_interval(mastery, repetition):
    if mastery < 0.30:
        return 1
    base       = math.exp(mastery * 5.0) - 1
    rep_factor = 1.0 + 0.15 * min(repetition, 20)
    return max(1, min(math.ceil(base * rep_factor * 0.5), 180))

def run_sakt(word, history, now_iso):
    if not history:
        return {"mastery": 0.3, "interval": 1, "repetition": 0}
    now     = datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
    history = history[-MAX_SEQ:]
    timestamps = [datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00")) for h in history]
    decay_weights = [math.exp(-DECAY_K * max(0.0, (now - ts).total_seconds() / 86400.0)) for ts in timestamps]
    base_emb = word_embedding(word)
    exercise_embs, interact_embs = [], []
    for i, h in enumerate(history):
        e_i = layer_norm(add_vec(base_emb, positional_encoding(i)))
        exercise_embs.append(e_i)
        interact_embs.append(interaction_embedding(e_i, h["quality"]))
    mastery = float(_sakt_layer.forward(exercise_embs, interact_embs, decay_weights)[-1])
    repetition = 0
    for h in reversed(history):
        if h["quality"] >= 3:
            repetition += 1
        else:
            break
    return {"mastery": round(mastery, 4), "interval": mastery_to_interval(mastery, repetition), "repetition": repetition}

@https_fn.on_request()
def sakt_predict(req: https_fn.Request) -> https_fn.Response:
    cors_headers = {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=cors_headers)
    try:
        body    = req.get_json(silent=True) or {}
        word    = body.get("word", "unknown")
        history = body.get("history", [])
        now_iso = body.get("now", datetime.now(timezone.utc).isoformat())
        result  = run_sakt(word, history, now_iso)
        return https_fn.Response(json.dumps(result), status=200, headers={**cors_headers, "Content-Type": "application/json"})
    except Exception as exc:
        error = {"error": str(exc), "mastery": 0.3, "interval": 1, "repetition": 0}
        return https_fn.Response(json.dumps(error), status=500, headers={**cors_headers, "Content-Type": "application/json"})
