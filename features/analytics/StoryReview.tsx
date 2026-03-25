import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface StoryStat {
    title: string;
    value: string;
    subtitle: string;
    imageUrl?: string;
    bgColors: [string, string, ...string[]];
}

export function StoryReview({
  visible,
  onClose,
  stats,
}: {
  visible: boolean;
  onClose: () => void;
  stats: StoryStat[];
}) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIndex(0);
      startSlide(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startSlide = (i: number) => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 5000 }, (finished) => {
      if (finished) {
        // move to next if possible
        // We handle index increment using runOnJS if needed but simple useEffect works too.
      }
    });
  };

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
        setIndex((prev) => {
            if (prev < stats.length - 1) {
                return prev + 1;
            } else {
                onClose(); // auto close when done
                return prev;
            }
        });
    }, 5000);
    return () => clearInterval(t);
  }, [visible, stats.length, onClose]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 5000 });
  }, [index, progress]);

  if (!visible || !stats[index]) return null;

  const current = stats[index];

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient colors={current.bgColors} style={StyleSheet.absoluteFill} />
        
        {/* Progress Bars */}
        <View style={[styles.progressContainer, { top: insets.top + 10 }]}>
          {stats.map((_, i) => (
            <View key={i} style={styles.progressBarBg}>
              <Animated.View 
                style={[
                    styles.progressBarFill, 
                    i < index ? { width: '100%' } : i === index ? useAnimatedStyle(() => ({ width: `${progress.value * 100}%` })) : { width: '0%' }
                ]} 
              />
            </View>
          ))}
        </View>

        {/* Content */}
        <Animated.View key={index} entering={FadeInRight} style={styles.content}>
           {current.imageUrl && (
               <Animated.View entering={FadeInDown.delay(300)} style={styles.imageContainer}>
                   <Image source={{ uri: current.imageUrl }} style={styles.image} contentFit="cover" />
               </Animated.View>
           )}
           <Animated.Text entering={FadeInDown.delay(500)} style={styles.title}>{current.title}</Animated.Text>
           <Animated.Text entering={FadeInDown.delay(700)} style={styles.value}>{current.value}</Animated.Text>
           <Animated.Text entering={FadeInDown.delay(900)} style={styles.subtitle}>{current.subtitle}</Animated.Text>
        </Animated.View>

        {/* Swipe/Tap Overlays */}
        <View style={styles.overlays}>
            <Pressable style={styles.tapArea} onPress={() => {
                if (index > 0) setIndex(index - 1);
            }} />
            <Pressable style={styles.tapArea} onPress={() => {
                if (index < stats.length - 1) setIndex(index + 1);
                else onClose();
            }} />
        </View>

        {/* Close */}
        <Pressable 
            style={[styles.closeBtn, { top: insets.top + 40 }]} 
            onPress={onClose}
        >
            <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 4,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  imageContainer: {
    width: 240,
    height: 240,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  value: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 10,
    letterSpacing: -1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
  },
  overlays: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tapArea: {
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
  },
});
