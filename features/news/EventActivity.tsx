import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity } from "expo-widgets";

export type EventActivityProps = {
  eventTitle: string;
  eventDate: string;
  thumbnailUrl?: string;
  category?: string;
};

const EventActivity = (props?: EventActivityProps) => {
  "widget";

  const psBlue = "#0070D1";
  const white = "#FFFFFF";
  const muted = "#8E8E93";
  const psDark = "#000000";
  const progressBg = "#2C2C2E";

  const title = props?.eventTitle ?? "State of Play";

  return {
    banner: (
      <VStack
        modifiers={[
          padding({ all: 16 }),
          background(psDark),
          cornerRadius(24),
        ]}
      >
        <HStack modifiers={[padding({ bottom: 16 })]}>
          <VStack
            modifiers={[
              background(psBlue),
              cornerRadius(10),
              frame({ width: 44, height: 44 }),
            ]}
          >
            <Text
              modifiers={[
                font({ weight: "black", size: 16 }),
                foregroundStyle(white),
              ]}
            >
              PS
            </Text>
          </VStack>

          <VStack modifiers={[padding({ leading: 14 })]}>
            <Text
              modifiers={[
                font({ weight: "bold", size: 16 }),
                foregroundStyle(white),
                padding({ bottom: 2 }),
              ]}
            >
              {title}
            </Text>
            <Text
              modifiers={[
                font({ weight: "medium", size: 14 }),
                foregroundStyle(psBlue),
              ]}
            >
              Starts in 45 min
            </Text>
          </VStack>

          <Spacer />
        </HStack>

        <HStack
          modifiers={[
            background(progressBg),
            cornerRadius(2),
            frame({ height: 4 }),
          ]}
        >
          <VStack
            modifiers={[
              background(white),
              cornerRadius(2),
              frame({ height: 4, width: 220 }),
            ]}
          >
            <Text> </Text>
          </VStack>
          <Spacer />
        </HStack>
      </VStack>
    ),
    compactLeading: (
      <VStack modifiers={[padding({ leading: 4 })]}>
        <VStack
          modifiers={[
            background(psBlue),
            cornerRadius(12),
            frame({ width: 24, height: 24 }),
          ]}
        >
          <Text
            modifiers={[
              font({ weight: "black", size: 10 }),
              foregroundStyle(white),
            ]}
          >
            PS
          </Text>
        </VStack>
      </VStack>
    ),
    compactTrailing: (
      <VStack modifiers={[padding({ trailing: 6 })]}>
        <Text
          modifiers={[
            font({ weight: "bold", size: 13 }),
            foregroundStyle(white),
          ]}
        >
          45m
        </Text>
      </VStack>
    ),
    minimal: (
      <VStack
        modifiers={[
          background(psBlue),
          cornerRadius(12),
          frame({ width: 24, height: 24 }),
        ]}
      >
        <Text
          modifiers={[
            font({ weight: "black", size: 10 }),
            foregroundStyle(white),
          ]}
        >
          PS
        </Text>
      </VStack>
    ),
    expandedLeading: (
      <VStack modifiers={[padding({ leading: 16, top: 16 })]}>
        <VStack
          modifiers={[
            background(psBlue),
            cornerRadius(12),
            frame({ width: 44, height: 44 }),
          ]}
        >
          <Text
            modifiers={[
              font({ weight: "black", size: 16 }),
              foregroundStyle(white),
            ]}
          >
            PS
          </Text>
        </VStack>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ trailing: 16, top: 16 })]}>
        <Text
          modifiers={[
            font({ weight: "bold", size: 22 }),
            foregroundStyle(white),
          ]}
        >
          45m
        </Text>
        <Text
          modifiers={[
            font({ weight: "medium", size: 14 }),
            foregroundStyle(muted),
          ]}
        >
          remaining
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ top: 12, horizontal: 16, bottom: 20 })]}>
        <Text
          modifiers={[
            font({ weight: "bold", size: 18 }),
            foregroundStyle(white),
            padding({ bottom: 4 }),
          ]}
        >
          {title}
        </Text>
        <Text
          modifiers={[
            font({ weight: "medium", size: 14 }),
            foregroundStyle(muted),
            padding({ bottom: 16 }),
          ]}
        >
          Live broadcast starting soon
        </Text>

        <HStack
          modifiers={[
            background(progressBg),
            cornerRadius(3),
            frame({ height: 6 }),
          ]}
        >
          <VStack
            modifiers={[
              background(white),
              cornerRadius(3),
              frame({ width: 260, height: 6 }),
            ]}
          >
            <Text> </Text>
          </VStack>
          <Spacer />
        </HStack>
      </VStack>
    ),
  };
};

export default createLiveActivity("EventActivity", EventActivity);
