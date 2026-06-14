import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import RunSetupScreen from "./RunSetupScreen";
import { usersApi } from "../services/api";
import { startRunSession } from "../services/runSync";

interface DashboardScreenProps {
  userName: string;
  onStartRun: (
    runType: "distance" | "time" | "open",
    goalValue: number | null,
    coachMode: string,
    runId: string | null,
  ) => void;
  onOpenCoach: () => void;
  onUpgrade: () => void;
}

function formatPace(paceMin: number) {
  if (!paceMin || paceMin <= 0) return "0:00";
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function FadeUpCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen({
  userName,
  onStartRun,
  onOpenCoach,
}: DashboardScreenProps) {
  const [showRunSetup, setShowRunSetup] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    averagePace: 0,
    totalCalories: 0,
    weeklyDistance: 0,
    weeklyGoal: 25,
  });
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.04,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [breathe]);

  useEffect(() => {
    usersApi
      .me()
      .then((data) => {
        setStats({
          totalDistance: (data.totalDistance as number) || 0,
          totalRuns: (data.totalRuns as number) || 0,
          averagePace: (data.averagePace as number) || 0,
          totalCalories: (data.totalCalories as number) || 0,
          weeklyDistance: (data.weeklyDistance as number) || 0,
          weeklyGoal: (data.weeklyGoal as number) || 25,
        });
      })
      .catch(() => {});
  }, []);

  const weeklyProgress = Math.min(
    stats.weeklyDistance / stats.weeklyGoal,
    1,
  );
  const ringSize = 88;
  const stroke = 8;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - weeklyProgress);

  const handleStartRun = async (
    runType: "distance" | "time" | "open",
    goalValue: number | null,
    coachMode: string,
  ) => {
    setStarting(true);
    try {
      const runId = await startRunSession({
        runType,
        goalValue,
        coachMode,
      });
      onStartRun(runType, goalValue, coachMode, runId);
    } finally {
      setStarting(false);
      setShowRunSetup(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good to see you, {userName}!</Text>
        <View style={styles.insightPill}>
          <Text style={styles.insightText}>✨ You're on fire 🔥</Text>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: breathe }] }}>
        <TouchableOpacity
          style={styles.startRunButton}
          onPress={() => setShowRunSetup(true)}
          disabled={starting}
        >
          {starting ? (
            <ActivityIndicator color="#0d1322" />
          ) : (
            <Text style={styles.startRunText}>Start Run</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <FadeUpCard index={0}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.totalDistance.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Total km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatPace(stats.averagePace)}
            </Text>
            <Text style={styles.statLabel}>Avg Pace</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCalories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>
      </FadeUpCard>

      <FadeUpCard index={1}>
        <TouchableOpacity style={styles.coachCard} onPress={onOpenCoach}>
          <Text style={styles.coachTitle}>🎙️ Ask your coach anything</Text>
        </TouchableOpacity>
      </FadeUpCard>

      <FadeUpCard index={2}>
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Weekly Goal</Text>
          <View style={styles.goalRow}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#222b40"
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#a3e635"
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${ringSize / 2}, ${ringSize / 2}`}
              />
            </Svg>
            <View style={styles.goalTextWrap}>
              <Text style={styles.goalProgress}>
                {stats.weeklyDistance.toFixed(1)} / {stats.weeklyGoal} km
              </Text>
              <Text style={styles.goalHint}>
                {Math.round(weeklyProgress * 100)}% of weekly goal
              </Text>
            </View>
          </View>
        </View>
      </FadeUpCard>

      <FadeUpCard index={3}>
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>Recent Runs</Text>
          <Text style={styles.recentEmpty}>
            {stats.totalRuns > 0
              ? `${stats.totalRuns} runs logged`
              : "No runs yet"}
          </Text>
        </View>
      </FadeUpCard>

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
  container: { flex: 1, backgroundColor: "#0a0f1c", padding: 20, paddingTop: 48 },
  header: { marginBottom: 24 },
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
  insightText: { color: "#22d3ee", fontSize: 14 },
  startRunButton: {
    backgroundColor: "#a3e635",
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  startRunText: { color: "#0d1322", fontSize: 20, fontWeight: "700" },
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
    fontVariant: ["tabular-nums"],
  },
  statLabel: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  coachCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22d3ee",
    marginBottom: 24,
    alignItems: "center",
  },
  coachTitle: { fontSize: 18, color: "#22d3ee", fontWeight: "600" },
  goalCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  goalTitle: { fontSize: 16, color: "#f8fafc", marginBottom: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  goalTextWrap: { flex: 1 },
  goalProgress: { fontSize: 24, fontWeight: "700", color: "#a3e635" },
  goalHint: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  recentCard: {
    backgroundColor: "#0f1524",
    padding: 20,
    borderRadius: 16,
    marginBottom: 120,
  },
  recentTitle: { fontSize: 16, color: "#f8fafc", marginBottom: 8 },
  recentEmpty: { color: "#64748b", textAlign: "center", paddingVertical: 20 },
});
