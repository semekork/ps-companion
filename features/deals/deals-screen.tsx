import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useDeals, type Deal } from "./use-deals";

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;
  const tint = useThemeColor({}, "tint") as string;
  const subtle = useThemeColor({ light: "#8E8E93", dark: "#636366" }, "icon") as string;

  const { data: deals, isLoading, refetch } = useDeals();

  const renderDeal = ({ item, index }: { item: Deal; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={styles.card}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>{item.discount}</Text>
      </View>
      <View style={[styles.info, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.salePrice, { color: tint }]}>{item.salePrice}</Text>
          <Text style={[styles.originalPrice, { color: subtle }]}>{item.originalPrice}</Text>
        </View>
        <Text style={[styles.endDate, { color: subtle }]}>{item.endDate}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <LinearGradient
        colors={["#0070D1", "#00439C", bg]}
        locations={[0, 0.4, 0.9]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={[styles.heading, { color: "#fff" }]}>Exclusive Deals</Text>
        <Text style={[styles.subheading, { color: "rgba(255,255,255,0.7)" }]}>
          Limited time offers for your library
        </Text>
      </LinearGradient>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={renderDeal}
        numColumns={2}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 80, backgroundColor: bg },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={{ color: subtle }}>No active deals found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  list: {
    padding: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  info: {
    padding: 12,
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  salePrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  endDate: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  empty: {
    paddingTop: 100,
    alignItems: "center",
  },
});
