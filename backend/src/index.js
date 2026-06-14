require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initFirebase } = require("./config/firebase");
const { verifyFirebaseToken } = require("./middleware/auth");
const coachRoutes = require("./routes/coach");
const runsRoutes = require("./routes/runs");
const usersRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "runbuddy-api" });
});

try {
  initFirebase();
} catch (err) {
  console.warn("Firebase init warning:", err.message);
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

app.listen(PORT, () => {
  console.log(`RunBuddy API listening on port ${PORT}`);
});
