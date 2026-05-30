# Henry — Vocabulary AI Trainer

A smart, personalized vocabulary learning app powered by spaced repetition and an advanced knowledge tracing algorithm.

## What is Henry?

Henry is a full-stack vocabulary trainer that adapts to your learning pace. It tracks how well you know each word and schedules reviews at the optimal time — right before you're about to forget.

## How It Works

Henry uses **SAKT (Self-Attentive Knowledge Tracing)** — a machine learning model that runs as a Firebase Cloud Function. Every time you review a word, the model analyzes your entire history with that word and predicts your current mastery level. It then schedules your next review using exponential spaced repetition.

## Features

- 🦉 **Adaptive Learning** — Reviews are scheduled based on your personal mastery of each word
- 🧠 **SAKT Model** — Self-attention based knowledge tracing for accurate mastery prediction
- 📊 **Progress Tracking** — See your mastery score and streaks for every word
- 🔐 **Authentication** — Sign in with Google or Email/Password
- ☁️ **Cloud Sync** — Your vocabulary data syncs in real time across devices via Firebase
- 📱 **Responsive** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Firebase Cloud Functions (Python 3.12) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| ML Model | SAKT (Self-Attentive Knowledge Tracing) |
| Hosting | Firebase Hosting |

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- Firebase CLI

### Installation

```bash
# Clone the repo
git clone https://github.com/darren98452/Henry.git
cd Henry

# Install frontend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Firebase config to .env

# Run locally
npm run dev
```

### Deployment

```bash
# Build and deploy to Firebase
npm run build && firebase deploy
```

## Project Structure
Henry/
├── components/       # React UI components
├── views/            # Page-level components
├── services/         # Firebase and API service layers
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── sakt/             # Python Cloud Function (SAKT model)
│   └── main.py       # ML model + Firebase Function entry point
├── public/           # Static assets
└── dist/             # Production build output
## Live App

🌐 [henry-sakt.web.app](https://henry-sakt.web.app)
