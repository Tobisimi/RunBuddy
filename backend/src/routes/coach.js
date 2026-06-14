const express = require("express");
const speech = require("@google-cloud/speech");
const textToSpeech = require("@google-cloud/text-to-speech");
const { getDb } = require("../config/firebase");
const { generateCoachResponse } = require("../services/gemini");
const {
  getSpeechClientOptions,
  getTtsClientOptions,
} = require("../config/firebase");
const {
  buildSystemPrompt,
  truncateToTwoSentences,
  pickFallback,
  withGeminiRetry,
} = require("../utils/coachPrompt");

const router = express.Router();

const FREE_DAILY_COACH_MESSAGES = Number(
  process.env.FREE_DAILY_COACH_MESSAGES || 5,
);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getUserDoc(uid) {
  const snap = await getDb().collection("users").doc(uid).get();
  return snap.exists ? snap.data() : {};
}

async function checkAndIncrementCoachMessages(uid) {
  const ref = getDb().collection("users").doc(uid);
  const user = await getUserDoc(uid);

  if (user.isPremium) {
    return { allowed: true, remaining: null };
  }

  const today = todayKey();
  let count = user.coachMessagesToday || 0;
  if (user.coachMessagesDate !== today) {
    count = 0;
  }

  if (count >= FREE_DAILY_COACH_MESSAGES) {
    return { allowed: false, remaining: 0 };
  }

  await ref.set(
    {
      coachMessagesToday: count + 1,
      coachMessagesDate: today,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return {
    allowed: true,
    remaining: FREE_DAILY_COACH_MESSAGES - count - 1,
  };
}

/** POST /api/v1/coach/stt */
router.post("/stt", async (req, res) => {
  try {
    const { audioBase64, encoding, sampleRateHertz, languageCode } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const client = new speech.SpeechClient(getSpeechClientOptions());
    const audioBytes = Buffer.from(audioBase64, "base64");

    const config = {
      encoding: encoding || "LINEAR16",
      sampleRateHertz: sampleRateHertz || 16000,
      languageCode: languageCode || "en-US",
      enableAutomaticPunctuation: true,
    };

    const [response] = await client.recognize({
      audio: { content: audioBytes },
      config,
    });

    const result = response.results?.[0];
    const alternative = result?.alternatives?.[0];

    return res.json({
      transcript: alternative?.transcript?.trim() || "",
      confidence: alternative?.confidence ?? 0,
    });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({ error: "Speech recognition failed" });
  }
});

/** POST /api/v1/coach/message */
router.post("/message", async (req, res) => {
  try {
    const {
      message,
      userContext = {},
      runContext = null,
      isLiveRun = false,
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const limit = await checkAndIncrementCoachMessages(req.user.uid);
    if (!limit.allowed) {
      return res.status(429).json({
        error: "Daily coach message limit reached",
        limit: FREE_DAILY_COACH_MESSAGES,
        remaining: 0,
      });
    }

    const systemPrompt = buildSystemPrompt({
      isLiveRun,
      userContext,
      runContext,
    });

    let responseText;

    try {
      responseText = await withGeminiRetry(async () =>
        generateCoachResponse(systemPrompt, message),
      );
    } catch (geminiErr) {
      console.error("Gemini error:", geminiErr.message);
      responseText = pickFallback(isLiveRun);
      return res.json({
        response: isLiveRun
          ? truncateToTwoSentences(responseText)
          : responseText,
        fallback: true,
        remaining: limit.remaining,
      });
    }

    if (isLiveRun) {
      responseText = truncateToTwoSentences(responseText);
    }

    return res.json({
      response: responseText.trim(),
      fallback: false,
      remaining: limit.remaining,
    });
  } catch (err) {
    console.error("Coach message error:", err);
    return res.status(500).json({ error: "Failed to generate coach response" });
  }
});

/** POST /api/v1/coach/tts */
router.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const client = new textToSpeech.TextToSpeechClient(getTtsClientOptions());

    const [response] = await client.synthesizeSpeech({
      input: { text: text.slice(0, 5000) },
      voice: {
        languageCode: "en-US",
        name: "en-US-Wavenet-D",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.05,
        pitch: 0,
      },
    });

    const audioBase64 = Buffer.from(response.audioContent).toString("base64");

    return res.json({ audioBase64 });
  } catch (err) {
    console.error("TTS error:", err);
    return res.status(500).json({ error: "Text-to-speech failed" });
  }
});

module.exports = router;
