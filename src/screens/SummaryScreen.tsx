import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SummaryScreen({ runData, onSave }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Run Completed</Text>
      <Text style={styles.distance}>{runData.distance.toFixed(2)} km</Text>
      <Text style={styles.detail}>
        Time: {Math.floor(runData.duration / 60)}:{runData.duration % 60}
      </Text>
      <Text style={styles.detail}>Calories: {runData.calories}</Text>
      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#a3e635",
    marginBottom: 20,
  },
  distance: {
    fontSize: 48,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
  },
  detail: { fontSize: 18, color: "#94a3b8", marginBottom: 5 },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 40,
    marginTop: 30,
  },
  buttonText: { color: "#0d1322", fontSize: 18, fontWeight: "600" },
});
