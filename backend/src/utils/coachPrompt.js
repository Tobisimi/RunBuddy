function buildSystemPrompt({ isLiveRun, userContext, runContext }) {
  const name = userContext?.name || "Runner";
  const age = userContext?.age ?? "";
  const weightRange = userContext?.weightRange || "";
  const fitnessLevel = userContext?.fitnessLevel || "";
  const goal = userContext?.goal || userContext?.customGoal || "";

  const liveLine = isLiveRun
    ? "LIVE RUN: Maximum 2 sentences. Short. Fast. Clear."
    : "COACH SCREEN: More detail is fine.";

  let runLine = "";
  if (runContext) {
    const distance = runContext.distance ?? 0;
    const pace = runContext.pace ?? 0;
    const durationSeconds = runContext.durationSeconds ?? 0;
    const coachMode = runContext.coachMode || "motivation";
    const cadence = runContext.cadenceSpm
      ? ` | cadence:${runContext.cadenceSpm}spm`
      : "";
    runLine = `CURRENT RUN: ${distance}km | ${pace}min/km | ${durationSeconds}s | mode: ${coachMode}${cadence}`;
  }

  return `You are RunBuddy, a live AI running coach. You are not an assistant. You are a coach.
Warm, honest, direct, and encouraging. You know this runner personally. Never give generic advice.
${liveLine}
Coaching knowledge: easy pace = conversational, 10% weekly mileage rule, 170-180 cadence spm,
3:2 breathing rhythm, recovery days are training, stay hydrated all day.
SAFETY: If user mentions chest pain, dizziness, or numbness — respond ONLY:
"Stop running right now. This could be serious. Please seek medical attention immediately."
If you don't understand: say "Sorry, I didn't get that. Go ahead."
USER: Name: ${name}, Age: ${age}, Weight: ${weightRange}, Level: ${fitnessLevel}, Goal: ${goal}
${runLine ? runLine : ""}`.trim();
}

function truncateToTwoSentences(text) {
  if (!text) return "";
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts || parts.length <= 2) return text.trim();
  return parts.slice(0, 2).join(" ").trim();
}

const LIVE_FALLBACKS = [
  "Keep that rhythm — you're doing well. Stay relaxed through the shoulders.",
  "Nice work. Focus on steady breathing and let your pace settle.",
  "You're on track. Short steps, tall posture, and keep it conversational.",
];

const COACH_FALLBACKS = [
  "I'm having a brief connection issue. Ask me again in a moment — I'm still here for you.",
  "Couldn't reach the coach servers right now. Try your question again shortly.",
];

function pickFallback(isLiveRun) {
  const list = isLiveRun ? LIVE_FALLBACKS : COACH_FALLBACKS;
  return list[Math.floor(Math.random() * list.length)];
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withGeminiRetry(fn, retries = 2, delayMs = 800) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw lastError;
}

module.exports = {
  buildSystemPrompt,
  truncateToTwoSentences,
  pickFallback,
  withGeminiRetry,
};
