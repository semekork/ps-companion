import { Image, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  cornerRadius,
  font,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity } from "expo-widgets";

export type FriendActivityProps = {
  friendOnlineId: string;
  gameTitle: string;
};

const FriendActivity = (props?: FriendActivityProps) => {
  "widget";

  const psDark = "#00439C";
  const white = "#FFFFFF";

  const friendName = props?.friendOnlineId ?? "Friend";
  const game = props?.gameTitle ?? "Game";

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 }), background(psDark)]}>
        <Text modifiers={[font({ weight: "bold" }), foregroundStyle(white)]}>
          {friendName}
        </Text>
        <Text modifiers={[foregroundStyle(white)]}>Playing: {game}</Text>
      </VStack>
    ),
    compactLeading: <Image systemName="gamecontroller.fill" color={psDark} />,
    compactTrailing: <Text modifiers={[font({ size: 12 })]}>Playing</Text>,
    minimal: <Image systemName="gamecontroller.fill" color={psDark} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="gamecontroller.fill" color={psDark} />
        <Text modifiers={[font({ size: 10 })]}>Online</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text
          modifiers={[
            font({ weight: "bold", size: 16 }),
            foregroundStyle(psDark),
          ]}
        >
          PSN
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack
        modifiers={[padding({ all: 12 }), background(psDark), cornerRadius(12)]}
      >
        <Text
          modifiers={[
            font({ weight: "bold", size: 14 }),
            foregroundStyle(white),
          ]}
        >
          {friendName}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle("#E0E0E0")]}>
          Currently playing: {game}
        </Text>
      </VStack>
    ),
  };
};

export default createLiveActivity("FriendActivity", FriendActivity);
