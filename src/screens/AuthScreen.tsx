import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function AuthScreen({
  onAuthComplete,
}: {
  onAuthComplete: () => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created! Please sign in.");
        setIsSignUp(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthComplete();
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === "auth/invalid-email")
        message = "Invalid email address";
      if (error.code === "auth/user-not-found") message = "User not found";
      if (error.code === "auth/wrong-password") message = "Wrong password";
      if (error.code === "auth/email-already-in-use")
        message = "Email already in use";
      if (error.code === "auth/weak-password")
        message = "Password should be at least 6 characters";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>RunBuddy</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0d1322" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: "#0f1524",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222b40",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#1a2238",
    borderRadius: 12,
    padding: 14,
    color: "#f8fafc",
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#a3e635",
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "#0d1322",
    fontSize: 17,
    fontWeight: "600",
  },
  switchText: {
    color: "#22d3ee",
    textAlign: "center",
    fontSize: 14,
  },
});
