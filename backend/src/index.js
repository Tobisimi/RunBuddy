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

// Health check – keep this as plain "OK"
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// 👇 REPLACE this root route with the HTML landing page
app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>RunBuddy API</title>
        <style>
          body { font-family: Inter, sans-serif; background: #0a0f1c; color: #f8fafc; padding: 2rem; }
          h1 { color: #a3e635; }
          a { color: #22d3ee; }
          .card { background: #0f1524; padding: 2rem; border-radius: 16px; max-width: 600px; margin: 2rem auto; }
          ul { list-style: none; padding: 0; }
          li { padding: 0.5rem 0; border-bottom: 1px solid #222b40; }
          code { background: #171f33; padding: 0.2rem 0.5rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🏃 RunBuddy API</h1>
          <p>Your AI running coach backend — built for the RunBuddy mobile app.</p>
          <p><strong>Status:</strong> <span style="color:#a3e635;">● Online</span></p>
          <h2>Available Endpoints</h2>
          <ul>
            <li><code>GET /health</code> — service health check</li>
            <li><code>POST /api/v1/auth/me</code> — authenticate user</li>
            <li><code>GET /api/v1/users/profile</code> — get user profile</li>
            <li><code>POST /api/v1/runs/start</code> — start a run</li>
            <li><code>POST /api/v1/coach/message</code> — send a coaching message</li>
            <li><em>…and more. See the spec for full API details.</em></li>
          </ul>
          <p style="margin-top:2rem;">📱 <a href="#">RunBuddy mobile app</a> (coming soon)</p>
        </div>
      </body>
    </html>
  `);
});
// 👆 End of root route replacement

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
