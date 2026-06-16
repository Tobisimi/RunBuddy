const express = require("express");
const { getDb } = require("../config/firebase");

const router = express.Router();

const FREE_DAILY_RUNS = Number(process.env.FREE_DAILY_RUNS || 10);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getUserDoc(uid) {
  const snap = await getDb().collection("users").doc(uid).get();
  return snap.exists ? snap.data() : {};
}

async function checkDailyRunLimit(uid) {
  const user = await getUserDoc(uid);
  if (user.isPremium) return { allowed: true };

  const today = todayKey();
  let count = user.runsStartedToday || 0;
  if (user.runsDate !== today) count = 0;

  if (count >= FREE_DAILY_RUNS) {
    return { allowed: false, limit: FREE_DAILY_RUNS };
  }
  return { allowed: true };
}

async function incrementRunsStarted(uid) {
  const ref = getDb().collection("users").doc(uid);
  const user = await getUserDoc(uid);
  const today = todayKey();
  let count = user.runsStartedToday || 0;
  if (user.runsDate !== today) count = 0;

  await ref.set(
    {
      runsStartedToday: count + 1,
      runsDate: today,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** POST /api/v1/runs/start */
router.post("/start", async (req, res) => {
  try {
    const { goalType, goalValue, coachMode } = req.body;
    const limit = await checkDailyRunLimit(req.user.uid);

    if (!limit.allowed) {
      return res.status(429).json({
        error: "Daily run limit reached",
        limit: limit.limit,
      });
    }

    const now = new Date().toISOString();
    const docRef = getDb().collection("runs").doc();

    const run = {
      userId: req.user.uid,
      goalType: goalType || "open",
      goalValue: goalValue ?? null,
      coachMode: coachMode || "motivation",
      distance: 0,
      durationSeconds: 0,
      averagePace: 0,
      bestPace: 0,
      caloriesBurned: 0,
      route: [],
      startedAt: now,
      endedAt: null,
      status: "active",
      createdAt: now,
    };

    await docRef.set(run);
    await incrementRunsStarted(req.user.uid);

    return res.status(201).json({ runId: docRef.id, ...run });
  } catch (err) {
    console.error("Run start error:", err);
    return res.status(500).json({ error: "Failed to start run" });
  }
});

/** POST /api/v1/runs/:runId/end */
router.post("/:runId/end", async (req, res) => {
  try {
    const { runId } = req.params;
    const {
      distance,
      durationSeconds,
      averagePace,
      bestPace,
      caloriesBurned,
      route,
      coachMode,
      goalType,
      goalValue,
      startedAt,
    } = req.body;

    const ref = getDb().collection("runs").doc(runId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Run not found" });
    }

    const existing = snap.data();
    if (existing.userId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const endedAt = new Date().toISOString();
    const update = {
      distance: distance ?? existing.distance,
      durationSeconds: durationSeconds ?? existing.durationSeconds,
      averagePace: averagePace ?? existing.averagePace,
      bestPace: bestPace ?? existing.bestPace,
      caloriesBurned: caloriesBurned ?? existing.caloriesBurned,
      route: route ?? existing.route,
      coachMode: coachMode ?? existing.coachMode,
      goalType: goalType ?? existing.goalType,
      goalValue: goalValue ?? existing.goalValue,
      startedAt: startedAt ?? existing.startedAt,
      endedAt,
      status: "completed",
      updatedAt: endedAt,
    };

    await ref.update(update);

    // Update user aggregates
    const userRef = getDb().collection("users").doc(req.user.uid);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? userSnap.data() : {};
    const prevRuns = user.totalRuns || 0;
    const prevDistance = user.totalDistance || 0;
    const newDistance = update.distance || 0;
    const totalDistance = prevDistance + newDistance;
    const totalRuns = prevRuns + 1;
    const prevAvg = user.averagePace || 0;
    const newAvgPace =
      totalRuns > 0
        ? (prevAvg * prevRuns + (update.averagePace || 0)) / totalRuns
        : update.averagePace || 0;

    await userRef.set(
      {
        totalRuns,
        totalDistance,
        averagePace: newAvgPace,
        totalCalories: (user.totalCalories || 0) + (update.caloriesBurned || 0),
        weeklyDistance: (user.weeklyDistance || 0) + newDistance,
        updatedAt: endedAt,
      },
      { merge: true },
    );

    return res.json({ runId, ...existing, ...update });
  } catch (err) {
    console.error("Run end error:", err);
    return res.status(500).json({ error: "Failed to end run" });
  }
});

/** GET /api/v1/runs */
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const snapshot = await getDb()
      .collection("runs")
      .where("userId", "==", req.user.uid)
      .limit(limit)
      .get();

    const runs = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));

    return res.json({ runs });
  } catch (err) {
    console.error("List runs error:", err);
    return res.status(500).json({ error: "Failed to fetch runs" });
  }
});

module.exports = router;
