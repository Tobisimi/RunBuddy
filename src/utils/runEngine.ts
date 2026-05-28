import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";

// Types
export interface RunData {
  id?: string;
  distance: number; // km
  duration: number; // seconds
  pace: number; // min/km
  calories: number;
  route: Location.LocationObjectCoords[];
  startTime: number;
  endTime?: number;
  status: "active" | "paused" | "completed" | "pending_sync";
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("runbuddy.db");
  }
  return db;
}

// Haversine formula – calculates distance between two GPS points in km
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 3-point moving average smoothing
export function smoothCoordinates(
  points: Location.LocationObjectCoords[],
): Location.LocationObjectCoords {
  if (points.length < 3) return points[points.length - 1];

  const lastThree = points.slice(-3);
  const avgLat = lastThree.reduce((sum, p) => sum + p.latitude, 0) / 3;
  const avgLng = lastThree.reduce((sum, p) => sum + p.longitude, 0) / 3;

  return {
    latitude: avgLat,
    longitude: avgLng,
    altitude: points[points.length - 1].altitude,
    accuracy: points[points.length - 1].accuracy,
    altitudeAccuracy: points[points.length - 1].altitudeAccuracy,
    heading: points[points.length - 1].heading,
    speed: points[points.length - 1].speed,
  };
}

// Calculate calories based on MET and weight
export function calculateCalories(
  weightMidpoint: number,
  durationHours: number,
  pace: number,
): number {
  let met = 8.3;
  if (pace < 5) met = 11.0;
  else if (pace < 6) met = 9.8;
  else if (pace < 7) met = 8.3;
  else if (pace < 8) met = 7.0;
  else met = 6.0;
  return Math.round(met * weightMidpoint * durationHours);
}

// Weight range to midpoint mapping
export function getWeightMidpoint(weightRange: string): number {
  const map: Record<string, number> = {
    "Below 40kg": 38,
    "40–44kg": 42,
    "45–49kg": 47,
    "50–54kg": 52,
    "55–59kg": 57,
    "60–64kg": 62,
    "65–69kg": 67,
    "70–74kg": 72,
    "75–79kg": 77,
    "80–84kg": 82,
    "85–89kg": 87,
    "90–94kg": 92,
    "95–99kg": 97,
    "Above 100kg": 105,
  };
  return map[weightRange] || 72;
}

// Initialize database tables
export async function initDatabase() {
  const database = await getDatabase();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      distance REAL,
      duration INTEGER,
      pace REAL,
      calories INTEGER,
      route TEXT,
      startTime INTEGER,
      endTime INTEGER,
      status TEXT,
      localId TEXT UNIQUE
    );
  `);
}

// Save run to local SQLite
export async function saveRunToLocal(runData: RunData) {
  const database = await getDatabase();
  const stmt = await database.prepareAsync(
    `INSERT OR REPLACE INTO runs (id, distance, duration, pace, calories, route, startTime, endTime, status, localId) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  await stmt.executeAsync([
    runData.id || null,
    runData.distance,
    runData.duration,
    runData.pace,
    runData.calories,
    JSON.stringify(runData.route),
    runData.startTime,
    runData.endTime || null,
    runData.status,
    runData.id || Date.now().toString(),
  ]);

  await stmt.finalizeAsync();
}

// Get active run (for resume after crash)
export async function getActiveRun(): Promise<RunData | null> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM runs WHERE status IN ('active', 'paused') ORDER BY startTime DESC LIMIT 1`,
  );

  if (result.length === 0) return null;

  const row = result[0];
  return {
    id: row.id,
    distance: row.distance,
    duration: row.duration,
    pace: row.pace,
    calories: row.calories,
    route: JSON.parse(row.route),
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
  };
}
