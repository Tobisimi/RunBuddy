import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { auth } from "./src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import PermissionsScreen from "./src/screens/PermissionsScreen";
import LandingScreen from "./src/screens/LandingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import OnboardingAgeScreen from "./src/screens/OnboardingAgeScreen";
import OnboardingNameScreen from "./src/screens/OnboardingNameScreen";

export default function App() {
  const [permissionsComplete, setPermissionsComplete] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!permissionsComplete) {
    return (
      <PermissionsScreen onComplete={() => setPermissionsComplete(true)} />
    );
  }

  if (!user && showLanding) {
    return <LandingScreen onGetStarted={() => setShowLanding(false)} />;
  }

  if (!user && !showLanding) {
    return <AuthScreen onAuthComplete={() => setUser(auth.currentUser)} />;
  }

  // User is authenticated – show onboarding
  if (onboardingStep === 0) {
    return (
      <OnboardingNameScreen
        onNext={(name) => {
          setUserName(name);
          setOnboardingStep(1);
        }}
      />
    );
  }

  if (onboardingStep === 1) {
    return (
      <OnboardingAgeScreen
        onNext={(age) => {
          console.log("Age:", age);
          setOnboardingStep(2);
        }}
      />
    );
  }

  // Temporary placeholder for remaining onboarding steps
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, {userName}!</Text>
      <Text style={styles.subtext}>Next: Weight, Fitness, Goal, Units</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#a3e635",
    fontSize: 24,
    fontWeight: "600",
  },
  subtext: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 12,
  },
});
