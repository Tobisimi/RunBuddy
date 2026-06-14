export type CoachOrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export interface CompletedRunPayload {
  distance: number;
  duration: number;
  pace: number;
  bestPace: number;
  calories: number;
  route: unknown[];
  startTime: number;
  endTime: number;
  status: string;
  runId?: string;
  goalType?: string;
  goalValue?: number | null;
  coachMode?: string;
}
