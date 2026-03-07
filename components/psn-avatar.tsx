import { Image } from "expo-image";
import { Text, View } from "react-native";

interface PsnAvatarProps {
  uri?: string;
  onlineId?: string;
  size?: number;
  isOnline?: boolean;
}

export function PsnAvatar({
  uri,
  onlineId,
  size = 44,
  isOnline,
}: PsnAvatarProps) {
  const initial = onlineId?.[0]?.toUpperCase() ?? "P";
  const dotSize = Math.round(size * 0.28);

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#2C2C2E",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", fontSize: size * 0.4 }}
          >
            {initial}
          </Text>
        </View>
      )}

      {/* Online status dot */}
      {isOnline !== undefined && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: isOnline ? "#22C55E" : "#52525B",
            borderWidth: 2,
            borderColor: "#000",
          }}
        />
      )}
    </View>
  );
}
