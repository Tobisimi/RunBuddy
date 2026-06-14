import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import CoachOrb from "../components/CoachOrb";
import CoachVoiceModal from "../components/CoachVoiceModal";
import { coachApi, UserContext } from "../services/api";
import { useCoachVoiceSession } from "../hooks/useCoachVoiceSession";
import type { CoachOrbState } from "../types/coach";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
}

const SUGGESTED = [
  "How should I pace a 5K?",
  "I feel tired today",
  "How do I build endurance?",
];

interface CoachScreenProps {
  userContext: UserContext;
  onUpgrade: () => void;
}

export default function CoachScreen({
  userContext,
  onUpgrade,
}: CoachScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<CoachOrbState>("idle");
  const [remaining, setRemaining] = useState<number | null>(5);
  const [limitReached, setLimitReached] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const voice = useCoachVoiceSession({
    userContext,
    runContext: null,
    isLiveRun: false,
  });

  useEffect(() => {
    setOrbState(voice.modalVisible ? voice.orbState : "idle");
  }, [voice.modalVisible, voice.orbState]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || limitReached || sending) return;

      const userMsg: Message = {
        id: `${Date.now()}-u`,
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);
      setOrbState("thinking");

      try {
        const { response, remaining: left } = await coachApi.message({
          message: trimmed,
          userContext,
          runContext: null,
          isLiveRun: false,
        });
        if (left !== null && left !== undefined) setRemaining(left);
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-c`, role: "coach", text: response },
        ]);
        setOrbState("idle");
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429) {
          setLimitReached(true);
        }
        setOrbState("idle");
      } finally {
        setSending(false);
      }
    },
    [userContext, limitReached, sending],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <CoachOrb state={orbState} size={120} />
        <Text style={styles.status}>
          {limitReached
            ? "Daily limit reached"
            : remaining !== null
              ? `${remaining} messages left today`
              : "Unlimited coaching"}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.suggestedWrap}>
            {SUGGESTED.map((q) => (
              <Pressable
                key={q}
                style={styles.suggested}
                onPress={() => sendText(q)}
              >
                <Text style={styles.suggestedText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.coachBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === "coach" && styles.coachBubbleText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {limitReached && (
        <Pressable style={styles.upgradeOverlay} onPress={onUpgrade}>
          <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          <Text style={styles.upgradeBody}>
            You've used all 5 free coach messages today. Go Premium for unlimited
            AI coaching.
          </Text>
        </Pressable>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.micBtn}
          onPress={voice.toggleVoiceSession}
          disabled={limitReached}
        >
          <Text style={styles.micIcon}>🎙️</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ask your coach..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          editable={!limitReached && !sending}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => sendText(input)}
          disabled={limitReached || sending || !input.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      <CoachVoiceModal
        visible={voice.modalVisible}
        orbState={voice.orbState}
        statusText={voice.statusText}
        onDismiss={voice.closeSession}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c", paddingTop: 48 },
  header: { alignItems: "center", paddingBottom: 16 },
  status: { marginTop: 12, fontSize: 13, fontWeight: "500", color: "#94a3b8" },
  thread: { paddingHorizontal: 20, paddingBottom: 120, flexGrow: 1 },
  suggestedWrap: { gap: 10, marginTop: 24 },
  suggested: {
    backgroundColor: "#171f33",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222b40",
  },
  suggestedText: { color: "#f8fafc", fontSize: 15 },
  bubble: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#171f33",
  },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
  },
  bubbleText: { color: "#f8fafc", fontSize: 15 },
  coachBubbleText: { color: "#e0f2fe" },
  upgradeOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 100,
    backgroundColor: "#f5b945",
    borderRadius: 16,
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0d1322",
    marginBottom: 8,
  },
  upgradeBody: { fontSize: 14, color: "#0d1322", lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: "#222b40",
    gap: 8,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
  },
  micIcon: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: "#0f1524",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 15,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#a3e635",
    borderRadius: 12,
  },
  sendText: { color: "#0d1322", fontWeight: "600", fontSize: 14 },
});
