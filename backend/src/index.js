require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initFirebase } = require("./config/firebase");
const { verifyFirebaseToken } = require("./middleware/auth");
const coachRoutes = require("./routes/coach");
const runsRoutes = require("./routes/runs");
const usersRoutes = require("./routes/users");

const app = express();
console.log("Railway PORT:", process.env.PORT);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

try {
  initFirebase();
  console.log("✅ Firebase initiated");
} catch (error) {
  console.error("❌ FIREBASE FAILED:", error.message);
}

const api = express.Router();
api.use(verifyFirebaseToken);
api.use("/coach", coachRoutes);
api.use("/runs", runsRoutes);
api.use("/users", usersRoutes);

app.use("/api/v1", api);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RunBuddy API listening on port ${PORT}`);
});
