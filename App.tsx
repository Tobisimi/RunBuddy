import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { auth, db } from "./src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import PermissionsScreen from "./src/screens/PermissionsScreen";
import LandingScreen from "./src/screens/LandingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import OnboardingNameScreen from "./src/screens/OnboardingNameScreen";
import OnboardingAgeScreen from "./src/screens/OnboardingAgeScreen";
import OnboardingWeightScreen from "./src/screens/OnboardingWeightScreen";
import OnboardingFitnessScreen from "./src/screens/OnboardingFitnessScreen";
import OnboardingGoalScreen from "./src/screens/OnboardingGoalScreen";
import OnboardingUnitsScreen from "./src/screens/OnboardingUnitsScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ActiveRunScreen from "./src/screens/ActiveRunScreen";
import { initDatabase, getActiveRun } from "./src/utils/runEngine";

export default function App() {
  const [permissionsComplete, setPermissionsComplete] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  // Onboarding data
  const [userName, setUserName] = useState("");
  const [userAge, setUserAge] = useState(0);
  const [userWeightRange, setUserWeightRange] = useState("");
  const [userFitness, setUserFitness] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [userCustomGoal, setUserCustomGoal] = useState("");
  const [userUnits, setUserUnits] = useState<"km" | "mi">("km");
  const [saving, setSaving] = useState(false);
  // Resume run
  const [resumeRunData, setResumeRunData] = useState<any>(null);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Init SQLite
  useEffect(() => {
    initDatabase();
  }, []);

  // Check for unfinished run after user is loaded
  useEffect(() => {
    const checkUnfinishedRun = async () => {
      if (!user) return;
      const active = await getActiveRun();
      if (active && active.status === "active") {
        Alert.alert(
          "Unfinished Run",
          "You have a run in progress. Resume it?",
          [
            { text: "Discard", style: "destructive", onPress: () => {} },
            { text: "Resume", onPress: () => setResumeRunData(active) },
          ],
          { cancelable: false },
        );
      }
    };
    checkUnfinishedRun();
  }, [user]);

  const saveOnboardingData = async (units: "km" | "mi") => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        fullName: userName,
        age: userAge,
        weightRange: userWeightRange,
        fitnessLevel: userFitness,
        runningGoal: userGoal,
        customGoal: userCustomGoal || null,
        unitPreference: units,
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setOnboardingStep(6); // complete
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Save Failed", "Could not save onboarding data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a3e635" />
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

  // Resume active run if present
  if (resumeRunData) {
    return (
      <ActiveRunScreen
        runType={resumeRunData.goalType || "open"}
        goalValue={resumeRunData.goalValue || null}
        coachMode={resumeRunData.coachMode || "motivation"}
        onEnd={(finalRun) => {
          setResumeRunData(null);
          // TODO: Show run summary
          console.log("Resumed run ended", finalRun);
        }}
      />
    );
  }

  // Onboarding flow
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
          setUserAge(age);
          setOnboardingStep(2);
        }}
      />
    );
  }
  if (onboardingStep === 2) {
    return (
      <OnboardingWeightScreen
        onNext={(weightRange) => {
          setUserWeightRange(weightRange);
          setOnboardingStep(3);
        }}
      />
    );
  }
  if (onboardingStep === 3) {
    return (
      <OnboardingFitnessScreen
        onNext={(fitness) => {
          setUserFitness(fitness);
          setOnboardingStep(4);
        }}
      />
    );
  }
  if (onboardingStep === 4) {
    return (
      <OnboardingGoalScreen
        onNext={(goal, custom) => {
          setUserGoal(goal);
          if (custom) setUserCustomGoal(custom);
          setOnboardingStep(5);
        }}
      />
    );
  }
  if (onboardingStep === 5) {
    return (
      <OnboardingUnitsScreen
        onNext={(units) => {
          setUserUnits(units);
          saveOnboardingData(units);
        }}
      />
    );
  }
  if (saving) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={styles.text}>Saving your preferences...</Text>
      </View>
    );
  }

  // Onboarding complete – show Dashboard
  return <DashboardScreen userName={userName} />;
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
    fontSize: 16,
    marginTop: 16,
  },
});
