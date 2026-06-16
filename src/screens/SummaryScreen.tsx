import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { calculatePerformanceScore } from "../utils/runEngine";

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPace(paceMin: number) {
  if (!paceMin || paceMin <= 0) return "—";
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

export default function SummaryScreen({
  runData,
  onSave,
}: {
  runData: {
    distance: number;
    duration: number;
    pace: number;
    bestPace?: number;
    calories: number;
    goalType?: string;
    goalValue?: number | null;
  };
  onSave: () => void;
}) {
  const performanceScore = useMemo(
    () =>
      calculatePerformanceScore({
        distance: runData.distance,
        duration: runData.duration,
        pace: runData.pace,
        bestPace: runData.bestPace || runData.pace,
        goalType: runData.goalType,
        goalValue: runData.goalValue,
      }),
    [runData],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run Complete</Text>

      <View style={styles.scoreRing}>
        <Text style={styles.scoreValue}>{performanceScore}</Text>
        <Text style={styles.scoreLabel}>Performance</Text>
      </View>

      <Text style={styles.distance}>{runData.distance.toFixed(2)} km</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(runData.duration)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(runData.pace)}</Text>
          <Text style={styles.statLabel}>Avg pace</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatPace(runData.bestPace || runData.pace)}
          </Text>
          <Text style={styles.statLabel}>Best pace</Text>
        </View>
      </View>

      <Text style={styles.calories}>{runData.calories} calories burned</Text>

      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#a3e635",
    marginBottom: 24,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#22d3ee",
    fontVariant: ["tabular-nums"],
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
    marginTop: 2,
  },
  distance: {
    fontSize: 48,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 20,
    fontVariant: ["tabular-nums"],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
    fontVariant: ["tabular-nums"],
  },
  statLabel: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  calories: { fontSize: 15, color: "#94a3b8", marginBottom: 32 },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 40,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: { color: "#0d1322", fontSize: 18, fontWeight: "600" },
});
