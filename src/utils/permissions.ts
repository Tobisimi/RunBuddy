import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { Alert, Linking, Platform } from "react-native";

export type PermissionStatus = {
  backgroundLocation: boolean;
  microphone: boolean;
  notifications: boolean;
  batteryOptimization: boolean;
};

export async function checkBackgroundLocation(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === "granted";
}

export async function requestBackgroundLocation(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Background Location Required",
      "RunBuddy needs background location to track your runs when your screen is off.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }
  return true;
}

export async function checkMicrophone(): Promise<boolean> {
  const { status } = await Audio.getPermissionsAsync();
  return status === "granted";
}

export async function requestMicrophone(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Microphone Required",
      "RunBuddy needs microphone access for voice coaching.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Try Again", onPress: () => requestMicrophone() },
      ],
    );
    return false;
  }
  return true;
}

export async function checkNotifications(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function requestNotifications(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function checkBatteryOptimization(): Promise<boolean> {
  // On Android, we can't programmatically check if user has disabled battery optimization
  // We'll rely on user to confirm
  if (Platform.OS !== "android") return true;

  return new Promise((resolve) => {
    Alert.alert(
      "Battery Optimization",
      "To keep tracking your run when your screen locks, please exclude RunBuddy from battery saving.\n\nGo to Settings → Apps → RunBuddy → Battery → Unrestricted",
      [
        { text: "Skip", onPress: () => resolve(true) },
        {
          text: "Open Settings",
          onPress: () => {
            Linking.sendIntent(
              "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS",
            );
            resolve(true);
          },
        },
      ],
    );
  });
}

export async function ensureAllPermissions(): Promise<boolean> {
  const hasBgLocation = await checkBackgroundLocation();
  if (!hasBgLocation) {
    const granted = await requestBackgroundLocation();
    if (!granted) return false;
  }

  const hasMic = await checkMicrophone();
  if (!hasMic) {
    const granted = await requestMicrophone();
    if (!granted) return false;
  }

  await checkBatteryOptimization(); // Optional but recommended

  // Notifications are optional - don't block
  const hasNotifications = await checkNotifications();
  if (!hasNotifications) {
    await requestNotifications(); // User can decline
  }

  return true;
}
