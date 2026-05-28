import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Platform,
  Alert,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import {
  saveRunToLocal,
  getActiveRun,
  haversineDistance,
  smoothCoordinates,
} from "../utils/runEngine";

const LOCATION_TASK_NAME = "run-buddy-location-task";

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Location task error:", error);
    return;
  }
  // Background location handled – no foreground action needed
});

export default function ActiveRunScreen({
  runType,
  goalValue,
  coachMode,
  onEnd,
}: {
  runType: "distance" | "time" | "open";
  goalValue: number | null;
  coachMode: string;
  onEnd: (runData: any) => void;
}) {
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // seconds
  const [distance, setDistance] = useState(0); // km
  const [pace, setPace] = useState(0); // min/km
  const [calories, setCalories] = useState(0);
  const [route, setRoute] = useState<Location.LocationObjectCoords[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lastPointRef = useRef<Location.LocationObjectCoords | null>(null);
  const weightMidpoint = 72; // TODO: fetch from user profile

  // Timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  // Location tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied");
        return;
      }
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          if (!isRunning || isPaused) return;
          const coords = newLocation.coords;
          if (coords.accuracy > 50) return; // discard poor readings
          setLocation(newLocation);
          const newRoute = [...route, coords];
          const smoothed = smoothCoordinates(newRoute);
          let newDistance = distance;
          if (lastPointRef.current) {
            const last = lastPointRef.current;
            const delta = haversineDistance(
              last.latitude,
              last.longitude,
              smoothed.latitude,
              smoothed.longitude,
            );
            newDistance += delta;
          }
          lastPointRef.current = smoothed;
          setDistance(newDistance);
          setRoute(newRoute);
          if (newDistance > 0) {
            const newPace = duration / 60 / newDistance;
            setPace(newPace);
          }
          const durationHours = duration / 3600;
          let met = 8.3;
          if (pace < 5) met = 11.0;
          else if (pace < 6) met = 9.8;
          else if (pace < 7) met = 8.3;
          else if (pace < 8) met = 7.0;
          else met = 6.0;
          const newCalories = Math.round(met * weightMidpoint * durationHours);
          setCalories(newCalories);
        },
      );
    })();

    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, [isRunning, isPaused, route, distance, duration]);

  // Save to SQLite every 5 seconds
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(async () => {
      const runData = {
        distance,
        duration,
        pace,
        calories,
        route,
        startTime: Date.now() - duration * 1000,
        status: "active" as const,
      };
      await saveRunToLocal(runData);
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, distance, duration, pace, calories, route]);

  // Background task on app state change
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" && isRunning && !isPaused) {
        Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          foregroundService: {
            notificationTitle: "RunBuddy",
            notificationBody: "Tracking your run...",
            notificationColor: "#a3e635",
          },
        });
      } else if (nextAppState === "active") {
        Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    });
    return () => subscription.remove();
  }, [isRunning, isPaused]);

  const pauseRun = () => setIsPaused(true);
  const resumeRun = () => setIsPaused(false);
  const stopRun = () => {
    Alert.alert("End Run", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (locationSubscription.current)
            locationSubscription.current.remove();
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          const finalRun = {
            distance,
            duration,
            pace,
            calories,
            route,
            startTime: Date.now() - duration * 1000,
            endTime: Date.now(),
            status: "completed",
          };
          await saveRunToLocal(finalRun);
          onEnd(finalRun);
        },
      },
    ]);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatPace = (paceMinPerKm: number) => {
    if (paceMinPerKm === 0 || !isFinite(paceMinPerKm)) return "0:00";
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.duration}>{formatTime(duration)}</Text>
        <View style={styles.midStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(pace)}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>cal</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          customMapStyle={darkMapStyle}
          region={
            location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
        >
          {route.length > 0 && (
            <Polyline
              coordinates={route.map((c) => ({
                latitude: c.latitude,
                longitude: c.longitude,
              }))}
              strokeColor="#a3e635"
              strokeWidth={4}
              lineDashPattern={
                route.some((p) => p.accuracy === 0) ? [5, 5] : []
              }
            />
          )}
        </MapView>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={isPaused ? resumeRun : pauseRun}
        >
          <Text style={styles.controlText}>
            {isPaused ? "Resume" : "Pause"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={stopRun}
        >
          <Text style={styles.controlText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.coachButton}
        onPress={() => alert("Coach coming soon")}
      >
        <Text style={styles.coachButtonText}>🎙️ Talk to Coach</Text>
      </TouchableOpacity>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0a0f1c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1c" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a2238" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1524" }],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c" },
  statsContainer: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  duration: {
    fontSize: 48,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
  },
  midStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 28, fontWeight: "600", color: "#a3e635" },
  statLabel: { fontSize: 14, color: "#94a3b8" },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: { flex: 1 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 20,
  },
  controlButton: {
    backgroundColor: "#1a2238",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 40,
  },
  stopButton: { backgroundColor: "#ef4458" },
  controlText: { color: "#f8fafc", fontSize: 18, fontWeight: "600" },
  coachButton: {
    backgroundColor: "#22d3ee",
    margin: 20,
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  coachButtonText: { color: "#0d1322", fontSize: 18, fontWeight: "700" },
});
