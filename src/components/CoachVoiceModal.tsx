import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CoachOrb from "./CoachOrb";
import type { CoachOrbState } from "../types/coach";

interface CoachVoiceModalProps {
  visible: boolean;
  orbState: CoachOrbState;
  statusText: string;
  onDismiss: () => void;
}

export default function CoachVoiceModal({
  visible,
  orbState,
  statusText,
  onDismiss,
}: CoachVoiceModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.content} pointerEvents="box-none">
          <CoachOrb state={orbState} size={120} />
          <Text style={styles.status}>{statusText}</Text>
          <Text style={styles.hint}>Tap anywhere to dismiss</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(34, 211, 238, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 32,
  },
  status: {
    marginTop: 28,
    fontSize: 20,
    fontWeight: "600",
    color: "#f8fafc",
    textAlign: "center",
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: "#94a3b8",
  },
});
