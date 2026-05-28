import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function OnboardingAgeScreen({
  onNext,
}: {
  onNext: (age: number) => void;
}) {
  const [age, setAge] = useState(25);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How old are you?</Text>

      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => setAge(Math.max(12, age - 1))}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.ageDisplay}>{age}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => setAge(Math.min(100, age + 1))}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => onNext(age)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 48,
    textAlign: "center",
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  stepperButton: {
    backgroundColor: "#1a2238",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonText: {
    color: "#a3e635",
    fontSize: 32,
    fontWeight: "600",
  },
  ageDisplay: {
    fontSize: 48,
    fontWeight: "600",
    color: "#f8fafc",
    marginHorizontal: 32,
    minWidth: 80,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
  },
  buttonText: {
    color: "#0d1322",
    fontSize: 17,
    fontWeight: "600",
  },
});
