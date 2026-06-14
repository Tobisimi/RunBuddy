import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CoachOrb from "./CoachOrb";

export type TabKey = "home" | "analytics" | "coach" | "runs" | "profile";

interface BottomNavProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "analytics", label: "Analytics" },
  { key: "coach", label: "Coach" },
  { key: "runs", label: "Runs" },
  { key: "profile", label: "Profile" },
];

export default function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          if (tab.key === "coach") {
            return (
              <Pressable
                key={tab.key}
                style={styles.coachSlot}
                onPress={() => onTabPress("coach")}
                accessibilityRole="button"
                accessibilityLabel="Coach"
              >
                <View style={styles.coachElevated}>
                  <CoachOrb
                    state={activeTab === "coach" ? "listening" : "idle"}
                    size={56}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    activeTab === "coach" && styles.labelActive,
                  ]}
                >
                  Coach
                </Text>
              </Pressable>
            );
          }

          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#171f33",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  coachSlot: {
    flex: 1,
    alignItems: "center",
    marginTop: -16,
  },
  coachElevated: {
    marginBottom: 4,
    transform: [{ translateY: -16 }],
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94a3b8",
  },
  labelActive: {
    color: "#22d3ee",
  },
});
