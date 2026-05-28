import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function OnboardingUnitsScreen({
  onNext,
}: {
  onNext: (units: "km" | "mi") => void;
}) {
  const [selected, setSelected] = useState<"km" | "mi">("km");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your preferred units</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.option, selected === "km" && styles.optionSelected]}
          onPress={() => setSelected("km")}
        >
          <Text
            style={[
              styles.optionText,
              selected === "km" && styles.optionTextSelected,
            ]}
          >
            Kilometers (km)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, selected === "mi" && styles.optionSelected]}
          onPress={() => setSelected("mi")}
        >
          <Text
            style={[
              styles.optionText,
              selected === "mi" && styles.optionTextSelected,
            ]}
          >
            Miles (mi)
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => onNext(selected)}>
        <Text style={styles.buttonText}>Complete</Text>
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
  toggleContainer: { gap: 16, marginBottom: 48 },
  option: {
    backgroundColor: "#1a2238",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  optionSelected: { backgroundColor: "#a3e635" },
  optionText: { color: "#f8fafc", fontSize: 18 },
  optionTextSelected: { color: "#0d1322", fontWeight: "600" },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
  },
  buttonText: { color: "#0d1322", fontSize: 17, fontWeight: "600" },
});
