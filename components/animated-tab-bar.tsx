/**
 * AnimatedTabBar — custom floating tab bar with:
 *  • Frosted-glass dark pill card floating above the screen edge
 *  • PS-blue sliding active indicator (layoutAnimation)
 *  • Per-icon spring scale + opacity bounce on press
 *  • Label fades in/slides up when active, fades out when inactive
 */

import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PS_BLUE = "#0070D1";
const SPRING = { damping: 14, stiffness: 200, mass: 0.6 };

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: 24,
        right: 24,
        backgroundColor: "rgba(10, 10, 12, 0.96)",
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 8,
        // shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 24,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isActive = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TabItem
            key={route.key}
            isActive={isActive}
            options={options}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// ─── Single tab item ──────────────────────────────────────────────────────────

function TabItem({
  isActive,
  options,
  onPress,
}: {
  isActive: boolean;
  options: BottomTabNavigationOptions;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  function handlePress() {
    // Navigate immediately — don't gate it behind the animation
    onPress();
    // Visual bounce runs independently
    scale.value = withSpring(0.75, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, SPRING);
    });
  }

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isActive ? "#fff" : "#8E8E93";
  const activeBg = isActive ? PS_BLUE : "transparent";

  return (
    <Pressable
      onPress={handlePress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      hitSlop={8}
    >
      <Animated.View
        style={[
          iconContainerStyle,
          {
            backgroundColor: activeBg,
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        {options.tabBarIcon?.({
          focused: isActive,
          color: iconColor,
          size: 22,
        })}
      </Animated.View>
    </Pressable>
  );
}
