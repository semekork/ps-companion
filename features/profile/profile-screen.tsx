import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

import { ProgressRing } from "@/components/progress-ring";
import { PsnAvatar } from "@/components/psn-avatar";
import { Skeleton } from "@/components/skeleton-placeholder";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { useUser } from "@/context/user-context";

// ─── Constants ───────────────────────────────────────────────────────────────

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

// Match dashboard trophy pill colours exactly
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
        {/* Background gradient */}
        <LinearGradient
          colors={[PS_DARK, "#001A3A", "#000000"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle grid overlay */}
        <View style={cardStyles.gridOverlay} />

        {/* PS branding */}
        <View style={cardStyles.brand}>
          <LinearGradient
            colors={[PS_BLUE, PS_DARK]}
            style={cardStyles.brandBox}
          >
            <Text style={cardStyles.brandText}>PS</Text>
          </LinearGradient>
          <Text style={cardStyles.brandLabel}>Companion</Text>
        </View>

        {/* Avatar */}
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
          {/* Progress ring around avatar */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* SVG-free ring drawn with border */}
          </View>
        </View>

        {/* Online ID */}
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.onlineId}>{onlineId}</Text>
          {isPsPlus && (
            <View style={cardStyles.plusBadge}>
              <Text style={cardStyles.plusText}>PS PLUS</Text>
            </View>
          )}
        </View>

        {/* Trophy level */}
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

        {/* Trophy counts */}
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

        {/* Tagline */}
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
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { profile, trophySummary, isLoadingProfile } = useUser();

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
        {/* Top bar */}
        <View className="flex-row items-center justify-center mb-5">
          <Text className="text-white text-base font-bold">Profile</Text>
        </View>

        {/* Avatar — same PsnAvatar used everywhere, larger size */}
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

          {/* Online ID */}
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

          {/* About me */}
          {!!profile?.aboutMe && (
            <Text
              className="text-gray-400 text-sm text-center"
              style={{ lineHeight: 18, paddingHorizontal: 16 }}
              numberOfLines={2}
            >
              {profile.aboutMe}
            </Text>
          )}

          {/* Trophy level — inline strip matching dashboard header */}
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
        {/* ── Trophy breakdown card ─────────────────────────────── */}
        {trophySummary && (
          <Animated.View
            entering={FadeInDown.delay(60).springify().damping(18)}
            className="bg-zinc-900 rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold text-base">
                Trophies Earned
              </Text>
              <Text className="text-gray-500 text-sm font-semibold">
                {totalTrophies} total
              </Text>
            </View>

            <View className="flex-row gap-x-2 mb-4">
              {[
                { grade: "platinum" as const, label: "PLT", count: platinum },
                { grade: "gold" as const, label: "GLD", count: gold },
                { grade: "silver" as const, label: "SLV", count: silver },
                { grade: "bronze" as const, label: "BRZ", count: bronze },
              ].map(({ grade, label, count }) => (
                <View
                  key={grade}
                  className="flex-1 items-center py-3 rounded-2xl"
                  style={{ backgroundColor: `${PILL_COLORS[grade]}18` }}
                >
                  <View
                    className="w-2 h-2 rounded-full mb-1.5"
                    style={{ backgroundColor: PILL_COLORS[grade] }}
                  />
                  <Text className="text-white font-black text-xl">{count}</Text>
                  <Text
                    className="text-[9px] font-bold mt-0.5"
                    style={{ color: PILL_COLORS[grade] }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Level progress bar */}
            <View className="flex-row items-center gap-x-3">
              <View
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${trophySummary.progress}%`,
                    backgroundColor: PS_BLUE,
                  }}
                />
              </View>
              <Text
                className="text-gray-400 text-xs font-semibold"
                style={{ width: 40, textAlign: "right" }}
              >
                {trophySummary.progress}%
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Sign out ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(18)}>
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

// ─── Styles (only for things className can't do) ──────────────────────────────

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PS_BLUE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PS_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  offScreen: {
    position: "absolute",
    top: -1000,
    left: 0,
    opacity: 0,
  },
});
