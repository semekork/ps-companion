import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";

export function LockScreen() {
  const { authenticateBiometric } = useAuth();

  useEffect(() => {
    // Attempt authentication on mount
    authenticateBiometric();
  }, [authenticateBiometric]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={StyleSheet.absoluteFill}
      className="z-[9999]"
    >
      <LinearGradient
        colors={["#001A3A", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 bg-white/10 rounded-full items-center justify-center mb-8 border border-white/20">
          <IconSymbol name="lock.fill" size={42} color="#fff" />
        </View>

        <Text className="text-white text-2xl font-black mb-2 text-center">
          Companion Locked
        </Text>
        <Text className="text-gray-400 text-base text-center mb-12">
          Use Biometrics to access your PlayStation companion
        </Text>

        <Pressable
          onPress={() => authenticateBiometric()}
          className="bg-[#0070D1] px-10 py-4 rounded-2xl active:opacity-80 flex-row items-center gap-x-3"
        >
          <IconSymbol name="faceid" size={20} color="#fff" />
          <Text className="text-white font-bold text-lg">Unlock Now</Text>
        </Pressable>
      </View>

      <Text className="absolute bottom-12 self-center text-gray-600 text-xs font-black tracking-widest uppercase">
        PS Companion • Secure
      </Text>
    </Animated.View>
  );
}
