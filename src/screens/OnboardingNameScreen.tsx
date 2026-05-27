import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function OnboardingNameScreen({
  onNext,
}: {
  onNext: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your name?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TouchableOpacity
        style={[styles.button, !name && styles.buttonDisabled]}
        onPress={() => name && onNext(name)}
        disabled={!name}
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
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1a2238",
    borderRadius: 12,
    padding: 16,
    color: "#f8fafc",
    fontSize: 18,
    marginBottom: 32,
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
