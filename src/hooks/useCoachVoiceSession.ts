import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { coachApi, RunContext, UserContext } from "../services/api";
import type { CoachOrbState } from "../types/coach";

const SORRY_CACHE_KEY = "@runbuddy/coach_sorry_audio";
const MAX_RECORD_MS = 30_000;
const SILENCE_CLOSE_MS = 7_000;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: ".amr",
    outputFormat: Audio.AndroidOutputFormat.AMR_WB,
    audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".wav",
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

function getSttEncoding() {
  return Platform.OS === "ios" ? "LINEAR16" : "AMR_WB";
}

interface UseCoachVoiceSessionOptions {
  userContext: UserContext;
  runContext?: RunContext | null;
  isLiveRun?: boolean;
}

export function useCoachVoiceSession({
  userContext,
  runContext = null,
  isLiveRun = true,
}: UseCoachVoiceSessionOptions) {
  const [modalVisible, setModalVisible] = useState(false);
  const [orbState, setOrbState] = useState<CoachOrbState>("idle");
  const [statusText, setStatusText] = useState("Listening...");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const clearSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const closeSession = useCallback(() => {
    clearSilenceTimer();
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    setModalVisible(false);
    setOrbState("idle");
    setStatusText("Listening...");
    isRecordingRef.current = false;
  }, []);

  const playBase64Audio = useCallback(
    async (audioBase64: string) => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const uri = `${FileSystem.cacheDirectory}coach_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(uri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setOrbState("speaking");
      setStatusText("Coach is speaking...");

      await sound.playAsync();
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
      });

      setOrbState("idle");
      setStatusText("Listening...");
      clearSilenceTimer();
      silenceTimeoutRef.current = setTimeout(() => {
        closeSession();
      }, SILENCE_CLOSE_MS);
    },
    [closeSession],
  );

  const getSorryAudio = useCallback(async (): Promise<string> => {
    const cached = await AsyncStorage.getItem(SORRY_CACHE_KEY);
    if (cached) return cached;

    const { audioBase64 } = await coachApi.tts(
      "Sorry, I didn't get that. Go ahead.",
    );
    await AsyncStorage.setItem(SORRY_CACHE_KEY, audioBase64);
    return audioBase64;
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    if (!recordingRef.current) return;

    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }

    isRecordingRef.current = false;
    setOrbState("thinking");
    setStatusText("On it...");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No recording URI");

      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { transcript, confidence } = await coachApi.stt(
        audioBase64,
        getSttEncoding(),
        16000,
      );

      if (!transcript || confidence < 0.6) {
        const sorryAudio = await getSorryAudio();
        setOrbState("speaking");
        setStatusText("Sorry, try again...");
        await playBase64Audio(sorryAudio);
        setOrbState("listening");
        setStatusText("Listening...");
        return;
      }

      setStatusText("On it...");
      const { response } = await coachApi.message({
        message: transcript,
        userContext,
        runContext,
        isLiveRun,
      });

      setStatusText("On it...");
      const { audioBase64: replyAudio } = await coachApi.tts(response);
      await playBase64Audio(replyAudio);
    } catch (err) {
      console.error("Coach voice session error:", err);
      setStatusText("Something went wrong. Tap to close.");
      setOrbState("idle");
    }
  }, [userContext, runContext, isLiveRun, getSorryAudio, playBase64Audio]);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission required");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    recordingRef.current = recording;
    isRecordingRef.current = true;
    setOrbState("listening");
    setStatusText("Listening...");

    recordTimeoutRef.current = setTimeout(() => {
      if (isRecordingRef.current) {
        stopRecordingAndProcess();
      }
    }, MAX_RECORD_MS);
  }, [stopRecordingAndProcess]);

  const toggleVoiceSession = useCallback(async () => {
    if (modalVisible && isRecordingRef.current) {
      await stopRecordingAndProcess();
      return;
    }

    if (modalVisible) {
      closeSession();
      return;
    }

    setModalVisible(true);
    setOrbState("listening");
    setStatusText("Listening...");
    try {
      await startRecording();
    } catch (err) {
      console.error(err);
      closeSession();
    }
  }, [
    modalVisible,
    startRecording,
    stopRecordingAndProcess,
    closeSession,
  ]);

  return {
    modalVisible,
    orbState,
    statusText,
    toggleVoiceSession,
    closeSession,
  };
}
