import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { runsApi } from "./api";

export interface RunConfig {
  runType: "distance" | "time" | "open";
  goalValue: number | null;
  coachMode: string;
}

export async function startRunSession(
  config: RunConfig,
): Promise<string | null> {
  try {
    const res = await runsApi.start({
      goalType: config.runType,
      goalValue: config.goalValue,
      coachMode: config.coachMode,
    });
    return res.runId;
  } catch (err) {
    console.warn("API run start failed, using Firestore fallback:", err);
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    const ref = await addDoc(collection(db, "runs"), {
      userId: uid,
      goalType: config.runType,
      goalValue: config.goalValue,
      coachMode: config.coachMode,
      distance: 0,
      durationSeconds: 0,
      averagePace: 0,
      bestPace: 0,
      caloriesBurned: 0,
      route: [],
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "active",
    });
    return ref.id;
  }
}

export async function completeRunSession(
  runId: string | null,
  payload: {
    distance: number;
    duration: number;
    pace: number;
    bestPace: number;
    calories: number;
    route: unknown[];
    startTime: number;
    endTime: number;
    coachMode: string;
    goalType: string;
    goalValue: number | null;
  },
) {
  const body = {
    distance: payload.distance,
    durationSeconds: payload.duration,
    averagePace: payload.pace,
    bestPace: payload.bestPace,
    caloriesBurned: payload.calories,
    route: payload.route,
    coachMode: payload.coachMode,
    goalType: payload.goalType,
    goalValue: payload.goalValue,
    startedAt: new Date(payload.startTime).toISOString(),
  };

  if (runId) {
    try {
      await runsApi.end(runId, body);
      return;
    } catch (err) {
      console.warn("API run end failed, using Firestore fallback:", err);
    }
  }

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const endedAt = new Date(payload.endTime).toISOString();

  if (runId) {
    await updateDoc(doc(db, "runs", runId), {
      ...body,
      endedAt,
      status: "completed",
    });
  } else {
    await addDoc(collection(db, "runs"), {
      userId: uid,
      ...body,
      endedAt,
      status: "completed",
    });
  }

  const userRef = doc(db, "users", uid);
  const { getDoc } = await import("firebase/firestore");
  const userSnap = await getDoc(userRef);
  const user = userSnap.exists() ? userSnap.data() : {};
  const prevRuns = user.totalRuns || 0;
  const totalRuns = prevRuns + 1;
  const totalDistance = (user.totalDistance || 0) + payload.distance;
  const averagePace =
    totalRuns > 0
      ? ((user.averagePace || 0) * prevRuns + payload.pace) / totalRuns
      : payload.pace;

  await setDoc(
    userRef,
    {
      totalRuns,
      totalDistance,
      averagePace,
      totalCalories: (user.totalCalories || 0) + payload.calories,
      updatedAt: endedAt,
    },
    { merge: true },
  );
}
