export interface KalmanState {
  lat: number;
  lng: number;
  variance: number;
}

/**
 * Kalman filter for GPS coordinates.
 */
export function kalmanFilter(
  prev: KalmanState,
  newLat: number,
  newLng: number,
  accuracyMetres: number,
  processNoise = 0.0001,
  measurementNoise = 25,
): KalmanState {
  const R = measurementNoise * (accuracyMetres / 10);
  const predictedVariance = prev.variance + processNoise;
  const gain = predictedVariance / (predictedVariance + R);
  const smoothedLat = prev.lat + gain * (newLat - prev.lat);
  const smoothedLng = prev.lng + gain * (newLng - prev.lng);
  const updatedVariance = (1 - gain) * predictedVariance;
  return { lat: smoothedLat, lng: smoothedLng, variance: updatedVariance };
}

export function initKalmanState(lat: number, lng: number): KalmanState {
  return { lat, lng, variance: 1 };
}

export interface PaceWindowEntry {
  timestamp: number;
  distanceKm: number;
}

const ROLLING_WINDOW_MS = 20000; // 20 seconds

export function rollingWindowPace(window: PaceWindowEntry[]): number {
  if (window.length < 2) return 0;
  const now = Date.now();
  const cutoff = now - ROLLING_WINDOW_MS;
  const recent = window.filter((p) => p.timestamp >= cutoff);
  if (recent.length < 2) {
    const last = window.slice(-2);
    const dt = (last[1].timestamp - last[0].timestamp) / 1000;
    const dd = last[1].distanceKm - last[0].distanceKm;
    if (dd <= 0 || dt <= 0) return 0;
    return dt / 60 / dd;
  }
  const oldest = recent[0];
  const newest = recent[recent.length - 1];
  const elapsedSeconds = (newest.timestamp - oldest.timestamp) / 1000;
  const distanceCovered = newest.distanceKm - oldest.distanceKm;
  if (distanceCovered <= 0.001 || elapsedSeconds <= 0) return 0;
  return elapsedSeconds / 60 / distanceCovered;
}
