import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

const FEATURES = [
  "Unlimited AI coaching",
  "Full analytics history",
  "Race Intelligence (coming soon)",
];

export default function PremiumScreen({ onBack }: { onBack: () => void }) {
  const showToast = () => {
    Alert.alert(
      "Coming soon",
      "Premium is coming soon. You'll be first to know.",
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>RunBuddy Premium</Text>
        <Text style={styles.price}>₦2,000/month</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.upgradeBtn} onPress={showToast}>
        <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c" },
  content: { padding: 24, paddingTop: 56 },
  back: { marginBottom: 16 },
  backText: { color: "#22d3ee", fontSize: 16 },
  hero: {
    backgroundColor: "#f5b945",
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0d1322",
    textAlign: "center",
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0d1322",
    marginTop: 12,
  },
  features: { marginBottom: 32, gap: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  check: { color: "#a3e635", fontSize: 20, fontWeight: "700" },
  featureText: { color: "#f8fafc", fontSize: 17 },
  upgradeBtn: {
    backgroundColor: "#f5b945",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  upgradeBtnText: { color: "#0d1322", fontSize: 18, fontWeight: "700" },
});
