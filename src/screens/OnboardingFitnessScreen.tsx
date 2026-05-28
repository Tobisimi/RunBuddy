import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const fitnessLevels = [
  {
    id: "beginner",
    title: "Beginner",
    description: "Just starting out or returning after a long break",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Running regularly, building consistency",
  },
  {
    id: "athlete",
    title: "Athlete",
    description: "Competitive runner, training for performance",
  },
];

export default function OnboardingFitnessScreen({
  onNext,
}: {
  onNext: (fitnessLevel: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your fitness level?</Text>

      {fitnessLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[styles.card, selected === level.id && styles.cardSelected]}
          onPress={() => setSelected(level.id)}
        >
          <Text
            style={[
              styles.cardTitle,
              selected === level.id && styles.cardTitleSelected,
            ]}
          >
            {level.title}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              selected === level.id && styles.cardDescriptionSelected,
            ]}
          >
            {level.description}
          </Text>
        </TouchableOpacity>
      ))}

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
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 32,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1a2238",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a3650",
  },
  cardSelected: {
    backgroundColor: "#a3e635",
    borderColor: "#a3e635",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 8,
  },
  cardTitleSelected: {
    color: "#0d1322",
  },
  cardDescription: {
    fontSize: 14,
    color: "#94a3b8",
  },
  cardDescriptionSelected: {
    color: "#0d1322",
  },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginTop: 24,
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
