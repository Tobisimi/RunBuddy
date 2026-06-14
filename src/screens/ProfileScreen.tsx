import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function ProfileScreen({
  onUpgrade,
}: {
  onUpgrade: () => void;
}) {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || "—"}</Text>
      </View>
      <TouchableOpacity style={styles.premiumBtn} onPress={onUpgrade}>
        <Text style={styles.premiumText}>RunBuddy Premium</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.signOut}
        onPress={() => signOut(auth)}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1c",
    padding: 20,
    paddingTop: 56,
    paddingBottom: 120,
  },
  title: { fontSize: 40, fontWeight: "600", color: "#f8fafc", marginBottom: 24 },
  card: {
    backgroundColor: "#0f1524",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  value: { color: "#f8fafc", fontSize: 16 },
  premiumBtn: {
    backgroundColor: "#171f33",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f5b945",
    marginBottom: 16,
    alignItems: "center",
  },
  premiumText: { color: "#f5b945", fontSize: 17, fontWeight: "600" },
  signOut: {
    marginTop: 24,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ef4458",
  },
  signOutText: { color: "#ef4458", fontSize: 16, fontWeight: "600" },
});
