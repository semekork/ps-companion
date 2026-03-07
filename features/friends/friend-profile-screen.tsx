import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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

import { PlatformBadge } from "@/components/platform-badge";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { FriendExtras, FriendRecentGame } from "@/types/psn";
import { useFriendExtras, useFriendProfile } from "./use-friend-profile";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BANNER_HEIGHT = 200;
const AVATAR_SIZE = 80;
const AVATAR_OVERLAP = 36;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastOnlineRelative(iso: string): string {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30)
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

function formatLastOnlineDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonHero({ topInset, bg }: { topInset: number; bg: string }) {
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
    <Animated.View style={[{ flex: 1, backgroundColor: bg }, style]}>
      <View
        style={{
          height: BANNER_HEIGHT,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View
        style={{
          marginTop: -AVATAR_OVERLAP,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 14,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: "rgba(255,255,255,0.10)",
            borderWidth: 3,
            borderColor: bg,
          }}
        />
        <View style={{ flex: 1, paddingBottom: 6, gap: 8 }}>
          <View
            style={{
              height: 18,
              width: "55%",
              backgroundColor: "rgba(255,255,255,0.10)",
              borderRadius: 6,
            }}
          />
          <View
            style={{
              height: 12,
              width: "30%",
              backgroundColor: "rgba(255,255,255,0.07)",
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Now Playing card (library card style)
// ---------------------------------------------------------------------------

function NowPlayingCard({
  title,
  platform,
  iconUrl,
  tint,
  subtle,
  text,
  cardBg,
}: {
  title: string;
  platform?: string;
  iconUrl?: string;
  tint: string;
  subtle: string;
  text: string;
  cardBg: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify().damping(18)}
      style={[styles.statusCard, { backgroundColor: cardBg }]}
    >
      <Text style={[styles.cardLabel, { color: subtle }]}>
        CURRENTLY PLAYING
      </Text>
      <View style={styles.gameRow}>
        <View style={styles.gameIconWrap}>
          {iconUrl ? (
            <Image
              source={{ uri: iconUrl }}
              style={styles.gameIcon}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.gameIcon, styles.gameIconFallback]}>
              <Text style={{ fontSize: 24 }}>🎮</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={[styles.gameTitle, { color: text }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.gameMetaRow}>
            <View style={[styles.playingDot, { backgroundColor: tint }]} />
            <Text style={[styles.gameMetaText, { color: subtle }]}>
              Playing now
            </Text>
            {platform ? <PlatformBadge platform={platform} /> : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Last seen card
// ---------------------------------------------------------------------------

function LastSeenCard({
  lastOnlineAt,
  subtle,
  text,
  cardBg,
}: {
  lastOnlineAt: string;
  subtle: string;
  text: string;
  cardBg: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify().damping(18)}
      style={[styles.statusCard, { backgroundColor: cardBg }]}
    >
      <Text style={[styles.cardLabel, { color: subtle }]}>LAST SEEN</Text>
      <Text style={[styles.lastSeenRelative, { color: text }]}>
        {formatLastOnlineRelative(lastOnlineAt)}
      </Text>
      {lastOnlineAt ? (
        <Text style={[styles.lastSeenDate, { color: subtle }]}>
          {formatLastOnlineDate(lastOnlineAt)}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Tier + trophy constants
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<number, string> = {
  1: "Bronze I",
  2: "Bronze II",
  3: "Bronze III",
  4: "Silver I",
  5: "Silver II",
  6: "Silver III",
  7: "Gold I",
  8: "Gold II",
  9: "Gold III",
  10: "Platinum",
};

const TIER_COLOR: Record<number, string> = {
  1: "#CD7F32",
  2: "#CD7F32",
  3: "#CD7F32",
  4: "#A8A9AD",
  5: "#A8A9AD",
  6: "#A8A9AD",
  7: "#D4AF37",
  8: "#D4AF37",
  9: "#D4AF37",
  10: "#B0C4DE",
};

const TROPHY_DOT_COLORS = {
  platinum: "#B0C4DE",
  gold: "#D4AF37",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
} as const;

// ---------------------------------------------------------------------------
// PS Plus badge
// ---------------------------------------------------------------------------

function PSPlusBadge({ tint }: { tint: string }) {
  return (
    <View style={[styles.psPlusBadge, { backgroundColor: tint }]}>
      <Text style={styles.psPlusBadgeText}>PS+</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Trophy level card
// ---------------------------------------------------------------------------

function TrophyCard({
  data,
  subtle,
  text,
  cardBg,
}: {
  data: FriendExtras;
  subtle: string;
  text: string;
  cardBg: string;
}) {
  const tierColor = TIER_COLOR[data.tier] ?? "#CD7F32";
  return (
    <Animated.View
      entering={FadeInDown.delay(300).springify().damping(18)}
      style={[
        styles.statusCard,
        { backgroundColor: cardBg, marginHorizontal: 16, marginBottom: 12 },
      ]}
    >
      <Text style={[styles.cardLabel, { color: subtle }]}>TROPHY LEVEL</Text>
      <View style={styles.trophyMainRow}>
        <View style={{ minWidth: 76 }}>
          <Text style={[styles.trophyLevelNum, { color: text }]}>
            {data.trophyLevel}
          </Text>
          <Text style={[styles.trophyTierLabel, { color: tierColor }]}>
            {TIER_LABEL[data.tier]}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: "rgba(255,255,255,0.08)" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${data.levelProgress}%` as any,
                  backgroundColor: tierColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressPct, { color: subtle }]}>
            {data.levelProgress}%
          </Text>
        </View>
        <View style={styles.trophyCountGrid}>
          {(
            Object.keys(TROPHY_DOT_COLORS) as (keyof typeof TROPHY_DOT_COLORS)[]
          ).map((grade) => (
            <View key={grade} style={styles.trophyCountItem}>
              <View
                style={[
                  styles.trophyDot,
                  { backgroundColor: TROPHY_DOT_COLORS[grade] },
                ]}
              />
              <Text style={[styles.trophyCountNum, { color: text }]}>
                {data.earnedTrophies[grade]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Recent games card
// ---------------------------------------------------------------------------

function RecentGamesCard({
  games,
  subtle,
  text,
  cardBg,
}: {
  games: FriendRecentGame[];
  subtle: string;
  text: string;
  cardBg: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400).springify().damping(18)}
      style={{ marginBottom: 20 }}
    >
      <Text
        style={[
          styles.cardLabel,
          { color: subtle, marginHorizontal: 16, marginBottom: 12 },
        ]}
      >
        RECENTLY PLAYED
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
      >
        {games.map((g) => (
          <View
            key={g.npCommunicationId}
            style={[styles.recentGameItem, { backgroundColor: cardBg }]}
          >
            {g.iconUrl ? (
              <Image
                source={{ uri: g.iconUrl }}
                style={styles.recentGameIcon}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={[styles.recentGameIcon, styles.gameIconFallback]}>
                <Text style={{ fontSize: 20 }}>🎮</Text>
              </View>
            )}
            <View style={{ padding: 8, gap: 3 }}>
              <Text
                style={[styles.recentGameTitle, { color: text }]}
                numberOfLines={2}
              >
                {g.name}
              </Text>
              <Text style={[styles.recentGameProgress, { color: subtle }]}>
                {g.progress}%
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Profile header
// ---------------------------------------------------------------------------

type HeaderProps = {
  onlineId: string;
  avatarUrl: string;
  isOnline: boolean;
  currentlyPlayingTitle?: string;
  currentlyPlayingPlatform?: string;
  currentlyPlayingIconUrl?: string;
  lastOnlineAt: string;
  aboutMe?: string;
  isPlus?: boolean;
  bg: string;
  tint: string;
  subtle: string;
  text: string;
  cardBg: string;
};

function ProfileHeader({
  onlineId,
  avatarUrl,
  isOnline,
  currentlyPlayingTitle,
  currentlyPlayingPlatform,
  currentlyPlayingIconUrl,
  lastOnlineAt,
  aboutMe,
  isPlus,
  bg,
  tint,
  subtle,
  text,
  cardBg,
}: HeaderProps) {
  const onlineColor = isOnline ? "#4CAF50" : "#48484A";

  return (
    <View>
      {/* ── Banner ──────────────────────────────────────── */}
      <View style={{ height: BANNER_HEIGHT, overflow: "hidden" }}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={28}
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#1C1C1E" }]}
          />
        )}
        {/* dark overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.4)" },
          ]}
        />
        {/* fade into bg */}
        <LinearGradient
          colors={["transparent", bg]}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* online accent line */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: onlineColor,
          }}
        />
      </View>

      {/* ── Avatar + Identity ────────────────────────────── */}
      <View style={[styles.identityRow, { marginTop: -AVATAR_OVERLAP }]}>
        <Animated.View
          entering={FadeInDown.delay(60).springify().damping(18)}
          style={[styles.avatarRing, { borderColor: bg }]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
              }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: cardBg }]}>
              <Text style={{ color: text, fontSize: 28, fontWeight: "700" }}>
                {onlineId.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: onlineColor, borderColor: bg },
            ]}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(18)}
          style={styles.identityInfo}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            <Text style={[styles.heroName, { color: text }]} numberOfLines={1}>
              {onlineId}
            </Text>
            {isPlus && <PSPlusBadge tint={tint} />}
          </View>
          <Text style={[styles.statusLabel, { color: onlineColor }]}>
            {isOnline ? "● Online" : "● Offline"}
          </Text>
          {aboutMe ? (
            <Text style={[styles.bioText, { color: subtle }]} numberOfLines={3}>
              {aboutMe}
            </Text>
          ) : null}
        </Animated.View>
      </View>

      {/* ── Status card ──────────────────────────────────── */}
      <View style={styles.cardsArea}>
        {isOnline && currentlyPlayingTitle ? (
          <NowPlayingCard
            title={currentlyPlayingTitle}
            platform={currentlyPlayingPlatform}
            iconUrl={currentlyPlayingIconUrl}
            tint={tint}
            subtle={subtle}
            text={text}
            cardBg={cardBg}
          />
        ) : (
          <LastSeenCard
            lastOnlineAt={lastOnlineAt}
            subtle={subtle}
            text={text}
            cardBg={cardBg}
          />
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: cardBg }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FriendProfileScreen() {
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    accountId: string;
    onlineId: string;
    avatarUrl: string;
    isOnline: string;
    currentlyPlayingTitle: string;
    lastOnlineAt: string;
  }>();

  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;
  const tint = useThemeColor({}, "tint") as string;
  const subtle = useThemeColor(
    { light: "#8E8E93", dark: "#636366" },
    "icon",
  ) as string;
  const cardBg = useThemeColor(
    { light: "#F2F2F7", dark: "#1C1C1E" },
    "background",
  ) as string;

  const {
    data: profile,
    isLoading,
    isError,
    isFetching: profileFetching,
    refetch,
  } = useFriendProfile();
  const extrasQuery = useFriendExtras();

  const isRefreshing = profileFetching || extrasQuery.isFetching;

  const handleRefresh = useCallback(() => {
    refetch();
    extrasQuery.refetch();
  }, [refetch, extrasQuery]);

  const isOnline = profile ? profile.isOnline : params.isOnline === "1";
  const currentlyPlayingTitle =
    profile?.currentlyPlayingTitle ??
    (params.currentlyPlayingTitle || undefined);
  const currentlyPlayingPlatform = profile?.currentlyPlayingPlatform;
  const currentlyPlayingIconUrl = profile?.currentlyPlayingIconUrl;
  const lastOnlineAt = profile?.lastOnlineAt ?? params.lastOnlineAt ?? "";

  const headerProps: HeaderProps = useMemo(
    () => ({
      onlineId: params.onlineId,
      avatarUrl: params.avatarUrl,
      isOnline,
      currentlyPlayingTitle,
      currentlyPlayingPlatform,
      currentlyPlayingIconUrl,
      lastOnlineAt,
      aboutMe: profile?.aboutMe,
      isPlus: profile?.isPlus,
      bg,
      tint,
      subtle,
      text,
      cardBg,
    }),
    [
      params.onlineId,
      params.avatarUrl,
      isOnline,
      currentlyPlayingTitle,
      currentlyPlayingPlatform,
      currentlyPlayingIconUrl,
      lastOnlineAt,
      profile?.aboutMe,
      profile?.isPlus,
      bg,
      tint,
      subtle,
      text,
      cardBg,
    ],
  );

  const ListHeader = useMemo(
    () => (
      <View>
        <ProfileHeader {...headerProps} />
        {extrasQuery.isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator color={tint} />
          </View>
        ) : extrasQuery.data ? (
          <>
            <TrophyCard
              data={extrasQuery.data}
              subtle={subtle}
              text={text}
              cardBg={cardBg}
            />
            {extrasQuery.data.recentGames.length > 0 && (
              <RecentGamesCard
                games={extrasQuery.data.recentGames}
                subtle={subtle}
                text={text}
                cardBg={cardBg}
              />
            )}
          </>
        ) : null}
      </View>
    ),
    [
      headerProps,
      extrasQuery.isLoading,
      extrasQuery.data,
      tint,
      subtle,
      text,
      cardBg,
    ],
  );

  if (isLoading && !params.onlineId) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <SkeletonHero topInset={insets.top} bg={bg} />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={[styles.heroName, { color: text, textAlign: "center" }]}>
          Could not load profile
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { borderColor: tint }]}
        >
          <Text style={{ color: tint, fontWeight: "600", fontSize: 15 }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      data={[]}
      keyExtractor={() => ""}
      ListHeaderComponent={ListHeader}
      renderItem={() => null}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    overflow: "visible",
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  identityInfo: { flex: 1, paddingBottom: 6, gap: 5 },
  heroName: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  statusLabel: { fontSize: 13, fontWeight: "600" },

  cardsArea: { paddingHorizontal: 16, paddingBottom: 20 },
  statusCard: { borderRadius: 14, padding: 16 },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  gameRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  gameIconWrap: { width: 64, height: 64, borderRadius: 12, overflow: "hidden" },
  gameIcon: { width: 64, height: 64 },
  gameIconFallback: {
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameTitle: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  gameMetaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  playingDot: { width: 6, height: 6, borderRadius: 3 },
  gameMetaText: { fontSize: 12 },

  lastSeenRelative: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  lastSeenDate: { fontSize: 13 },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  retryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  emptyText: { fontSize: 14 },
  // PS Plus badge
  psPlusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  psPlusBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  // Bio
  bioText: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  // Trophy card
  trophyMainRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 20,
    marginTop: 4,
  },
  trophyLevelNum: {
    fontSize: 44,
    fontWeight: "800" as const,
    lineHeight: 48,
    letterSpacing: -1,
  },
  trophyTierLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden" as const,
    marginBottom: 4,
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressPct: { fontSize: 11 },
  trophyCountGrid: {
    flex: 1,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 14,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
  },
  trophyCountItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
  },
  trophyDot: { width: 8, height: 8, borderRadius: 4 },
  trophyCountNum: { fontSize: 16, fontWeight: "700" as const },
  // Recent games
  recentGameItem: { width: 120, borderRadius: 12, overflow: "hidden" },
  recentGameIcon: { width: "100%" as any, height: 80 },
  recentGameTitle: { fontSize: 11, fontWeight: "600" as const, lineHeight: 15 },
  recentGameProgress: { fontSize: 11 },
});
