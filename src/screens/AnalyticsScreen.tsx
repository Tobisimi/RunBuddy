import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLine,
  VictoryTheme,
} from "victory-native";

const WEEKLY_DISTANCE = [3.2, 0, 5.1, 4.0, 0, 6.2, 2.8];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PACE_DATA = [
  { x: 1, y: 6.2 },
  { x: 2, y: 6.0 },
  { x: 3, y: 5.8 },
  { x: 4, y: 5.9 },
  { x: 5, y: 5.6 },
  { x: 6, y: 5.5 },
  { x: 7, y: 5.4 },
];

const weeklyTotal = WEEKLY_DISTANCE.reduce((a, b) => a + b, 0);
const consistencyScore = 78;

export default function AnalyticsScreen({
  onUpgrade,
}: {
  onUpgrade: () => void;
}) {
  const [segment, setSegment] = useState<"week" | "month" | "year">("week");

  const barData = WEEKLY_DISTANCE.map((y, i) => ({
    x: DAY_LABELS[i],
    y,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Analytics</Text>

      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, segment === "week" && styles.segmentActive]}
          onPress={() => setSegment("week")}
        >
          <Text
            style={[
              styles.segmentText,
              segment === "week" && styles.segmentTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.segmentLocked} disabled>
          <Text style={styles.segmentText}>Month 🔒</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.segmentLocked} disabled>
          <Text style={styles.segmentText}>Year 🔒</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Weekly distance</Text>
        <Text style={styles.heroValue}>{weeklyTotal.toFixed(1)} km</Text>
      </View>

      <Text style={styles.chartTitle}>Distance (7 days)</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        height={200}
        padding={{ left: 48, right: 24, top: 16, bottom: 40 }}
        domainPadding={{ x: 20 }}
        style={{ background: { fill: "transparent" } }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: "#222b40" },
            tickLabels: { fill: "#94a3b8", fontSize: 11 },
            grid: { stroke: "#222b40" },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: "#222b40" },
            tickLabels: { fill: "#94a3b8", fontSize: 11 },
            grid: { stroke: "#222b40" },
          }}
        />
        <VictoryBar
          data={barData}
          style={{
            data: { fill: "#a3e635" },
          }}
          cornerRadius={{ top: 4 }}
        />
      </VictoryChart>

      <Text style={styles.chartTitle}>Pace trend</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        height={200}
        padding={{ left: 48, right: 24, top: 16, bottom: 40 }}
        style={{ background: { fill: "transparent" } }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: "#222b40" },
            tickLabels: { fill: "#94a3b8", fontSize: 11 },
            grid: { stroke: "#222b40" },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: "#222b40" },
            tickLabels: { fill: "#94a3b8", fontSize: 11 },
            grid: { stroke: "#222b40" },
          }}
        />
        <VictoryLine
          data={PACE_DATA}
          style={{
            data: { stroke: "#22d3ee", strokeWidth: 3 },
          }}
        />
      </VictoryChart>

      <View style={styles.consistencyCard}>
        <Text style={styles.consistencyLabel}>Consistency score</Text>
        <Text style={styles.consistencyValue}>{consistencyScore}%</Text>
        <Text style={styles.consistencyHint}>
          You ran 4 of 7 days this week — strong habit forming.
        </Text>
      </View>

      <TouchableOpacity style={styles.premiumCard} onPress={onUpgrade}>
        <Text style={styles.premiumTitle}>Go Premium to unlock full analytics</Text>
        <View style={styles.premiumBtn}>
          <Text style={styles.premiumBtnText}>Upgrade</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c" },
  content: { padding: 20, paddingTop: 56, paddingBottom: 120 },
  title: { fontSize: 40, fontWeight: "600", color: "#f8fafc", marginBottom: 20 },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#0f1524",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: "#171f33" },
  segmentLocked: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    opacity: 0.5,
  },
  segmentText: { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  segmentTextActive: { color: "#f8fafc" },
  heroCard: {
    backgroundColor: "#0f1524",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  heroLabel: { fontSize: 15, color: "#94a3b8" },
  heroValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#a3e635",
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 8,
  },
  consistencyCard: {
    backgroundColor: "#0f1524",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  consistencyLabel: { color: "#94a3b8", fontSize: 15 },
  consistencyValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#22d3ee",
    marginTop: 8,
  },
  consistencyHint: { color: "#94a3b8", fontSize: 14, marginTop: 8 },
  premiumCard: {
    backgroundColor: "#171f33",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f5b945",
    alignItems: "center",
  },
  premiumTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  premiumBtn: {
    backgroundColor: "#f5b945",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 4,
  },
  premiumBtnText: { color: "#0d1322", fontWeight: "700", fontSize: 15 },
});
