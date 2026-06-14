const { getAuth } = require("../config/firebase");

async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { verifyFirebaseToken };
