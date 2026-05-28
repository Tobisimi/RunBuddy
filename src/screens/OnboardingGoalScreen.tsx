import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const goalOptions = [
  "Lose weight",
  "Build endurance",
  "Run faster",
  "Stay consistent",
  "Train for race",
];

export default function OnboardingGoalScreen({
  onNext,
}: {
  onNext: (goal: string, customGoal?: string) => void;
}) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your running goal?</Text>

      <ScrollView style={styles.scrollView}>
        <View style={styles.chipContainer}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.chip,
                selectedGoal === goal && styles.chipSelected,
              ]}
              onPress={() => {
                setSelectedGoal(goal);
                setCustomGoal("");
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedGoal === goal && styles.chipTextSelected,
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.orText}>Or tell me more</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., Break 25 minutes for 5K"
          placeholderTextColor="#64748b"
          value={customGoal}
          onChangeText={(text) => {
            setCustomGoal(text);
            setSelectedGoal(null);
          }}
        />
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          !selectedGoal && !customGoal && styles.buttonDisabled,
        ]}
        onPress={() => {
          if (selectedGoal) onNext(selectedGoal);
          else if (customGoal) onNext(customGoal, customGoal);
        }}
        disabled={!selectedGoal && !customGoal}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c", padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 24,
    textAlign: "center",
  },
  scrollView: { flex: 1 },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: "#1a2238",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 32,
  },
  chipSelected: { backgroundColor: "#a3e635" },
  chipText: { color: "#f8fafc", fontSize: 16 },
  chipTextSelected: { color: "#0d1322", fontWeight: "600" },
  orText: {
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#1a2238",
    borderRadius: 12,
    padding: 16,
    color: "#f8fafc",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { backgroundColor: "#3f4a2e" },
  buttonText: { color: "#0d1322", fontSize: 17, fontWeight: "600" },
});
