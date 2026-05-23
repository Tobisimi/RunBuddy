import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Location from "expo-location";

export default function PermissionsScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      onComplete();
    } else {
      alert("Location permission is required to use RunBuddy");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Permission</Text>
      <Text style={styles.description}>
        RunBuddy needs your location to track your runs.
      </Text>
      <TouchableOpacity style={styles.button} onPress={requestLocation}>
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
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
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
