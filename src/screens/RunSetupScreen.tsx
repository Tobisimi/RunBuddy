import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";

type RunType = "distance" | "time" | "open";
type CoachMode = "motivation" | "performance" | "endurance";

export default function RunSetupScreen({
  onStart,
  onClose,
}: {
  onStart: (
    runType: RunType,
    goalValue: number | null,
    coachMode: CoachMode,
  ) => void;
  onClose: () => void;
}) {
  const [runType, setRunType] = useState<RunType>("distance");
  const [goalValue, setGoalValue] = useState("5");
  const [coachMode, setCoachMode] = useState<CoachMode>("motivation");

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <View style={styles.container}>
        <Text style={styles.title}>Start Run</Text>

        {/* Run Type */}
        <Text style={styles.label}>Run Type</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pill, runType === "distance" && styles.pillActive]}
            onPress={() => setRunType("distance")}
          >
            <Text style={styles.pillText}>Distance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, runType === "time" && styles.pillActive]}
            onPress={() => setRunType("time")}
          >
            <Text style={styles.pillText}>Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, runType === "open" && styles.pillActive]}
            onPress={() => setRunType("open")}
          >
            <Text style={styles.pillText}>Open Run</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Value (if not open) */}
        {runType !== "open" && (
          <>
            <Text style={styles.label}>
              {runType === "distance" ? "Distance (km)" : "Time (minutes)"}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={goalValue}
              onChangeText={setGoalValue}
              placeholder="Enter value"
              placeholderTextColor="#64748b"
            />
          </>
        )}

        {/* Coach Mode */}
        <Text style={styles.label}>Coach Mode</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.pill,
              coachMode === "motivation" && styles.pillActive,
            ]}
            onPress={() => setCoachMode("motivation")}
          >
            <Text style={styles.pillText}>🔥 Motivation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pill,
              coachMode === "performance" && styles.pillActive,
            ]}
            onPress={() => setCoachMode("performance")}
          >
            <Text style={styles.pillText}>⚡ Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pill,
              coachMode === "endurance" && styles.pillActive,
            ]}
            onPress={() => setCoachMode("endurance")}
          >
            <Text style={styles.pillText}>🌿 Endurance</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            const goalNum = runType !== "open" ? parseFloat(goalValue) : null;
            onStart(runType, goalNum, coachMode);
          }}
        >
          <Text style={styles.startButtonText}>Start Run</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 12,
    marginTop: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  pill: {
    flex: 1,
    backgroundColor: "#1a2238",
    paddingVertical: 12,
    borderRadius: 32,
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#a3e635" },
  pillText: { color: "#f8fafc", fontWeight: "500" },
  input: {
    backgroundColor: "#1a2238",
    borderRadius: 12,
    padding: 14,
    color: "#f8fafc",
    fontSize: 16,
  },
  startButton: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginTop: 32,
  },
  startButtonText: { color: "#0d1322", fontSize: 18, fontWeight: "700" },
  cancelButton: { marginTop: 16, alignItems: "center" },
  cancelButtonText: { color: "#ef4458", fontSize: 16 },
});
