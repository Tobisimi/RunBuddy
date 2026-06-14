const { GoogleGenerativeAI } = require("@google/generative-ai");
const { VertexAI } = require("@google-cloud/vertexai");

function getServiceAccountCredentials() {
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  if (!email || !privateKey) return null;
  return { client_email: email, private_key: privateKey };
}

/** True only for a normal Google API key (not OAuth access token). */
function hasApiKey() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  return key.startsWith("AIza") && key.length > 30;
}

async function generateWithApiKey(systemPrompt, message) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(message);
  return result.response.text();
}

/** Uses the same Firebase service account already in backend/.env */
async function generateWithServiceAccount(systemPrompt, message) {
  const project = process.env.FIREBASE_PROJECT_ID;
  const credentials = getServiceAccountCredentials();
  if (!project || !credentials) {
    throw new Error("Missing Firebase service account for Vertex AI");
  }

  const location = process.env.GEMINI_VERTEX_LOCATION || "us-central1";
  const vertexAI = new VertexAI({
    project,
    location,
    googleAuthOptions: { credentials },
  });

  const model = vertexAI.getGenerativeModel({
    model: process.env.GEMINI_VERTEX_MODEL || "gemini-1.5-pro-002",
    systemInstruction: { parts: [{ text: systemPrompt }] },
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: message }] }],
  });

  const part = result.response?.candidates?.[0]?.content?.parts?.[0];
  return part?.text || "";
}

async function generateCoachResponse(systemPrompt, message) {
  if (hasApiKey()) {
    return generateWithApiKey(systemPrompt, message);
  }
  return generateWithServiceAccount(systemPrompt, message);
}

module.exports = { generateCoachResponse, hasApiKey, getServiceAccountCredentials };
