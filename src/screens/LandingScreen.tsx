import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function LandingScreen({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Your AI running coach. In your ear.</Text>
      <Text style={styles.subheadline}>Real-time coaching. Real progress.</Text>

      <View style={styles.features}>
        <Text style={styles.featureText}>🎙️ Voice Coaching</Text>
        <Text style={styles.featureText}>📍 Smart Tracking</Text>
        <Text style={styles.featureText}>📊 Real Insights</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
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
  headline: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 17,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 48,
  },
  features: {
    gap: 16,
    marginBottom: 48,
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#cbd5e1",
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
