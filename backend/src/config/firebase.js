const admin = require("firebase-admin");

let initialized = false;

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || "";
  return raw.replace(/\\n/g, "\n");
}

function getGoogleCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

function initFirebase() {
  if (initialized) {
    return admin;
  }

  const credentials = getGoogleCredentials();
  if (!credentials) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    }),
  });

  initialized = true;
  return admin;
}

function getDb() {
  initFirebase();
  return admin.firestore();
}

function getAuth() {
  initFirebase();
  return admin.auth();
}

/** Parse optional JSON service account from GOOGLE_CLOUD_*_KEY env vars */
function parseOptionalServiceAccount(envKey) {
  const raw = process.env[envKey];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
}

function getSpeechClientOptions() {
  const sa =
    parseOptionalServiceAccount("GOOGLE_CLOUD_STT_KEY") ||
    getGoogleCredentials();
  if (!sa) return {};
  if (sa.client_email && sa.private_key) {
    return {
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key.replace(/\\n/g, "\n"),
      },
      projectId: sa.project_id || sa.projectId,
    };
  }
  return {
    credentials: {
      client_email: sa.clientEmail,
      private_key: sa.privateKey,
    },
    projectId: sa.projectId,
  };
}

function getTtsClientOptions() {
  const sa =
    parseOptionalServiceAccount("GOOGLE_CLOUD_TTS_KEY") ||
    getGoogleCredentials();
  if (!sa) return {};
  if (sa.client_email && sa.private_key) {
    return {
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key.replace(/\\n/g, "\n"),
      },
      projectId: sa.project_id || sa.projectId,
    };
  }
  return {
    credentials: {
      client_email: sa.clientEmail,
      private_key: sa.privateKey,
    },
    projectId: sa.projectId,
  };
}

module.exports = {
  initFirebase,
  getDb,
  getAuth,
  getSpeechClientOptions,
  getTtsClientOptions,
};
