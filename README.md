# Vocab AI Trainer

A personalized AI-powered vocabulary trainer app that helps users learn, practice, and retain new words through flashcards, quizzes, and engaging games.

## Features

- **Spaced Repetition System (SRS):** Learn new words efficiently with a SAKT-inspired algorithm that schedules reviews at optimal intervals.
- **Firebase Backend:** User authentication and data persistence are handled by Firebase, allowing for a seamless experience across sessions.
- **Interactive Flashcards:** Flip cards to reveal definitions, examples, and synonyms.
- **Engaging Games:** Test your knowledge with fun games like Vocabulary Quiz, Synonym Swipe, Word Scramble, Spelling Bee, and Wordle.
- **AI-Powered Dictionary:** Look up any word to get its details using the Google Gemini API.
- **Reverse Dictionary:** Describe a concept and let the AI find the right word for you.
- **Social & Competitive Features:** Add friends and compete in leaderboards based on your learning progress.
- **Personalized Experience:** Track your progress, view your stats, and customize the app's theme.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Firebase (Authentication, Firestore)
- **AI:** Google Gemini API

---

## Getting Started

This project is a single-page application that requires a Firebase project and a Google Gemini API key to function.

### Prerequisites

- A modern web browser with JavaScript enabled.
- A Google account to create Firebase and Gemini projects.

### 1. Set Up Your Firebase Project

This application uses Firebase for user authentication and data storage.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click **"Add project"** and follow the on-screen instructions.

2.  **Add a Web App:**
    *   In your project's dashboard, click the **Web icon (`</>`)** to add a web app.
    *   Register your app. Firebase will provide you with a `firebaseConfig` object. **Copy this entire object.**

3.  **Configure the Application:**
    *   Open the file `services/apiService.ts`.
    *   Find the `firebaseConfig` constant at the top of the file.
    *   **Paste the configuration object** you copied from the Firebase console, replacing the placeholder values.

    ```javascript
    // services/apiService.ts

    const firebaseConfig = {
      apiKey: "PASTE_YOUR_API_KEY_HERE",
      authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
      // ...and so on for all keys
    };
    ```

4.  **Set Up Authentication:**
    *   In the Firebase Console, go to the **Authentication** section.
    *   On the **Sign-in method** tab, enable the **Email/Password** and **Google** providers.

5.  **Set Up Firestore Database:**
    *   Go to the **Firestore Database** section and click **"Create database"**.
    *   Start in **Test Mode** for easy development.
    *   **Important:** Before deploying to production, you **must** secure your database. See the security rules section below.

### 2. Set Up Your Gemini API Key

1.  Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a file named `.env` in the root of your project (copy from `.env.example`).
3.  Add your key to the file:
    ```
    API_KEY=AIzaSy...
    ```

### 3. Run the Application

```bash
npm install
npm run dev
```

---

## Backend Configuration Details

### Firestore Data Structure

The app uses a top-level collection named `users`. Each document in this collection is identified by a user's unique ID (`uid`) from Firebase Authentication.

**`users/{userId}` document structure:**
```json
{
  "words": [
    { "word": "Benevolent", "definition": "...", "srsData": { ... } }
  ],
  "bookmarkedWords": ["Serendipity", "Ephemeral"],
  "quizStats": {
    "totalCorrect": 15,
    "totalAnswered": 18
  },
  "settings": {
    "theme": "lavender",
    "userName": "Learner",
    "hasAcceptedDisclaimer": true
  },
  "friendIds": ["friendUid1", "friendUid2"],
  "practiceHistory": [
    { "id": "...", "type": "Quiz", "score": 4, "total": 5, "date": "..." }
  ],
  "wordsLearned": 50
}
```
*Note: The `wordsLearned` field is a denormalized count that makes querying for leaderboards much more efficient.*

### Firestore Indexes (Required for Leaderboards)

The league leaderboard feature requires a composite index on the `users` collection. When you first run the app and navigate to the profile page, Firestore will generate an error in your browser's console with a direct link to create this index. **You must click this link and create the index for the leaderboard to work.**

### Firestore Security Rules (Production)

For a production environment, you should update your Firestore rules to ensure users can only access their own sensitive data while still allowing public data (like leaderboard scores) to be read.

Go to the **Rules** tab in the Firestore section of the console and replace the test rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write to their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow any authenticated user to read public-facing data from other users for leaderboards
    match /users/{otherUserId} {
        allow read: if request.auth != null;
    }
  }
}
```