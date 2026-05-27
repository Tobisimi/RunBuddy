import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { ensureAllPermissions } from "../utils/permissions";

export default function PermissionsChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    ensureAllPermissions().then(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={styles.text}>Checking permissions...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 16,
  },
});
