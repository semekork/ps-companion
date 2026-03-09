import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { PlatformBadge } from "@/components/platform-badge";
import { ProgressRing } from "@/components/progress-ring";
import { PsnAvatar } from "@/components/psn-avatar";
import { Skeleton } from "@/components/skeleton-placeholder";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { useUser } from "@/context/user-context";
import type { Milestone } from "@/features/analytics/analytics-types";
import { useAnalytics } from "@/features/analytics/use-analytics";
import { useContinuePlaying } from "@/features/dashboard/use-dashboard";
import type { LibraryGame } from "@/types/psn";

// ─── Constants ───────────────────────────────────────────────────────────────

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

const PILL_COLORS = {
  platinum: "#B468F0",
  gold: "#E8B420",
  silver: "#9BA7AF",
  bronze: "#C47A3A",
} as const;

const TROPHY_COLORS = {
  platinum: "#B0C4DE",
  gold: "#D4AF37",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
};

const PLATFORM_COLORS: Record<string, string> = {
  ps5: "#0070D1",
  ps4: "#003087",
  ps3: "#8E44AD",
  psvita: "#E67E22",
  unknown: "#555",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  if (h >= 1000) return `${(h / 1000).toFixed(1)}k`;
  return h.toLocaleString();
}

function formatAvgSession(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatGamingSince(iso: string): string {
  if (!iso) return "—";
  const year = new Date(iso).getFullYear();
  return `Since ${year}`;
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatBox({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof IconSymbol>["name"];
}) {
  return (
    <View className="flex-1 items-center py-3 bg-zinc-800 rounded-xl">
      <IconSymbol name={icon} size={16} color={PS_BLUE} />
      <Text className="text-white font-black text-lg mt-1">{value}</Text>
      <Text className="text-gray-400 text-[10px] font-semibold">{label}</Text>
    </View>
  );
}

function TrophyStatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View
      className="flex-1 flex-row items-center justify-center gap-x-2 py-2.5 rounded-xl"
      style={{ backgroundColor: `${color}15` }}
    >
      <Text className="font-bold text-sm" style={{ color }}>
        {value}
      </Text>
      <Text className="text-gray-400 text-[10px] font-semibold">{label}</Text>
    </View>
  );
}

function MilestoneBadge({ milestone }: { milestone: Milestone }) {
  return (
    <View
      className="items-center justify-center py-3 px-2 rounded-xl"
      style={{
        width: "31%",
        backgroundColor: milestone.earned
          ? "rgba(0,112,209,0.15)"
          : "rgba(255,255,255,0.04)",
        opacity: milestone.earned ? 1 : 0.5,
      }}
    >
      <IconSymbol
        name={milestone.icon as React.ComponentProps<typeof IconSymbol>["name"]}
        size={20}
        color={milestone.earned ? PS_BLUE : "#555"}
      />
      <Text
        className="text-[10px] font-bold text-center mt-1.5"
        style={{ color: milestone.earned ? "#fff" : "#666" }}
        numberOfLines={1}
      >
        {milestone.label}
      </Text>
      <Text
        className="text-[8px] text-center mt-0.5"
        style={{ color: milestone.earned ? "#999" : "#555" }}
        numberOfLines={2}
      >
        {milestone.description}
      </Text>
    </View>
  );
}

// ─── Profile Share Card (off-screen capture) ─────────────────────────────────

const ProfileShareCard = React.forwardRef<
  View,
  {
    onlineId: string;
    avatarUrl: string;
    isPsPlus: boolean;
    trophyLevel: number;
    progress: number;
    tier: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  }
>(
  (
    {
      onlineId,
      avatarUrl,
      isPsPlus,
      trophyLevel,
      progress,
      tier,
      platinum,
      gold,
      silver,
      bronze,
    },
    ref,
  ) => {
    return (
      <View ref={ref} style={cardStyles.card} collapsable={false}>
        <LinearGradient
          colors={[PS_DARK, "#001A3A", "#000000"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={cardStyles.gridOverlay} />
        <View style={cardStyles.brand}>
          <LinearGradient
            colors={[PS_BLUE, PS_DARK]}
            style={cardStyles.brandBox}
          >
            <Text style={cardStyles.brandText}>PS</Text>
          </LinearGradient>
          <Text style={cardStyles.brandLabel}>Companion</Text>
        </View>
        <View style={cardStyles.avatarWrapper}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={cardStyles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[cardStyles.avatar, cardStyles.avatarFallback]}>
              <Text style={cardStyles.avatarInitial}>
                {onlineId.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.onlineId}>{onlineId}</Text>
          {isPsPlus && (
            <View style={cardStyles.plusBadge}>
              <Text style={cardStyles.plusText}>PS PLUS</Text>
            </View>
          )}
        </View>
        <View style={cardStyles.levelRow}>
          <View style={cardStyles.levelBox}>
            <Text style={cardStyles.levelNumber}>{trophyLevel}</Text>
            <Text style={cardStyles.levelLabel}>LEVEL</Text>
          </View>
          <View style={cardStyles.levelBox}>
            <Text style={cardStyles.levelNumber}>{tier}</Text>
            <Text style={cardStyles.levelLabel}>TIER</Text>
          </View>
          <View style={[cardStyles.levelBox, { flex: 2 }]}>
            <View style={cardStyles.progressTrack}>
              <View
                style={[cardStyles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={cardStyles.progressPct}>{progress}% to next</Text>
          </View>
        </View>
        <View style={cardStyles.trophyRow}>
          {(
            [
              { grade: "platinum", count: platinum },
              { grade: "gold", count: gold },
              { grade: "silver", count: silver },
              { grade: "bronze", count: bronze },
            ] as const
          ).map(({ grade, count }) => (
            <View key={grade} style={cardStyles.trophyPill}>
              <View
                style={[
                  cardStyles.trophyDot,
                  { backgroundColor: TROPHY_COLORS[grade] },
                ]}
              />
              <Text style={cardStyles.trophyCount}>{count}</Text>
              <Text
                style={[
                  cardStyles.trophyGrade,
                  { color: TROPHY_COLORS[grade] },
                ]}
              >
                {grade.slice(0, 3).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
        <Text style={cardStyles.tagline}>TRACKED WITH PS COMPANION</Text>
      </View>
    );
  },
);
ProfileShareCard.displayName = "ProfileShareCard";

const cardStyles = StyleSheet.create({
  card: {
    width: 375,
    height: 260,
    overflow: "hidden",
    backgroundColor: "#001A3A",
    alignItems: "center",
    paddingTop: 20,
    gap: 10,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
  },
  brand: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  brandBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#fff", fontWeight: "900", fontSize: 10 },
  brandLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: PS_BLUE,
    overflow: "hidden",
    marginTop: 4,
  },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: {
    backgroundColor: "#1C3A6E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 28, fontWeight: "800" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineId: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  plusBadge: {
    backgroundColor: "#F9AA00",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plusText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    width: "100%",
  },
  levelBox: {
    alignItems: "center",
  },
  levelNumber: { color: "#fff", fontSize: 22, fontWeight: "900" },
  levelLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: PS_BLUE,
  },
  progressPct: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 3,
  },
  trophyRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  trophyPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 6,
  },
  trophyDot: { width: 7, height: 7, borderRadius: 3.5 },
  trophyCount: { color: "#fff", fontSize: 13, fontWeight: "700" },
  trophyGrade: { fontSize: 9, fontWeight: "600" },
  tagline: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },
});

// ─── Stat Cell ───────────────────────────────────────────────────────────────

function TrophyPill({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <View
      className="flex-row items-center gap-x-1 px-2.5 py-1.5 rounded-full"
      style={{ backgroundColor: `${color}22` }}
    >
      <View
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="text-white text-xs font-semibold">{count}</Text>
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { profile, trophySummary, isLoadingProfile } = useUser();
  const continuePlaying = useContinuePlaying();
  const { analytics, isLibraryLoaded, isPlayHistoryLoaded } = useAnalytics();

  const recentGames = continuePlaying.data?.slice(0, 8) ?? [];

  function handleOpenGame(game: LibraryGame) {
    router.push({
      pathname: "/game/[titleId]",
      params: {
        titleId: game.npCommunicationId,
        service: game.npServiceName,
        name: game.name,
        imageUrl: game.imageUrl,
        platform: game.platform,
        progress: String(game.progress),
      },
    });
  }

  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const earned = trophySummary?.earnedTrophies;
  const platinum = earned?.platinum ?? 0;
  const gold = earned?.gold ?? 0;
  const silver = earned?.silver ?? 0;
  const bronze = earned?.bronze ?? 0;
  const totalTrophies = platinum + gold + silver + bronze;

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    const message = `Check out my PlayStation profile! Level ${trophySummary?.trophyLevel ?? "?"} with ${totalTrophies} trophies 🏆 via PS Companion`;
    try {
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your PS profile",
        });
      } else {
        await Share.share({ message });
      }
    } catch {
      try {
        await Share.share({ message });
      } catch {
        // dismissed
      }
    } finally {
      setSharing(false);
    }
  }, [sharing, trophySummary, totalTrophies]);

  function handleFabPress() {
    fabScale.value = withSequence(
      withSpring(0.88, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );
    handleShare();
  }

  const platPct =
    analytics.trophyInsights.platinumEligibleCount > 0
      ? Math.round(
          (analytics.trophyInsights.platinumCount /
            analytics.trophyInsights.platinumEligibleCount) *
            100,
        )
      : 0;

  return (
    <View className="flex-1 bg-black">
      {/* ── Hero header ──────────────────────────────────────────── */}
      <LinearGradient
        colors={[PS_DARK, "#001A3A", "#000000"]}
        locations={[0, 0.6, 1]}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <View className="items-center gap-y-3">
          {isLoadingProfile ? (
            <Skeleton width={84} height={84} borderRadius={42} />
          ) : (
            <View
              style={{
                borderWidth: 3,
                borderColor: PS_BLUE,
                borderRadius: 48,
                padding: 2,
              }}
            >
              <PsnAvatar
                uri={profile?.avatarUrl}
                onlineId={profile?.onlineId}
                size={80}
                isOnline={profile?.primaryOnlineStatus === "online"}
              />
            </View>
          )}

          {isLoadingProfile ? (
            <Skeleton width={140} height={18} borderRadius={8} />
          ) : (
            <View className="flex-row items-center gap-x-2">
              <Text
                className="text-white text-2xl font-black"
                style={{ letterSpacing: -0.4 }}
              >
                {profile?.onlineId ?? "—"}
              </Text>
              {profile?.isPsPlus && (
                <View
                  className="px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "#F9AA00" }}
                >
                  <Text className="text-black text-[9px] font-black tracking-wider">
                    PS PLUS
                  </Text>
                </View>
              )}
            </View>
          )}

          {!!profile?.aboutMe && (
            <Text
              className="text-gray-400 text-sm text-center"
              style={{ lineHeight: 18, paddingHorizontal: 16 }}
              numberOfLines={2}
            >
              {profile.aboutMe}
            </Text>
          )}

          {trophySummary ? (
            <View className="flex-row items-center gap-x-4 mt-1">
              <ProgressRing
                progress={trophySummary.progress}
                size={60}
                color={PS_BLUE}
                strokeWidth={5}
              >
                <View className="items-center">
                  <Text className="text-white font-black text-sm leading-none">
                    {trophySummary.trophyLevel}
                  </Text>
                  <Text className="text-gray-400 text-[9px]">LV</Text>
                </View>
              </ProgressRing>

              <View className="flex-1">
                <Text className="text-gray-400 text-xs mb-1.5">
                  Trophy Level · Tier {trophySummary.tier} ·{" "}
                  {trophySummary.progress}% to next
                </Text>
                <View className="flex-row gap-x-2">
                  <TrophyPill
                    color={PILL_COLORS.platinum}
                    label="PLT"
                    count={platinum}
                  />
                  <TrophyPill
                    color={PILL_COLORS.gold}
                    label="GLD"
                    count={gold}
                  />
                  <TrophyPill
                    color={PILL_COLORS.silver}
                    label="SLV"
                    count={silver}
                  />
                  <TrophyPill
                    color={PILL_COLORS.bronze}
                    label="BRZ"
                    count={bronze}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-x-4 mt-1">
              <Skeleton width={60} height={60} borderRadius={30} />
              <View className="flex-1 justify-center gap-y-2">
                <Skeleton width={160} height={10} borderRadius={5} />
                <Skeleton width={120} height={10} borderRadius={5} />
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          paddingTop: 16,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gaming Overview ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <View className="bg-zinc-900 rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">
              Gaming Overview
            </Text>

            {!isPlayHistoryLoaded ? (
              <View className="gap-y-3">
                <View className="flex-row gap-x-3">
                  <Skeleton width={100} height={48} borderRadius={10} />
                  <Skeleton width={100} height={48} borderRadius={10} />
                  <Skeleton width={100} height={48} borderRadius={10} />
                </View>
                <Skeleton width={200} height={14} borderRadius={7} />
              </View>
            ) : (
              <View>
                <View className="flex-row gap-x-2 mb-3">
                  <StatBox
                    value={String(analytics.overview.totalGames)}
                    label="Games"
                    icon="gamecontroller.fill"
                  />
                  <StatBox
                    value={`${formatHours(analytics.overview.totalPlayTimeMinutes)}h`}
                    label="Played"
                    icon="clock.fill"
                  />
                  <StatBox
                    value={formatAvgSession(
                      analytics.overview.averageSessionMinutes,
                    )}
                    label="Avg Session"
                    icon="timer"
                  />
                </View>

                {analytics.overview.mostPlayedGame && (
                  <View className="flex-row items-center gap-x-3 bg-zinc-800 rounded-xl p-3">
                    {analytics.overview.mostPlayedGame.imageUrl ? (
                      <Image
                        source={{
                          uri: analytics.overview.mostPlayedGame.imageUrl,
                        }}
                        style={styles.mostPlayedArt}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.mostPlayedArt,
                          { backgroundColor: "#1C2A3A" },
                        ]}
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-gray-400 text-[10px] font-semibold mb-0.5">
                        MOST PLAYED
                      </Text>
                      <Text
                        className="text-white font-bold text-sm"
                        numberOfLines={1}
                      >
                        {analytics.overview.mostPlayedGame.name}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {formatHours(
                          analytics.overview.mostPlayedGame.playTimeMinutes,
                        )}{" "}
                        hours
                      </Text>
                    </View>
                  </View>
                )}

                {analytics.overview.gamingSince ? (
                  <Text className="text-gray-500 text-xs text-center mt-3">
                    {formatGamingSince(analytics.overview.gamingSince)}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Trophy Insights ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <View className="bg-zinc-900 rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">
              Trophy Insights
            </Text>

            {!isLibraryLoaded ? (
              <View className="gap-y-3">
                <View className="flex-row gap-x-3">
                  <Skeleton width={100} height={56} borderRadius={10} />
                  <Skeleton width={100} height={56} borderRadius={10} />
                </View>
              </View>
            ) : (
              <View>
                <View className="flex-row gap-x-2 mb-3">
                  <View className="flex-1 items-center py-3 bg-zinc-800 rounded-xl">
                    <Text className="text-white font-black text-xl">
                      {analytics.trophyInsights.averageCompletion}%
                    </Text>
                    <Text className="text-gray-400 text-[10px] font-semibold">
                      Avg Completion
                    </Text>
                  </View>
                  <View className="flex-1 items-center py-3 bg-zinc-800 rounded-xl">
                    <View className="flex-row items-center gap-x-1">
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PILL_COLORS.platinum }}
                      />
                      <Text className="text-white font-black text-xl">
                        {analytics.trophyInsights.platinumCount}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-[10px] font-semibold">
                      Platinums ({platPct}%)
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-x-2 mb-4">
                  <TrophyStatPill
                    value={analytics.trophyInsights.completionistCount}
                    label="100% Complete"
                    color={PILL_COLORS.gold}
                  />
                  <TrophyStatPill
                    value={analytics.trophyInsights.abandonedCount}
                    label="Abandoned"
                    color="#FF453A"
                  />
                </View>

                {/* Combined Grade Breakdown from old Profile Screen */}
                <View className="flex-row gap-x-2">
                  {[
                    {
                      grade: "platinum" as const,
                      label: "PLT",
                      count: platinum,
                    },
                    { grade: "gold" as const, label: "GLD", count: gold },
                    { grade: "silver" as const, label: "SLV", count: silver },
                    { grade: "bronze" as const, label: "BRZ", count: bronze },
                  ].map(({ grade, label, count }) => (
                    <View
                      key={grade}
                      className="flex-1 items-center py-2 rounded-xl"
                      style={{ backgroundColor: `${PILL_COLORS[grade]}10` }}
                    >
                      <Text className="text-white font-black text-sm">
                        {count}
                      </Text>
                      <Text
                        className="text-[8px] font-bold"
                        style={{ color: PILL_COLORS[grade] }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Recently Played ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify().damping(18)}>
          <Text className="text-white font-bold text-base mb-3">
            Recently Played
          </Text>
          {continuePlaying.isLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width={110} height={140} borderRadius={12} />
              ))}
            </ScrollView>
          ) : recentGames.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {recentGames.map((game) => (
                <Pressable
                  key={game.npCommunicationId}
                  onPress={() => handleOpenGame(game)}
                  className="active:opacity-75"
                  style={{ width: 110 }}
                >
                  <View
                    className="rounded-xl overflow-hidden mb-2"
                    style={{ height: 110 }}
                  >
                    {game.imageUrl ? (
                      <Image
                        source={{ uri: game.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        className="flex-1 items-center justify-center"
                        style={{ backgroundColor: "#1C2A3A" }}
                      >
                        <Text className="text-white text-2xl font-black">
                          {game.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: "rgba(0,0,0,0.4)",
                      }}
                    >
                      <View
                        style={{
                          width: `${game.progress}%`,
                          height: "100%",
                          backgroundColor: PS_BLUE,
                        }}
                      />
                    </View>
                  </View>
                  <Text
                    className="text-white text-xs font-semibold mb-1"
                    numberOfLines={2}
                    style={{ lineHeight: 14 }}
                  >
                    {game.name}
                  </Text>
                  <View className="flex-row items-center gap-x-1">
                    <PlatformBadge platform={game.platform} />
                    <Text className="text-gray-500 text-[10px]">
                      {game.progress}%
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </Animated.View>

        {/* ── Almost There (Incentive) ─────────────────────────── */}
        {isLibraryLoaded &&
          analytics.trophyInsights.almostPlatinum.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(240).springify().damping(18)}
            >
              <View className="bg-zinc-900 rounded-2xl p-4">
                <Text className="text-white font-bold text-base mb-3">
                  Almost There
                </Text>
                <View className="gap-y-2">
                  {analytics.trophyInsights.almostPlatinum.map((game) => {
                    const totalDefined =
                      game.definedTrophies.bronze +
                      game.definedTrophies.silver +
                      game.definedTrophies.gold +
                      game.definedTrophies.platinum;
                    const totalEarned =
                      game.earnedTrophies.bronze +
                      game.earnedTrophies.silver +
                      game.earnedTrophies.gold +
                      game.earnedTrophies.platinum;
                    const remaining = totalDefined - totalEarned;

                    return (
                      <View
                        key={game.npCommunicationId}
                        className="flex-row items-center gap-x-3 bg-zinc-800 rounded-xl p-3"
                      >
                        {game.imageUrl ? (
                          <Image
                            source={{ uri: game.imageUrl }}
                            style={styles.almostThereArt}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.almostThereArt,
                              { backgroundColor: "#1C2A3A" },
                            ]}
                          />
                        )}
                        <View className="flex-1">
                          <Text
                            className="text-white font-semibold text-sm"
                            numberOfLines={1}
                          >
                            {game.name}
                          </Text>
                          <Text className="text-gray-400 text-xs">
                            {remaining}{" "}
                            {remaining === 1 ? "trophy" : "trophies"} to go
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text
                            className="font-black text-sm"
                            style={{ color: PS_BLUE }}
                          >
                            {game.progress}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

        {/* ── Platform Breakdown ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(18)}>
          <View className="bg-zinc-900 rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">
              Platform Breakdown
            </Text>

            {!isLibraryLoaded ? (
              <Skeleton width={280} height={60} borderRadius={10} />
            ) : (
              <View className="gap-y-3">
                {analytics.platformBreakdown.map((stat) => {
                  const maxCount = Math.max(
                    ...analytics.platformBreakdown.map((p) => p.gameCount),
                  );
                  const barWidth =
                    maxCount > 0
                      ? Math.max((stat.gameCount / maxCount) * 100, 8)
                      : 0;
                  const color =
                    PLATFORM_COLORS[stat.platform] ?? PLATFORM_COLORS.unknown;

                  return (
                    <View key={stat.platform} className="gap-y-1">
                      <View className="flex-row items-center justify-between">
                        <PlatformBadge platform={stat.platform} />
                        <Text className="text-gray-400 text-xs">
                          {stat.gameCount}{" "}
                          {stat.gameCount === 1 ? "game" : "games"}
                          {stat.playTimeMinutes > 0
                            ? ` · ${formatHours(stat.playTimeMinutes)}h`
                            : ""}
                        </Text>
                      </View>
                      <View
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: color,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Top Played Games ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(330).springify().damping(18)}>
          <View className="bg-zinc-900 rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">
              Top Played (All Time)
            </Text>

            {!isPlayHistoryLoaded ? (
              <View className="gap-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width={280} height={48} borderRadius={10} />
                ))}
              </View>
            ) : analytics.topPlayed.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                No data available
              </Text>
            ) : (
              <View className="gap-y-2">
                {analytics.topPlayed.map((game: any, index: number) => (
                  <View
                    key={`${game.name}-${index}`}
                    className="flex-row items-center gap-x-3 bg-zinc-800 rounded-xl p-3"
                  >
                    <Text
                      className="font-black text-lg w-6 text-center"
                      style={{ color: index === 0 ? PILL_COLORS.gold : "#666" }}
                    >
                      {index + 1}
                    </Text>
                    {game.imageUrl ? (
                      <Image
                        source={{ uri: game.imageUrl }}
                        style={styles.topPlayedArt}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.topPlayedArt,
                          { backgroundColor: "#1C2A3A" },
                        ]}
                      />
                    )}
                    <View className="flex-1">
                      <Text
                        className="text-white font-semibold text-sm"
                        numberOfLines={1}
                      >
                        {game.name}
                      </Text>
                      <View className="flex-row items-center gap-x-1.5 mt-0.5">
                        <PlatformBadge platform={game.platform} />
                      </View>
                    </View>
                    <Text className="text-gray-400 text-xs font-semibold">
                      {formatHours(game.playTimeMinutes)}h
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Milestones ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(360).springify().damping(18)}>
          <View className="bg-zinc-900 rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold text-base">Milestones</Text>
              {isLibraryLoaded && (
                <Text className="text-gray-500 text-xs font-semibold">
                  {analytics.milestones.filter((m) => m.earned).length}/
                  {analytics.milestones.length} earned
                </Text>
              )}
            </View>

            {!isLibraryLoaded ? (
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width={100} height={80} borderRadius={12} />
                ))}
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {analytics.milestones.map((milestone) => (
                  <MilestoneBadge key={milestone.id} milestone={milestone} />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Sign out ──────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(420).springify().damping(18)}
          className="mt-6"
        >
          <Pressable
            onPress={signOut}
            className="bg-zinc-900 rounded-2xl py-4 flex-row items-center justify-center gap-x-2.5 active:opacity-70"
          >
            <Text
              className="text-base"
              style={{ color: "#FF453A", fontWeight: "600" }}
            >
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* ── Share FAB ─────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.fab, { bottom: insets.bottom + 16 }, fabStyle]}
      >
        <Pressable
          onPress={handleFabPress}
          disabled={sharing || !trophySummary}
          className="active:opacity-85"
          style={styles.fabInner}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="square.and.arrow.up" size={22} color="#fff" />
          )}
        </Pressable>
      </Animated.View>

      {/* ── Off-screen share card ─────────────────────────────────── */}
      <View style={styles.offScreen} pointerEvents="none">
        <ProfileShareCard
          ref={shareCardRef}
          onlineId={profile?.onlineId ?? ""}
          avatarUrl={profile?.avatarUrl ?? ""}
          isPsPlus={profile?.isPsPlus ?? false}
          trophyLevel={trophySummary?.trophyLevel ?? 0}
          progress={trophySummary?.progress ?? 0}
          tier={trophySummary?.tier ?? 1}
          platinum={platinum}
          gold={gold}
          silver={silver}
          bronze={bronze}
        />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PS_BLUE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offScreen: {
    position: "absolute",
    top: -1000,
    left: 0,
    opacity: 0,
  },
  mostPlayedArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  almostThereArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  topPlayedArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
});
