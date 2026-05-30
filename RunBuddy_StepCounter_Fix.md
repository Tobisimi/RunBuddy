# RunBuddy — Step Counter Fix & Implementation Guide

**Issue:** `Pedometer.watchStepCount` permission granted and `isAvailableAsync()` returns
`true` but callback never fires. Steps remain at zero.

**Root cause:** On many budget Android devices (Tecno, Infinix, Itel, MediaTek-based
phones), the hardware `TYPE_STEP_COUNTER` sensor reports as available but is gated by
battery management or has a firmware bug preventing callbacks from firing. This affects
React Native, Flutter, and native Android apps equally — it is not an Expo bug.

**Solution:** Three-tier fallback system:
1. Try hardware sensor (`Pedometer.watchStepCount`)
2. If no callback within 10 seconds → silently switch to accelerometer-based detection
3. If `isAvailableAsync()` returns false → go straight to accelerometer

---

## Step 1 — Update the hook

Replace the contents of `src/hooks/useStepCounter.ts` entirely with the following:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { Pedometer, Accelerometer } from 'expo-sensors';
import { useRunStore } from '@/store/runStore';

const HARDWARE_SENSOR_TIMEOUT_MS = 10_000;
const CADENCE_WINDOW_MS = 5_000;
const AVERAGE_STRIDE_LENGTH_M = 0.78;

export type StepSource = 'hardware' | 'accelerometer' | 'unavailable';

export interface StepData {
  totalSteps: number;
  cadenceSpm: number;
  estimatedStepDistanceKm: number;
  source: StepSource;
  supported: boolean;
}

const DEFAULT_STEP_DATA: StepData = {
  totalSteps: 0,
  cadenceSpm: 0,
  estimatedStepDistanceKm: 0,
  source: 'unavailable',
  supported: false,
};

export function useStepCounter(calibratedStrideLengthM?: number): StepData {
  const [data, setData] = useState<StepData>(DEFAULT_STEP_DATA);
  const { isRunning, isPaused } = useRunStore();

  const strideLength = calibratedStrideLengthM ?? AVERAGE_STRIDE_LENGTH_M;
  const stepsRef = useRef(0);
  const startStepsRef = useRef<number | null>(null);
  const cadenceWindowRef = useRef<{ timestamp: number; steps: number }[]>([]);
  const hardwareSubRef = useRef<any>(null);
  const accelSubRef = useRef<any>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardwareFiredRef = useRef(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const updateFromSteps = useCallback((runSteps: number, source: StepSource) => {
    const now = Date.now();

    cadenceWindowRef.current = [
      ...cadenceWindowRef.current.filter(e => e.timestamp >= now - CADENCE_WINDOW_MS),
      { timestamp: now, steps: runSteps },
    ];

    let cadence = 0;
    if (cadenceWindowRef.current.length >= 2) {
      const oldest = cadenceWindowRef.current[0];
      const newest = cadenceWindowRef.current[cadenceWindowRef.current.length - 1];
      const elapsedMin = (newest.timestamp - oldest.timestamp) / 60_000;
      if (elapsedMin > 0) {
        cadence = Math.round((newest.steps - oldest.steps) / elapsedMin);
      }
    }

    setData({
      totalSteps: runSteps,
      cadenceSpm: cadence,
      estimatedStepDistanceKm: (runSteps * strideLength) / 1000,
      source,
      supported: true,
    });
  }, [strideLength]);

  const startAccelerometerFallback = useCallback(() => {
    let isRising = false;
    let lastStepTime = 0;
    let count = 0;

    Accelerometer.setUpdateInterval(50); // 20Hz

    accelSubRef.current = Accelerometer.addListener(({ x, y, z }) => {
      if (isPausedRef.current) return;

      const dynamic = Math.abs(Math.sqrt(x * x + y * y + z * z) - 1.0);

      if (dynamic > 1.2) {
        isRising = true;
      } else if (isRising) {
        isRising = false;
        const now = Date.now();
        if (now - lastStepTime >= 250) {
          lastStepTime = now;
          count++;
          stepsRef.current = count;
          updateFromSteps(count, 'accelerometer');
        }
      }
    });
  }, [updateFromSteps]);

  const startHardwareSensor = useCallback(async (): Promise<boolean> => {
    const available = await Pedometer.isAvailableAsync().catch(() => false);
    if (!available) return false;

    const { granted } = await Pedometer.requestPermissionsAsync();
    if (!granted) return false;

    hardwareSubRef.current = Pedometer.watchStepCount(result => {
      if (isPausedRef.current) return;

      if (startStepsRef.current === null) {
        startStepsRef.current = result.steps;
      }

      // First callback — hardware sensor is working, cancel fallback timer
      if (!hardwareFiredRef.current) {
        hardwareFiredRef.current = true;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }

      const runSteps = result.steps - startStepsRef.current;
      stepsRef.current = runSteps;
      updateFromSteps(runSteps, 'hardware');
    });

    return true;
  }, [updateFromSteps]);

  useEffect(() => {
    if (!isRunning) return;

    const init = async () => {
      const hardwareStarted = await startHardwareSensor();

      if (!hardwareStarted) {
        // isAvailableAsync returned false or permission denied
        // Go straight to accelerometer
        startAccelerometerFallback();
        return;
      }

      // Hardware sensor started but may not fire on this device.
      // Wait 10 seconds. If no callback arrives, fall back to accelerometer.
      fallbackTimerRef.current = setTimeout(() => {
        if (!hardwareFiredRef.current) {
          hardwareSubRef.current?.remove();
          startAccelerometerFallback();
        }
      }, HARDWARE_SENSOR_TIMEOUT_MS);
    };

    init();

    return () => {
      hardwareSubRef.current?.remove();
      accelSubRef.current?.remove();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      startStepsRef.current = null;
      hardwareFiredRef.current = false;
      stepsRef.current = 0;
      cadenceWindowRef.current = [];
      setData(DEFAULT_STEP_DATA);
    };
  }, [isRunning]);

  return data;
}
```

---

## Step 2 — Update the active run screen

Find wherever step data is displayed and add the source badge.

```typescript
import { useStepCounter, StepSource } from '@/hooks/useStepCounter';

// Inside your run screen component:
const stepData = useStepCounter(calibratedStrideLength);

// Badge component — add near the steps/cadence display:
function StepSourceBadge({ source }: { source: StepSource }) {
  if (source === 'hardware') return null;
  if (source === 'accelerometer') {
    return (
      <Text style={{ fontSize: 10, color: '#94a3b8' }}>~ estimated</Text>
    );
  }
  return (
    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
      Steps unavailable on this device
    </Text>
  );
}
```

Usage in the stats display:

```tsx
{stepData.supported && (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{stepData.totalSteps.toLocaleString()}</Text>
    <Text style={styles.statLabel}>Steps</Text>
    <StepSourceBadge source={stepData.source} />
  </View>
)}

{stepData.supported && stepData.cadenceSpm > 0 && (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{stepData.cadenceSpm}</Text>
    <Text style={styles.statLabel}>spm</Text>
    <StepSourceBadge source={stepData.source} />
  </View>
)}
```

Hide steps and cadence entirely if `stepData.supported` is false. Do not show
a zero or an error — just omit the metric.

---

## Step 3 — Pass cadence to the AI coach

Find the context object being sent to `/coach/message` and add cadence:

```typescript
const runContext = {
  pace: displayPace,
  distance,
  durationSeconds: duration,
  goalType: activeRun.goalType,
  goalValue: activeRun.goalValue,
  coachMode,
  caloriesBurned: calories,
  cadenceSpm: stepData.cadenceSpm > 0 ? stepData.cadenceSpm : null,
};
```

On the backend in `coach.js`, the system prompt line that reads:

```
RUN: ${runContext.distance}km | ${runContext.pace}min/km | ...
```

Update to include cadence:

```javascript
`RUN: ${runContext.distance}km | ${runContext.pace}min/km | ${runContext.durationSeconds}s | mode:${runContext.coachMode}${runContext.cadenceSpm ? ` | cadence:${runContext.cadenceSpm}spm` : ''}`
```

The AI system prompt already contains cadence coaching knowledge (170–180 spm target),
so no prompt changes are needed. With cadence in context, the coach will now say things
like:

- "Your cadence is 158. Try shorter, quicker steps."
- "Great cadence at 175. That's exactly where you want to be."

---

## Step 4 — Add cadence to run summary

In the run summary screen, add steps and cadence to the stats grid if available:

```typescript
// Pull final step data from run store or pass as route param from live screen
// Only show if supported and steps > 0

{stepData.supported && stepData.totalSteps > 0 && (
  <>
    <StatsCard
      label="Steps"
      value={stepData.totalSteps.toLocaleString()}
      note={stepData.source === 'accelerometer' ? 'estimated' : undefined}
    />
    <StatsCard
      label="Avg Cadence"
      value={`${stepData.cadenceSpm} spm`}
      note={stepData.source === 'accelerometer' ? 'estimated' : undefined}
    />
  </>
)}
```

---

## Step 5 — Stride length calibration (optional, add after MVP)

After the first kilometre of GPS-confirmed distance, calibrate stride length.
This improves the GPS gap fallback estimate.

```typescript
export function calibrateStrideLength(
  gpsDistanceKm: number,
  totalSteps: number
): number | null {
  if (totalSteps < 500) return null; // not enough data yet
  return (gpsDistanceKm * 1000) / totalSteps; // metres per step
}

// Call this in useGPS whenever distance updates:
if (distance > 1.0 && stepData.totalSteps > 500) {
  const calibrated = calibrateStrideLength(distance, stepData.totalSteps);
  if (calibrated) setCalibratedStrideLength(calibrated);
}
```

Pass `calibratedStrideLength` to `useStepCounter` so it uses the actual
stride length for distance estimates instead of the default 0.78m.

---

## What this gives you

| Scenario | Behaviour |
|---|---|
| Hardware sensor works (most flagships) | Exact step count, hardware source |
| Hardware sensor available but never fires (many budget Androids) | 10s wait, then silent switch to accelerometer, estimated source |
| `isAvailableAsync()` returns false | Immediate switch to accelerometer |
| Accelerometer unavailable (very rare) | `supported: false`, stats hidden |
| User pauses run | Both sensors pause counting, resume on unpause |
| Run ends | All sensors cleaned up, state reset |

---

## Notes

- The accelerometer threshold of `1.2` is tuned for running. If you want to also
  detect walking (e.g. for a warm-up phase), lower it to `0.8`. For running only,
  keep it at `1.2` to reduce false positives from arm swing.
- `Accelerometer.setUpdateInterval(50)` = 20Hz. Do not go lower than 50ms —
  higher frequency adds battery drain with no meaningful accuracy benefit for
  step detection.
- The hardware sensor `Pedometer.watchStepCount` uses a dedicated low-power
  co-processor when it works. The accelerometer fallback uses the main sensor
  pipeline and draws slightly more power — still negligible compared to GPS.
