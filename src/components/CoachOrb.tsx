import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import type { CoachOrbState } from "../types/coach";

interface CoachOrbProps {
  state: CoachOrbState;
  size?: number;
  style?: ViewStyle;
}

export default function CoachOrb({ state, size = 80, style }: CoachOrbProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim =
      state === "idle"
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(pulse, {
                toValue: 1.06,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(pulse, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
          )
        : state === "listening"
          ? Animated.loop(
              Animated.sequence([
                Animated.timing(pulse, {
                  toValue: 1.12,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }),
              ]),
            )
          : state === "thinking"
            ? Animated.loop(
                Animated.sequence([
                  Animated.timing(glow, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                  Animated.timing(glow, {
                    toValue: 0.5,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]),
              )
            : state === "speaking"
              ? Animated.loop(
                  Animated.sequence([
                    Animated.timing(pulse, {
                      toValue: 1.08,
                      duration: 350,
                      useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                      toValue: 0.96,
                      duration: 350,
                      useNativeDriver: true,
                    }),
                  ]),
                )
              : null;

    anim?.start();
    return () => {
      anim?.stop();
      pulse.setValue(1);
      glow.setValue(0.6);
    };
  }, [state, pulse, glow]);

  const radius = size / 2;

  return (
    <Animated.View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: radius,
          transform: [{ scale: pulse }],
          opacity: state === "thinking" ? glow : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: radius * 0.72,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  inner: {
    backgroundColor: "#67e8f9",
  },
});
