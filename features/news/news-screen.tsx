import { Image } from "expo-image";
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

import type { BlogPost } from "@/types/psn";
import { useNews } from "./use-news";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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
    <Animated.View
      style={[
        {
          marginHorizontal: 20,
          marginVertical: 10,
          backgroundColor: "#18181b", // zinc-900 equivalent
          borderRadius: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        },
        style,
      ]}
    >
      <View
        style={{
          width: "100%",
          height: 210,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View style={{ padding: 16 }}>
        <View
          style={{
            width: 100,
            height: 12,
            backgroundColor: "rgba(255,255,255,0.08)",
            marginBottom: 16,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            width: "90%",
            height: 16,
            backgroundColor: "rgba(255,255,255,0.08)",
            marginBottom: 8,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            width: "65%",
            height: 16,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 4,
          }}
        />
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
}: {
  post: BlogPost;
  index: number;
  animate: boolean;
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
        className="mx-5 my-2.5 bg-zinc-900 rounded-xl overflow-hidden border border-white/5"
        style={cardStyle}
      >
        <View
          style={{ height: 210, width: "100%", backgroundColor: "#1C1C1E" }}
        >
          {post.thumbnailUrl ? (
            <Image
              source={{ uri: post.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-5xl">📰</Text>
            </View>
          )}
        </View>
        <View className="p-4 bg-zinc-900 border-t border-white/5">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            {post.category} • {formatRelativeDate(post.publishedAt)}
          </Text>
          <Text
            className="text-white font-semibold text-lg leading-snug"
            numberOfLines={3}
          >
            {post.title}
          </Text>
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
      <NewsCard post={item} index={index} animate={isLoading} />
    ),
    [isLoading],
  );

  const ListHeader = (
    <View
      className="flex-row items-center justify-between px-5 mb-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Text className="text-white text-2xl font-bold tracking-tight">
        Official News
      </Text>
      <View className="flex-row items-center gap-x-2">
        {isFetching && !isLoading && !isFetchingNextPage && (
          <ActivityIndicator size="small" color="#fff" />
        )}
      </View>
    </View>
  );

  const ListFooter = hasNextPage ? (
    <Pressable
      onPress={() => fetchNextPage()}
      className="self-center border border-white/20 rounded-lg px-8 py-2.5 mt-4 mb-8 min-w-[120px] items-center active:bg-white/10"
      disabled={isFetchingNextPage}
    >
      {isFetchingNextPage ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text className="text-white text-sm font-semibold">Load more</Text>
      )}
    </Pressable>
  ) : null;

  if (isError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-black"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-white text-base font-semibold mb-3">
          Could not load news
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="border border-white/20 rounded-lg px-7 py-2.5 active:bg-white/10"
        >
          <Text className="text-white text-sm font-semibold">Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        {ListHeader}
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList<BlogPost>
      className="flex-1 bg-black"
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={renderPost}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center pt-20">
          <Text className="text-gray-500 text-base font-medium">
            No posts found
          </Text>
        </View>
      }
      refreshing={isFetching && !isLoading && !isFetchingNextPage}
      onRefresh={refetch}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
