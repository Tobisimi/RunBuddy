# RunBuddy API

Node.js + Express backend for AI coaching, runs, and Firebase auth.

## Setup

```bash
cd backend
cp .env.example .env
# Fill in Firebase Admin + GEMINI_API_KEY
npm install
npm run dev
```

Health check: `GET http://localhost:3001/health`

All `/api/v1/*` routes require `Authorization: Bearer <Firebase ID token>`.

## Deploy (Railway)

1. Create a Railway project from this `backend` folder.
2. Set environment variables from `.env.example`.
3. Set `FIREBASE_PRIVATE_KEY` with literal `\n` newlines or quoted PEM.
4. Point the mobile app `EXPO_PUBLIC_API_URL` to `https://<your-app>.up.railway.app/api/v1`.

Enable **Speech-to-Text** and **Cloud Text-to-Speech** APIs on the same GCP project as your service account.
