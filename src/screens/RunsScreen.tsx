import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { runsApi } from "../services/api";

export default function RunsScreen() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runsApi
      .list(15)
      .then((res) => setRuns(res.runs || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Runs</Text>
      {loading ? (
        <ActivityIndicator color="#a3e635" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No runs yet. Start your first run!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.distance}>
                {(item.distance || 0).toFixed(2)} km
              </Text>
              <Text style={styles.meta}>
                {Math.floor((item.durationSeconds || 0) / 60)} min ·{" "}
                {item.status || "completed"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c", paddingTop: 56 },
  title: {
    fontSize: 40,
    fontWeight: "600",
    color: "#f8fafc",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    backgroundColor: "#0f1524",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  distance: { fontSize: 24, fontWeight: "700", color: "#a3e635" },
  meta: { color: "#94a3b8", marginTop: 6, fontSize: 14 },
  empty: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});
