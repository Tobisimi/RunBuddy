import { useEffect, useRef, useState, useCallback } from "react";
import { Pedometer, Accelerometer } from "expo-sensors";

const HARDWARE_SENSOR_TIMEOUT_MS = 10_000;
const CADENCE_WINDOW_MS = 5_000;
const AVERAGE_STRIDE_LENGTH_M = 0.78;

export type StepSource = "hardware" | "accelerometer" | "unavailable";

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
  source: "unavailable",
  supported: false,
};

export function useStepCounter(
  isActive: boolean,
  isPaused: boolean,
  calibratedStrideLengthM?: number,
): StepData {
  const [data, setData] = useState<StepData>(DEFAULT_STEP_DATA);
  const strideLength = calibratedStrideLengthM ?? AVERAGE_STRIDE_LENGTH_M;
  const stepsRef = useRef(0);
  const startStepsRef = useRef<number | null>(null);
  const cadenceWindowRef = useRef<{ timestamp: number; steps: number }[]>([]);
  const hardwareSubRef = useRef<any>(null);
  const accelSubRef = useRef<any>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardwareFiredRef = useRef(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const updateFromSteps = useCallback(
    (runSteps: number, source: StepSource) => {
      const now = Date.now();

      cadenceWindowRef.current = [
        ...cadenceWindowRef.current.filter(
          (e) => e.timestamp >= now - CADENCE_WINDOW_MS,
        ),
        { timestamp: now, steps: runSteps },
      ];

      let cadence = 0;
      if (cadenceWindowRef.current.length >= 2) {
        const oldest = cadenceWindowRef.current[0];
        const newest =
          cadenceWindowRef.current[cadenceWindowRef.current.length - 1];
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
    },
    [strideLength],
  );

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
          updateFromSteps(count, "accelerometer");
        }
      }
    });
  }, [updateFromSteps]);

  const startHardwareSensor = useCallback(async (): Promise<boolean> => {
    const available = await Pedometer.isAvailableAsync().catch(() => false);
    if (!available) return false;

    const { granted } = await Pedometer.requestPermissionsAsync();
    if (!granted) return false;

    hardwareSubRef.current = Pedometer.watchStepCount((result) => {
      if (isPausedRef.current) return;

      if (startStepsRef.current === null) {
        startStepsRef.current = result.steps;
      }

      if (!hardwareFiredRef.current) {
        hardwareFiredRef.current = true;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }

      const runSteps = result.steps - startStepsRef.current;
      stepsRef.current = runSteps;
      updateFromSteps(runSteps, "hardware");
    });

    return true;
  }, [updateFromSteps]);

  useEffect(() => {
    if (!isActive) return;

    const init = async () => {
      const hardwareStarted = await startHardwareSensor();

      if (!hardwareStarted) {
        startAccelerometerFallback();
        return;
      }

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
  }, [isActive]);

  return data;
}
