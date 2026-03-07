import type { Platform } from "@/types/psn";
import { Text, View } from "react-native";

const BADGE: Record<string, { label: string; bg: string; text: string }> = {
  ps5: { label: "PS5", bg: "#003087", text: "#fff" },
  ps4: { label: "PS4", bg: "#1A1A2E", text: "#9BA1A6" },
  ps3: { label: "PS3", bg: "#1A1A2E", text: "#9BA1A6" },
  psvita: { label: "Vita", bg: "#1A1A2E", text: "#9BA1A6" },
  unknown: { label: "PS", bg: "#1A1A2E", text: "#9BA1A6" },
};

export function PlatformBadge({ platform }: { platform: Platform | string }) {
  const config = BADGE[platform] ?? BADGE.unknown;
  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: config.text,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
