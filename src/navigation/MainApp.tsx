import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import BottomNav, { TabKey } from "../components/BottomNav";
import DashboardScreen from "../screens/DashboardScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import CoachScreen from "../screens/CoachScreen";
import RunsScreen from "../screens/RunsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ActiveRunScreen from "../screens/ActiveRunScreen";
import SummaryScreen from "../screens/SummaryScreen";
import PremiumScreen from "../screens/PremiumScreen";
import { UserContext } from "../services/api";
import { completeRunSession } from "../services/runSync";

type RunPhase = "idle" | "active" | "summary";

interface MainAppProps {
  userName: string;
  userContext: UserContext;
}

export default function MainApp({ userName, userContext }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [showPremium, setShowPremium] = useState(false);
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [runConfig, setRunConfig] = useState<{
    runType: "distance" | "time" | "open";
    goalValue: number | null;
    coachMode: string;
    runId: string | null;
  } | null>(null);
  const [completedRunData, setCompletedRunData] = useState<any>(null);

  const handleStartRun = (
    runType: "distance" | "time" | "open",
    goalValue: number | null,
    coachMode: string,
    runId: string | null,
  ) => {
    setRunConfig({ runType, goalValue, coachMode, runId });
    setRunPhase("active");
  };

  const handleEndRun = async (runData: any) => {
    if (runConfig) {
      await completeRunSession(runConfig.runId, {
        distance: runData.distance,
        duration: runData.duration,
        pace: runData.pace,
        bestPace: runData.bestPace,
        calories: runData.calories,
        route: runData.route,
        startTime: runData.startTime,
        endTime: runData.endTime,
        coachMode: runConfig.coachMode,
        goalType: runConfig.runType,
        goalValue: runConfig.goalValue,
      });
    }
    setCompletedRunData(runData);
    setRunPhase("summary");
  };

  const handleSaveSummary = () => {
    setCompletedRunData(null);
    setRunConfig(null);
    setRunPhase("idle");
    setActiveTab("home");
  };

  if (showPremium) {
    return <PremiumScreen onBack={() => setShowPremium(false)} />;
  }

  if (runPhase === "summary" && completedRunData) {
    return (
      <SummaryScreen runData={completedRunData} onSave={handleSaveSummary} />
    );
  }

  if (runPhase === "active" && runConfig) {
    return (
      <ActiveRunScreen
        runType={runConfig.runType}
        goalValue={runConfig.goalValue}
        coachMode={runConfig.coachMode}
        userContext={userContext}
        onEnd={handleEndRun}
      />
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "analytics":
        return (
          <AnalyticsScreen onUpgrade={() => setShowPremium(true)} />
        );
      case "coach":
        return (
          <CoachScreen
            userContext={userContext}
            onUpgrade={() => setShowPremium(true)}
          />
        );
      case "runs":
        return <RunsScreen />;
      case "profile":
        return <ProfileScreen onUpgrade={() => setShowPremium(true)} />;
      default:
        return (
          <DashboardScreen
            userName={userName}
            onStartRun={handleStartRun}
            onOpenCoach={() => setActiveTab("coach")}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1c" },
});
