const express = require("express");
const { getDb } = require("../config/firebase");

const router = express.Router();

/** GET /api/v1/users/me */
router.get("/me", async (req, res) => {
  try {
    const snap = await getDb().collection("users").doc(req.user.uid).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    return res.json({ id: req.user.uid, ...snap.data() });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
