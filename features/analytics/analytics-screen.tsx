import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton } from "@/components/skeleton-placeholder";
import { IconSymbol } from "@/components/ui/icon-symbol";

import { PlatformBadge } from "@/components/platform-badge";

import type {
  AnalyticsData,
  Milestone,
  OverviewStats,
  PlatformStats,
  TrophyInsights,
} from "./analytics-types";
import { useAnalytics } from "./use-analytics";

// ─── Constants ──────────────────────────────────────────────────────────────

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

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

// ─── Section A: Gaming Overview ─────────────────────────────────────────────

function GamingOverviewCard({
  overview,
  isLoaded,
}: {
  overview: OverviewStats;
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={160} height={16} borderRadius={8} />
        <View className="flex-row gap-x-3">
          <Skeleton width={100} height={48} borderRadius={10} />
          <Skeleton width={100} height={48} borderRadius={10} />
          <Skeleton width={100} height={48} borderRadius={10} />
        </View>
        <Skeleton width={200} height={14} borderRadius={7} />
      </View>
    );
  }

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-white font-bold text-base mb-3">
        Gaming Overview
      </Text>

      {/* Stat grid */}
      <View className="flex-row gap-x-2 mb-3">
        <StatBox
          value={String(overview.totalGames)}
          label="Games"
          icon="gamecontroller.fill"
        />
        <StatBox
          value={`${formatHours(overview.totalPlayTimeMinutes)}h`}
          label="Played"
          icon="clock.fill"
        />
        <StatBox
          value={formatAvgSession(overview.averageSessionMinutes)}
          label="Avg Session"
          icon="timer"
        />
      </View>

      {/* Most played game */}
      {overview.mostPlayedGame && (
        <View className="flex-row items-center gap-x-3 bg-zinc-800 rounded-xl p-3">
          {overview.mostPlayedGame.imageUrl ? (
            <Image
              source={{ uri: overview.mostPlayedGame.imageUrl }}
              style={styles.mostPlayedArt}
              contentFit="cover"
            />
          ) : (
            <View
              style={[styles.mostPlayedArt, { backgroundColor: "#1C2A3A" }]}
            />
          )}
          <View className="flex-1">
            <Text className="text-gray-400 text-[10px] font-semibold mb-0.5">
              MOST PLAYED
            </Text>
            <Text className="text-white font-bold text-sm" numberOfLines={1}>
              {overview.mostPlayedGame.name}
            </Text>
            <Text className="text-gray-400 text-xs">
              {formatHours(overview.mostPlayedGame.playTimeMinutes)} hours
            </Text>
          </View>
        </View>
      )}

      {/* Gaming since */}
      {overview.gamingSince ? (
        <Text className="text-gray-500 text-xs text-center mt-3">
          {formatGamingSince(overview.gamingSince)}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Section B: Trophy Insights ──────────────────────────────────────────────

const TROPHY_COLORS = {
  platinum: "#B468F0",
  gold: "#E8B420",
  silver: "#9BA7AF",
  bronze: "#C47A3A",
} as const;

function TrophyInsightsCard({
  insights,
  isLoaded,
}: {
  insights: TrophyInsights;
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={140} height={16} borderRadius={8} />
        <View className="flex-row gap-x-3">
          <Skeleton width={100} height={56} borderRadius={10} />
          <Skeleton width={100} height={56} borderRadius={10} />
        </View>
      </View>
    );
  }

  const platPct =
    insights.platinumEligibleCount > 0
      ? Math.round(
          (insights.platinumCount / insights.platinumEligibleCount) * 100,
        )
      : 0;

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-white font-bold text-base mb-3">
        Trophy Insights
      </Text>

      {/* Main stats row */}
      <View className="flex-row gap-x-2 mb-3">
        <View className="flex-1 items-center py-3 bg-zinc-800 rounded-xl">
          <Text className="text-white font-black text-xl">
            {insights.averageCompletion}%
          </Text>
          <Text className="text-gray-400 text-[10px] font-semibold">
            Avg Completion
          </Text>
        </View>
        <View className="flex-1 items-center py-3 bg-zinc-800 rounded-xl">
          <View className="flex-row items-center gap-x-1">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TROPHY_COLORS.platinum }}
            />
            <Text className="text-white font-black text-xl">
              {insights.platinumCount}
            </Text>
          </View>
          <Text className="text-gray-400 text-[10px] font-semibold">
            Platinums ({platPct}%)
          </Text>
        </View>
      </View>

      {/* Secondary stats */}
      <View className="flex-row gap-x-2">
        <TrophyStatPill
          value={insights.completionistCount}
          label="100% Complete"
          color={TROPHY_COLORS.gold}
        />
        <TrophyStatPill
          value={insights.abandonedCount}
          label="Abandoned"
          color="#FF453A"
        />
      </View>
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

// ─── Section C: Almost There ─────────────────────────────────────────────────

function AlmostThereCard({
  games,
  isLoaded,
}: {
  games: TrophyInsights["almostPlatinum"];
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={120} height={16} borderRadius={8} />
        <Skeleton width={280} height={52} borderRadius={10} />
      </View>
    );
  }

  if (games.length === 0) return null;

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-white font-bold text-base mb-3">Almost There</Text>

      <View className="gap-y-2">
        {games.map((game: any) => {
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
                  {remaining} {remaining === 1 ? "trophy" : "trophies"} to go
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-black text-sm" style={{ color: PS_BLUE }}>
                  {game.progress}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Section D: Platform Breakdown ──────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  ps5: "#0070D1",
  ps4: "#003087",
  ps3: "#8E44AD",
  psvita: "#E67E22",
  unknown: "#555",
};

function PlatformBreakdownCard({
  breakdown,
  isLoaded,
}: {
  breakdown: PlatformStats[];
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={160} height={16} borderRadius={8} />
        <Skeleton width={280} height={60} borderRadius={10} />
      </View>
    );
  }

  if (breakdown.length === 0) return null;

  const maxCount = Math.max(...breakdown.map((p) => p.gameCount));

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-white font-bold text-base mb-3">
        Platform Breakdown
      </Text>

      <View className="gap-y-3">
        {breakdown.map((stat) => {
          const barWidth =
            maxCount > 0 ? Math.max((stat.gameCount / maxCount) * 100, 8) : 0;
          const color =
            PLATFORM_COLORS[stat.platform] ?? PLATFORM_COLORS.unknown;

          return (
            <View key={stat.platform} className="gap-y-1">
              <View className="flex-row items-center justify-between">
                <PlatformBadge platform={stat.platform} />
                <Text className="text-gray-400 text-xs">
                  {stat.gameCount} {stat.gameCount === 1 ? "game" : "games"}
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
    </View>
  );
}

// ─── Section E: Top Played Games ────────────────────────────────────────────

function TopPlayedCard({
  games,
  isLoaded,
}: {
  games: AnalyticsData["topPlayed"];
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={140} height={16} borderRadius={8} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={280} height={48} borderRadius={10} />
        ))}
      </View>
    );
  }

  if (games.length === 0) return null;

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-white font-bold text-base mb-3">
        Top Played Games
      </Text>

      <View className="gap-y-2">
        {games.map((game: any, index: number) => (
          <View
            key={`${game.name}-${index}`}
            className="flex-row items-center gap-x-3 bg-zinc-800 rounded-xl p-3"
          >
            <Text
              className="font-black text-lg w-6 text-center"
              style={{ color: index === 0 ? TROPHY_COLORS.gold : "#666" }}
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
                style={[styles.topPlayedArt, { backgroundColor: "#1C2A3A" }]}
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
    </View>
  );
}

// ─── Section F: Milestones ──────────────────────────────────────────────────

function MilestonesCard({
  milestones,
  isLoaded,
}: {
  milestones: Milestone[];
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-4 gap-y-3">
        <Skeleton width={120} height={16} borderRadius={8} />
        <View className="flex-row flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={100} height={80} borderRadius={12} />
          ))}
        </View>
      </View>
    );
  }

  const earnedCount = milestones.filter((m) => m.earned).length;

  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-bold text-base">Milestones</Text>
        <Text className="text-gray-500 text-xs font-semibold">
          {earnedCount}/{milestones.length} earned
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {milestones.map((milestone) => (
          <MilestoneBadge key={milestone.id} milestone={milestone} />
        ))}
      </View>
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

// ─── Shared ─────────────────────────────────────────────────────────────────

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

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { analytics, isLibraryLoaded, isPlayHistoryLoaded } = useAnalytics();

  return (
    <View className="flex-1 bg-black">
      {/* ── Header ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[PS_DARK, "#001A3A", "#000000"]}
        locations={[0, 0.6, 1]}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="active:opacity-70"
          >
            <IconSymbol name="chevron.left" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white text-xl font-black"
              style={{ letterSpacing: -0.3 }}
            >
              Gaming Insights
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              Your PlayStation stats at a glance
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Sections ───────────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 16,
          paddingTop: 16,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section A: Gaming Overview */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <GamingOverviewCard
            overview={analytics.overview}
            isLoaded={isPlayHistoryLoaded}
          />
        </Animated.View>

        {/* Section B: Trophy Insights */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <TrophyInsightsCard
            insights={analytics.trophyInsights}
            isLoaded={isLibraryLoaded}
          />
        </Animated.View>

        {/* Section C: Almost There */}
        <Animated.View entering={FadeInDown.delay(180).springify().damping(18)}>
          <AlmostThereCard
            games={analytics.trophyInsights.almostPlatinum}
            isLoaded={isLibraryLoaded}
          />
        </Animated.View>

        {/* Section D: Platform Breakdown */}
        <Animated.View entering={FadeInDown.delay(240).springify().damping(18)}>
          <PlatformBreakdownCard
            breakdown={analytics.platformBreakdown}
            isLoaded={isLibraryLoaded}
          />
        </Animated.View>

        {/* Section E: Top Played Games */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(18)}>
          <TopPlayedCard
            games={analytics.topPlayed}
            isLoaded={isPlayHistoryLoaded}
          />
        </Animated.View>

        {/* Section F: Milestones */}
        <Animated.View entering={FadeInDown.delay(360).springify().damping(18)}>
          <MilestonesCard
            milestones={analytics.milestones}
            isLoaded={isLibraryLoaded}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
