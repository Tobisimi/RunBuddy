import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import RunSetupScreen from "./RunSetupScreen";
import ActiveRunScreen from "./ActiveRunScreen";

export default function DashboardScreen({ userName }: { userName: string }) {
  const [showRunSetup, setShowRunSetup] = useState(false);
  const [showActiveRun, setShowActiveRun] = useState(false);
  const [runConfig, setRunConfig] = useState<{
    runType: "distance" | "time" | "open";
    goalValue: number | null;
    coachMode: string;
  } | null>(null);

  const handleStartRun = (
    runType: "distance" | "time" | "open",
    goalValue: number | null,
    coachMode: string,
  ) => {
    setRunConfig({ runType, goalValue, coachMode });
    setShowRunSetup(false);
    setShowActiveRun(true);
  };

  const handleEndRun = (runData: any) => {
    console.log("Run ended:", runData);
    setShowActiveRun(false);
    // TODO: Navigate to Run Summary screen
  };

  if (showActiveRun && runConfig) {
    return (
      <ActiveRunScreen
        runType={runConfig.runType}
        goalValue={runConfig.goalValue}
        coachMode={runConfig.coachMode}
        onEnd={handleEndRun}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Greeting + AI Insight pill */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good to see you, {userName}!</Text>
        <View style={styles.insightPill}>
          <Text style={styles.insightText}>✨ You're on fire 🔥</Text>
        </View>
      </View>

      {/* Start Run Hero CTA */}
      <TouchableOpacity
        style={styles.startRunButton}
        onPress={() => setShowRunSetup(true)}
      >
        <Text style={styles.startRunText}>Start Run</Text>
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total km</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0:00</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* AI Coach Card */}
      <TouchableOpacity style={styles.coachCard}>
        <Text style={styles.coachTitle}>🎙️ Ask your coach anything</Text>
      </TouchableOpacity>

      {/* Goal Progress Placeholder */}
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>Weekly Goal</Text>
        <Text style={styles.goalProgress}>0 / 25 km</Text>
      </View>

      {/* Recent Runs Placeholder */}
      <View style={styles.recentCard}>
        <Text style={styles.recentTitle}>Recent Runs</Text>
        <Text style={styles.recentEmpty}>No runs yet</Text>
      </View>

      {/* Run Setup Modal */}
      {showRunSetup && (
        <RunSetupScreen
          onStart={handleStartRun}
          onClose={() => setShowRunSetup(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 8,
  },
  insightPill: {
    backgroundColor: "#1a2238",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  insightText: {
    color: "#22d3ee",
    fontSize: 14,
  },
  startRunButton: {
    backgroundColor: "#a3e635",
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  startRunText: {
    color: "#0d1322",
    fontSize: 20,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#0f1524",
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#a3e635",
  },
  statLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  coachCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22d3ee",
    marginBottom: 24,
    alignItems: "center",
  },
  coachTitle: {
    fontSize: 18,
    color: "#22d3ee",
    fontWeight: "600",
  },
  goalCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  goalTitle: {
    fontSize: 16,
    color: "#f8fafc",
    marginBottom: 8,
  },
  goalProgress: {
    fontSize: 24,
    fontWeight: "700",
    color: "#a3e635",
  },
  recentCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    marginBottom: 80,
  },
  recentTitle: {
    fontSize: 16,
    color: "#f8fafc",
    marginBottom: 8,
  },
  recentEmpty: {
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 20,
  },
});
