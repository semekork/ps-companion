import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";
import type { BlogPost } from "@/types/psn";
import { useNews } from "./use-news";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  const pulse = useSharedValue(0.35);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 750 }),
        withTiming(0.35, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonTag} />
        <View style={[styles.skeletonLine, { width: "90%" }]} />
        <View style={[styles.skeletonLine, { width: "65%" }]} />
        <View style={styles.skeletonDate} />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// News card
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NewsCard = React.memo(function NewsCard({
  post,
  index,
  animate,
  subtle,
  tint,
}: {
  post: BlogPost;
  index: number;
  animate: boolean;
  subtle: string;
  tint: string;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (post.url) WebBrowser.openBrowserAsync(post.url);
  }, [post.url]);

  const delay = Math.min(index * 60, 600);

  return (
    <Animated.View
      entering={
        animate
          ? FadeInDown.delay(delay).springify().damping(16).stiffness(120)
          : undefined
      }
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        style={[styles.card, cardStyle]}
      >
        {/* Thumbnail */}
        <View style={styles.imageWrap}>
          {post.thumbnailUrl ? (
            <Image
              source={{ uri: post.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>📰</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.82)"]}
            locations={[0.35, 1]}
            style={[StyleSheet.absoluteFill, styles.imageGradient]}
          />
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: tint }]}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {post.category}
            </Text>
          </View>
          {/* Title + date overlay */}
          <View style={styles.imageOverlay}>
            <Text style={styles.cardTitle} numberOfLines={3}>
              {post.title}
            </Text>
            <Text style={[styles.cardDate, { color: "rgba(255,255,255,0.6)" }]}>
              {formatDate(post.publishedAt)}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;
  const tint = useThemeColor({}, "tint") as string;
  const subtle = useThemeColor(
    { light: "#8E8E93", dark: "#636366" },
    "icon",
  ) as string;
  const inputBg = useThemeColor(
    { light: "#E5E5EA", dark: "#2C2C2E" },
    "background",
  ) as string;

  const {
    posts,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useNews();

  const renderPost = useCallback(
    ({ item, index }: { item: BlogPost; index: number }) => (
      <NewsCard
        post={item}
        index={index}
        animate={isLoading}
        subtle={subtle}
        tint={tint}
      />
    ),
    [subtle, tint, isLoading],
  );

  const ListHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={[styles.heading, { color: text }]}>News</Text>
      <View style={styles.headerRight}>
        {isFetching && !isLoading && !isFetchingNextPage && (
          <ActivityIndicator size="small" color={tint} />
        )}
        <Text style={[styles.subheading, { color: subtle }]}>
          PlayStation Blog
        </Text>
      </View>
    </View>
  );

  const ListFooter = hasNextPage ? (
    <Pressable
      onPress={() => fetchNextPage()}
      style={[styles.loadMoreBtn, { borderColor: tint }]}
      disabled={isFetchingNextPage}
    >
      {isFetchingNextPage ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Text style={[styles.loadMoreText, { color: tint }]}>Load more</Text>
      )}
    </Pressable>
  ) : null;

  if (isError) {
    return (
      <View
        style={[styles.center, { backgroundColor: bg, paddingTop: insets.top }]}
      >
        <Text style={[styles.stateTitle, { color: text }]}>
          Could not load news
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { borderColor: tint }]}
        >
          <Text style={[styles.retryText, { color: tint }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[{ flex: 1, backgroundColor: bg }]}>
        {ListHeader}
        <View style={[styles.divider, { backgroundColor: inputBg }]} />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList<BlogPost>
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={renderPost}
      ListHeaderComponent={
        <>
          {ListHeader}
          <View style={[styles.divider, { backgroundColor: inputBg }]} />
        </>
      }
      ListFooterComponent={ListFooter}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.stateTitle, { color: subtle }]}>
            No posts found
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: inputBg }]} />
      )}
      refreshing={isFetching && !isLoading && !isFetchingNextPage}
      onRefresh={refetch}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heading: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  subheading: { fontSize: 14 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  // Card
  card: { marginHorizontal: 16, marginVertical: 6 },
  imageWrap: {
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  imageGradient: { borderRadius: 16 },
  imageFallback: {
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: { fontSize: 48 },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  cardDate: { fontSize: 11 },

  // Skeleton
  skeletonCard: { marginHorizontal: 16, marginVertical: 6 },
  skeletonImage: {
    height: 210,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  skeletonBody: { paddingTop: 10, gap: 8 },
  skeletonTag: {
    height: 16,
    width: 64,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonLine: {
    height: 13,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonDate: {
    height: 11,
    width: 80,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Load more
  loadMoreBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 8,
    minWidth: 120,
    alignItems: "center",
  },
  loadMoreText: { fontSize: 14, fontWeight: "600" },

  // States
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  stateTitle: { fontSize: 16, fontWeight: "600" },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  retryText: { fontSize: 15, fontWeight: "600" },
});
