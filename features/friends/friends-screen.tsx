import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { PsnAvatar } from "@/components/psn-avatar";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { FriendPresence } from "@/types/psn";
import { useFriends } from "./use-friends";

const PS_DARK = "#00439C";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastOnline(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
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
    <Animated.View style={[styles.row, style]}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: "rgba(255,255,255,0.09)",
        }}
      />
      <View style={{ flex: 1, gap: 8 }}>
        <View
          style={{
            height: 13,
            width: "55%",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 5,
          }}
        />
        <View
          style={{
            height: 10,
            width: "38%",
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: 4,
          }}
        />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionLabel({
  title,
  count,
  color,
  badgeBg,
}: {
  title: string;
  count: number;
  color: string;
  badgeBg: string;
}) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={[styles.sectionLabelText, { color }]}>{title}</Text>
      <View style={[styles.sectionLabelBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.sectionLabelCount, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Friend row
// ---------------------------------------------------------------------------

function FriendRow({
  friend,
  onPress,
  text,
  subtle,
}: {
  friend: FriendPresence;
  onPress: () => void;
  text: string;
  subtle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <View style={styles.row}>
        <PsnAvatar
          uri={friend.avatarUrl}
          onlineId={friend.onlineId}
          size={46}
          isOnline={friend.isOnline}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.friendName, { color: text }]} numberOfLines={1}>
            {friend.onlineId}
          </Text>
          {friend.isOnline ? (
            <Text
              style={[
                styles.friendSub,
                { color: friend.currentlyPlayingTitle ? "#4CAF50" : subtle },
              ]}
              numberOfLines={1}
            >
              {friend.currentlyPlayingTitle
                ? `Playing ${friend.currentlyPlayingTitle}`
                : "Online"}
            </Text>
          ) : (
            <Text
              style={[styles.friendSub, { color: subtle }]}
              numberOfLines={1}
            >
              {formatLastOnline(friend.lastOnlineAt)}
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: subtle }]}>›</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type Section = { title: string; count: number; data: FriendPresence[] };

export default function FriendsScreen() {
  const router = useRouter();
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
    onlineFriends,
    offlineFriends,
    totalCount,
    onlineCount,
    isLoading,
    isError,
    isFetching,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useFriends();

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (onlineFriends.length > 0)
      out.push({
        title: "Online",
        count: onlineFriends.length,
        data: onlineFriends,
      });
    if (offlineFriends.length > 0)
      out.push({
        title: "Offline",
        count: offlineFriends.length,
        data: offlineFriends,
      });
    return out;
  }, [onlineFriends, offlineFriends]);

  const handleOpenFriend = useCallback(
    (friend: FriendPresence) => {
      router.push({
        pathname: "/friend/[accountId]",
        params: {
          accountId: friend.accountId,
          onlineId: friend.onlineId,
          avatarUrl: friend.avatarUrl,
          isOnline: friend.isOnline ? "1" : "0",
          currentlyPlayingTitle: friend.currentlyPlayingTitle ?? "",
          lastOnlineAt: friend.lastOnlineAt,
        },
      });
    },
    [router],
  );

  const ListHeader = useMemo(
    () => (
      <Animated.View entering={FadeIn.duration(300)}>
        <LinearGradient
          colors={[PS_DARK, "#001A3A", "#000000"]}
          locations={[0, 0.6, 1]}
          style={{ paddingBottom: 12 }}
        >
          {/* Title row */}
          <View style={[styles.titleRow, { paddingTop: insets.top + 8 }]}>
            <Text style={[styles.heading, { color: text }]}>Friends</Text>
            <View style={styles.titleRight}>
              {isFetching && !isLoading && (
                <ActivityIndicator size="small" color={tint} />
              )}
              {totalCount > 0 && (
                <Text style={[styles.countLabel, { color: subtle }]}>
                  {onlineCount} online
                </Text>
              )}
            </View>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text style={[styles.searchIcon, { color: subtle }]}>⌕</Text>
            <TextInput
              style={[styles.searchInput, { color: text }]}
              placeholder="Search friends…"
              placeholderTextColor={subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </LinearGradient>

        <View style={[styles.divider, { backgroundColor: inputBg }]} />
      </Animated.View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      bg,
      text,
      tint,
      subtle,
      inputBg,
      insets.top,
      isFetching,
      isLoading,
      totalCount,
      onlineCount,
      searchQuery,
    ],
  );

  if (isError) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: bg, paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={[styles.stateTitle, { color: text }]}>
          Could not load friends
        </Text>
        <Pressable
          onPress={refetch}
          style={[styles.retryBtn, { borderColor: tint }]}
        >
          <Text style={[styles.retryText, { color: tint }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <LinearGradient
          colors={[PS_DARK, "#001A3A", "#000000"]}
          locations={[0, 0.6, 1]}
          style={{ paddingBottom: 12 }}
        >
          <View style={[styles.titleRow, { paddingTop: insets.top + 8 }]}>
            <Text style={[styles.heading, { color: text }]}>Friends</Text>
          </View>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: "rgba(255,255,255,0.1)",
                opacity: 0.5,
                marginHorizontal: 16,
                marginBottom: 10,
              },
            ]}
          >
            <Text style={[styles.searchIcon, { color: subtle }]}>⌕</Text>
            <View
              style={{
                height: 14,
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 6,
              }}
            />
          </View>
        </LinearGradient>
        <View style={[styles.divider, { backgroundColor: inputBg }]} />
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    );
  }

  return (
    <SectionList<FriendPresence, Section>
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      sections={sections}
      keyExtractor={(item) => item.accountId}
      ListHeaderComponent={ListHeader}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionLabelWrap, { backgroundColor: bg }]}>
          <SectionLabel
            title={section.title}
            count={section.count}
            color={subtle}
            badgeBg={inputBg}
          />
        </View>
      )}
      renderItem={({ item, index }) => (
        <Animated.View
          entering={FadeInDown.delay(Math.min(index * 40, 400))
            .springify()
            .damping(18)
            .stiffness(130)}
        >
          <FriendRow
            friend={item}
            onPress={() => handleOpenFriend(item)}
            text={text}
            subtle={subtle}
          />
        </Animated.View>
      )}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: inputBg }]} />
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.stateTitle, { color: subtle }]}>
            {searchQuery ? "No friends match your search" : "No friends found"}
          </Text>
        </View>
      }
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
      stickySectionHeadersEnabled
      initialNumToRender={20}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  heading: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  titleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countLabel: { fontSize: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 18, marginRight: 6, lineHeight: 22 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  sectionLabelWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionLabelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  sectionLabelCount: { fontSize: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  friendName: { fontSize: 15, fontWeight: "600" },
  friendSub: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  center: { paddingTop: 80, alignItems: "center", gap: 10 },
  stateTitle: { fontSize: 17, fontWeight: "600" },
  retryBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  retryText: { fontSize: 15, fontWeight: "600" },
});
