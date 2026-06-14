import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { saveRunToLocal, haversineDistance } from "../utils/runEngine";
import {
  kalmanFilter,
  initKalmanState,
  rollingWindowPace,
  PaceWindowEntry,
} from "../utils/gps";
import { useStepCounter } from "../hooks/useStepCounter";
import { useCoachVoiceSession } from "../hooks/useCoachVoiceSession";
import CoachVoiceModal from "../components/CoachVoiceModal";
import { UserContext } from "../services/api";

const LOCATION_TASK_NAME = "run-buddy-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async () => {});

export default function ActiveRunScreen({
  runType,
  goalValue,
  coachMode,
  userContext,
  onEnd,
}: {
  runType: "distance" | "time" | "open";
  goalValue: number | null;
  coachMode: string;
  userContext: UserContext;
  onEnd: (runData: any) => void;
}) {
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [calories, setCalories] = useState(0);
  const [route, setRoute] = useState<Location.LocationObjectCoords[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [bestPace, setBestPace] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const kalmanRef = useRef<{
    state: ReturnType<typeof initKalmanState> | null;
  }>({ state: null });
  const paceWindowRef = useRef<PaceWindowEntry[]>([]);
  const lastPointRef = useRef<Location.LocationObjectCoords | null>(null);
  const durationRef = useRef(0);
  const paceHistoryRef = useRef<number[]>([]);
  const weightMidpoint = 72;
  const isStoppedRef = useRef(false);

  const stepData = useStepCounter(isRunning && !isPaused, isPaused);

  const paceMinPerKm = speedKmh > 0 ? 60 / speedKmh : 0;

  const coachVoice = useCoachVoiceSession({
    userContext,
    runContext: {
      pace: paceMinPerKm,
      distance,
      durationSeconds: duration,
      goalType: runType,
      coachMode,
      cadenceSpm: stepData.cadenceSpm,
    },
    isLiveRun: true,
  });

  // Timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          durationRef.current = newDuration;
          return newDuration;
        });
      }, 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  // Location tracking (same as before)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          if (isStoppedRef.current) return;
          if (!isRunning || isPaused) return;
          const { latitude, longitude, accuracy = 20 } = newLocation.coords;
          if (accuracy > 50) return;

          setLocation(newLocation);

          if (!kalmanRef.current.state) {
            kalmanRef.current.state = initKalmanState(latitude, longitude);
          } else {
            kalmanRef.current.state = kalmanFilter(
              kalmanRef.current.state,
              latitude,
              longitude,
              accuracy,
            );
          }
          const smoothedLat = kalmanRef.current.state.lat;
          const smoothedLng = kalmanRef.current.state.lng;

          const smoothedCoord: Location.LocationObjectCoords = {
            latitude: smoothedLat,
            longitude: smoothedLng,
            altitude: newLocation.coords.altitude ?? 0,
            accuracy,
            altitudeAccuracy: newLocation.coords.altitudeAccuracy ?? null,
            heading: newLocation.coords.heading ?? null,
            speed: newLocation.coords.speed ?? null,
          };

          let newDistance = distance;
          if (lastPointRef.current) {
            const delta = haversineDistance(
              lastPointRef.current.latitude,
              lastPointRef.current.longitude,
              smoothedLat,
              smoothedLng,
            );
            newDistance += delta;
          }
          lastPointRef.current = smoothedCoord;

          setDistance(newDistance);
          setRoute((prev) => [...prev, smoothedCoord]);

          paceWindowRef.current.push({
            timestamp: Date.now(),
            distanceKm: newDistance,
          });
          const paceMinPerKm = rollingWindowPace(paceWindowRef.current);
          let newSpeedKmh = 0;
          if (paceMinPerKm > 0) {
            newSpeedKmh = 60 / paceMinPerKm;
            setSpeedKmh(newSpeedKmh);
            if (bestPace === 0 || paceMinPerKm < bestPace) {
              setBestPace(paceMinPerKm);
            }
            paceHistoryRef.current.push(paceMinPerKm);
            if (paceHistoryRef.current.length > 10)
              paceHistoryRef.current.shift();
          }

          const avgPace =
            paceHistoryRef.current.length > 0
              ? paceHistoryRef.current.reduce((a, b) => a + b, 0) /
                paceHistoryRef.current.length
              : 8.3;
          const durationHours = durationRef.current / 3600;
          let met = 8.3;
          if (avgPace < 5) met = 11.0;
          else if (avgPace < 6) met = 9.8;
          else if (avgPace < 7) met = 8.3;
          else if (avgPace < 8) met = 7.0;
          else met = 6.0;
          const newCalories = Math.round(met * weightMidpoint * durationHours);
          setCalories(newCalories);
        },
      );
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isRunning, isPaused, distance, bestPace]);

  // Save to SQLite every 5 seconds
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(async () => {
      const runData = {
        distance,
        duration: durationRef.current,
        pace: speedKmh > 0 ? 60 / speedKmh : 0,
        bestPace,
        calories,
        route,
        startTime: Date.now() - durationRef.current * 1000,
        status: "active" as const,
      };
      await saveRunToLocal(runData);
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, distance, speedKmh, bestPace, calories, route]);

  // Background location
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
          isStoppedRef.current = true;
          setIsRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
          if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
          }
          try {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          } catch {
            // Task may never have been started if the app stayed in foreground
          }
          const finalRun = {
            distance,
            duration: durationRef.current,
            pace: speedKmh > 0 ? 60 / speedKmh : 0,
            bestPace,
            calories,
            route,
            startTime: Date.now() - durationRef.current * 1000,
            endTime: Date.now(),
            status: "completed" as const,
          };
          try {
            await saveRunToLocal(finalRun);
          } catch (err) {
            console.error("Failed to save run locally:", err);
          }
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
            <Text style={styles.statValue}>{speedKmh.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>cal</Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          {stepData.supported ? (
            <>
              <Text style={styles.stepText}>
                👟 {stepData.totalSteps.toLocaleString()} steps
              </Text>
              {stepData.source === "accelerometer" && (
                <Text style={styles.stepNote}>~ estimated</Text>
              )}
            </>
          ) : (
            <Text style={styles.stepNote}>
              Steps unavailable on this device
            </Text>
          )}
          {stepData.supported && stepData.cadenceSpm > 0 && (
            <Text style={styles.stepText}>⚡ {stepData.cadenceSpm} spm</Text>
          )}
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          followsUserLocation
          showsMyLocationButton={false}
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
        onPress={coachVoice.toggleVoiceSession}
      >
        <Text style={styles.coachButtonText}>🎙️ Talk to Coach</Text>
      </TouchableOpacity>

      <CoachVoiceModal
        visible={coachVoice.modalVisible}
        orbState={coachVoice.orbState}
        statusText={coachVoice.statusText}
        onDismiss={coachVoice.closeSession}
      />
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
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  stepText: { fontSize: 14, color: "#22d3ee", fontWeight: "500" },
  stepNote: { fontSize: 10, color: "#94a3b8", marginLeft: 8 },
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
