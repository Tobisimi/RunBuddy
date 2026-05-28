import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const weightRanges = [
  "Below 40kg",
  "40–44kg",
  "45–49kg",
  "50–54kg",
  "55–59kg",
  "60–64kg",
  "65–69kg",
  "70–74kg",
  "75–79kg",
  "80–84kg",
  "85–89kg",
  "90–94kg",
  "95–99kg",
  "Above 100kg",
];

export default function OnboardingWeightScreen({
  onNext,
}: {
  onNext: (weightRange: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your weight range?</Text>
      <Text style={styles.description}>
        This helps RunBuddy personalise your coaching and calorie tracking. Kept
        private.
      </Text>

      <ScrollView style={styles.scrollView}>
        {weightRanges.map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.option, selected === range && styles.optionSelected]}
            onPress={() => setSelected(range)}
          >
            <Text
              style={[
                styles.optionText,
                selected === range && styles.optionTextSelected,
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={() => selected && onNext(selected)}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
    marginBottom: 24,
  },
  option: {
    backgroundColor: "#1a2238",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: "#a3e635",
  },
  optionText: {
    color: "#f8fafc",
    fontSize: 16,
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#0d1322",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#3f4a2e",
  },
  buttonText: {
    color: "#0d1322",
    fontSize: 17,
    fontWeight: "600",
  },
});
