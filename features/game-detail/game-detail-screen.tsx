import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
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
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { GameTrophy } from "@/types/psn";
import { useGameDetail } from "./use-game-detail";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TROPHY_COLORS = {
  platinum: "#B0C4DE",
  gold: "#D4AF37",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
  hidden: "#555",
};

const TROPHY_LABELS = {
  platinum: "P",
  gold: "G",
  silver: "S",
  bronze: "B",
  hidden: "?",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton trophy row (shown while loading — matches real row height)
// ---------------------------------------------------------------------------

function SkeletonTrophyRow() {
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
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.trophyRow,
        pulseStyle,
        {
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
          alignItems: "center",
        },
      ]}
    >
      {/* Type badge placeholder */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}
      />
      {/* Icon placeholder */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      {/* Text placeholders */}
      <View style={{ flex: 1, gap: 8 }}>
        <View
          style={{
            height: 13,
            width: "68%",
            backgroundColor: "rgba(255,255,255,0.10)",
            borderRadius: 4,
          }}
        />
        <View
          style={{
            height: 11,
            width: "90%",
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: 4,
          }}
        />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Trophy row
// ---------------------------------------------------------------------------

function TrophyRow({
  trophy,
  textColor,
  subtleColor,
}: {
  trophy: GameTrophy;
  textColor: string;
  subtleColor: string;
}) {
  const color = TROPHY_COLORS[trophy.type] ?? TROPHY_COLORS.bronze;
  const label = TROPHY_LABELS[trophy.type] ?? "B";
  const isHidden = trophy.type === "hidden";

  return (
    <View style={[styles.trophyRow, !trophy.earned && styles.trophyRowDimmed]}>
      {/* Type badge */}
      <View style={[styles.trophyBadge, { backgroundColor: color }]}>
        <Text style={styles.trophyBadgeLabel}>{label}</Text>
      </View>

      {/* Icon */}
      {trophy.iconUrl ? (
        <Image
          source={{ uri: trophy.iconUrl }}
          style={styles.trophyIcon}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.trophyIcon,
            {
              backgroundColor: "#2C2C2E",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Text style={{ color: "#555", fontSize: 18 }}>
            {isHidden ? "🔒" : "🏆"}
          </Text>
        </View>
      )}

      {/* Text */}
      <View style={styles.trophyText}>
        <Text
          style={[
            styles.trophyName,
            { color: isHidden ? subtleColor : textColor },
          ]}
          numberOfLines={2}
        >
          {trophy.name || "Unknown Trophy"}
        </Text>
        {!isHidden && (
          <Text
            style={[styles.trophyDetail, { color: subtleColor }]}
            numberOfLines={2}
          >
            {trophy.detail}
          </Text>
        )}
        {trophy.earned && trophy.earnedAt && (
          <Text style={[styles.earnedDate, { color: TROPHY_COLORS.gold }]}>
            {formatDate(trophy.earnedAt)}
          </Text>
        )}
      </View>

      {/* Earned indicator */}
      {trophy.earned && <View style={styles.earnedDot} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Share card (rendered off-screen, captured as PNG)
// ---------------------------------------------------------------------------

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

const ShareCard = React.forwardRef<
  View,
  {
    name: string;
    imageUrl: string;
    platform: string;
    progress: number;
    earnedTotal: number;
    total: number;
    earnedCounts: Record<string, number>;
  }
>(
  (
    { name, imageUrl, platform, progress, earnedTotal, total, earnedCounts },
    ref,
  ) => {
    return (
      <View ref={ref} style={shareCardStyles.card} collapsable={false}>
        {/* Background cover */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a1a" }]}
          />
        )}

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.88)"]}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* PS branding top-left */}
        <View style={shareCardStyles.brand}>
          <LinearGradient
            colors={[PS_BLUE, PS_DARK]}
            style={shareCardStyles.brandBox}
          >
            <Text style={shareCardStyles.brandText}>PS</Text>
          </LinearGradient>
          <Text style={shareCardStyles.brandLabel}>Companion</Text>
        </View>

        {/* Bottom content */}
        <View style={shareCardStyles.bottom}>
          <Text style={shareCardStyles.gameName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={shareCardStyles.platform}>{platform}</Text>

          {/* Progress bar */}
          <View style={shareCardStyles.progressRow}>
            <View style={shareCardStyles.progressTrack}>
              <View
                style={[
                  shareCardStyles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={shareCardStyles.progressLabel}>{progress}%</Text>
          </View>

          {/* Tagline */}
          <Text style={shareCardStyles.tagline}>Tracked with PS Companion</Text>

          {/* Trophy counts */}
          <View style={shareCardStyles.trophyRow}>
            {(["platinum", "gold", "silver", "bronze"] as const).map((g) => (
              <View key={g} style={shareCardStyles.trophyPill}>
                <View
                  style={[
                    shareCardStyles.trophyDot,
                    { backgroundColor: TROPHY_COLORS[g] },
                  ]}
                />
                <Text style={shareCardStyles.trophyCount}>
                  {earnedCounts[g] ?? 0}
                </Text>
                <Text
                  style={[
                    shareCardStyles.trophyGrade,
                    { color: TROPHY_COLORS[g] },
                  ]}
                >
                  {g.slice(0, 3).toUpperCase()}
                </Text>
              </View>
            ))}
            <View style={[shareCardStyles.trophyPill, { marginLeft: 8 }]}>
              <Text style={shareCardStyles.trophyTotal}>
                {earnedTotal}
                <Text style={{ opacity: 0.5 }}>/{total}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

ShareCard.displayName = "ShareCard";

const shareCardStyles = StyleSheet.create({
  card: {
    width: 375,
    height: 300,
    overflow: "hidden",
    backgroundColor: "#0a0a1a",
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
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  brandLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 6,
  },
  gameName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  platform: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: PS_BLUE },
  progressLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    width: 30,
    textAlign: "right",
  },
  trophyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  trophyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trophyDot: { width: 7, height: 7, borderRadius: 3.5 },
  trophyCount: { color: "#fff", fontSize: 12, fontWeight: "700" },
  trophyGrade: { fontSize: 10, fontWeight: "600" },
  trophyTotal: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

// ---------------------------------------------------------------------------
// Hero strip
// ---------------------------------------------------------------------------

function HeroHeader({
  name,
  imageUrl,
  platform,
  progress,
  earnedTotal,
  total,
  earnedCounts,
  titleId,
  topInset,
  tint,
  subtle,
  bg,
  onBack,
}: {
  name: string;
  imageUrl: string;
  platform: string;
  progress: number;
  earnedTotal: number;
  total: number;
  earnedCounts: Record<string, number>;
  titleId: string;
  topInset: number;
  tint: string;
  subtle: string;
  bg: string;
  onBack: () => void;
}) {
  return (
    <View>
      {/* Banner — sharedTransitionTag matches the library card cover */}
      <View style={styles.banner}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.bannerImage, { backgroundColor: "#1C1C1E" }]} />
        )}
        <LinearGradient
          colors={["transparent", bg]}
          style={StyleSheet.absoluteFill}
          locations={[0.4, 1]}
        />

        {/* Back button — top offset absorbs the status-bar safe area */}
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            { top: topInset + 12 },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      </View>

      {/* Info block below banner */}
      <Animated.View
        entering={FadeInDown.delay(80).springify().damping(18)}
        style={[styles.heroInfo, { backgroundColor: bg }]}
      >
        <Text style={styles.heroName}>{name}</Text>
        <Text style={[styles.heroPlatform, { color: subtle }]}>{platform}</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: "rgba(255,255,255,0.1)" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: tint },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: subtle }]}>
            {progress}%
          </Text>
        </View>

        {/* Trophy counts */}
        <View style={styles.statsRow}>
          {(["platinum", "gold", "silver", "bronze"] as const).map((grade) => (
            <View key={grade} style={styles.statCell}>
              <View
                style={[
                  styles.statDot,
                  { backgroundColor: TROPHY_COLORS[grade] },
                ]}
              />
              <Text style={[styles.statCount, { color: "#ECEDEE" }]}>
                {earnedCounts[grade] ?? 0}
              </Text>
            </View>
          ))}
          <View style={styles.statCell}>
            <Text style={[styles.statTotal, { color: subtle }]}>
              {earnedTotal}/{total}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function GameDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;
  const tint = useThemeColor({}, "tint") as string;
  const subtle = useThemeColor(
    { light: "#8E8E93", dark: "#636366" },
    "icon",
  ) as string;

  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const {
    trophies,
    meta,
    titleId,
    isLoading,
    isError,
    refetch,
    earnedCounts,
    earnedTotal,
    total,
  } = useGameDetail();

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    const message = `I earned ${earnedTotal}/${total} trophies in ${meta.name} (${meta.progress}%) on PlayStation! 🏆 via PS Companion`;
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
          dialogTitle: "Share your trophies",
        });
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message }).catch(() => {});
    } finally {
      setSharing(false);
    }
  }, [sharing, earnedTotal, total, meta.name, meta.progress]);

  const renderTrophy = useCallback(
    ({ item }: { item: GameTrophy }) => (
      <TrophyRow trophy={item} textColor={text} subtleColor={subtle} />
    ),
    [text, subtle],
  );

  const ListHeader = useMemo(
    () => (
      <HeroHeader
        name={meta.name}
        imageUrl={meta.imageUrl}
        platform={meta.platform}
        progress={meta.progress}
        earnedTotal={earnedTotal}
        total={total}
        earnedCounts={earnedCounts}
        titleId={titleId}
        topInset={insets.top}
        tint={tint}
        subtle={subtle}
        bg={bg}
        onBack={() => router.back()}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      meta.name,
      meta.imageUrl,
      meta.platform,
      meta.progress,
      earnedTotal,
      total,
      earnedCounts,
      titleId,
      insets.top,
      tint,
      subtle,
      bg,
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Off-screen share card — rendered but invisible, captured by view-shot */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          name={meta.name}
          imageUrl={meta.imageUrl}
          platform={meta.platform}
          progress={meta.progress}
          earnedTotal={earnedTotal}
          total={total}
          earnedCounts={earnedCounts}
        />
      </View>

      <FlatList<GameTrophy>
        style={{ backgroundColor: bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        data={trophies}
        keyExtractor={(t) => String(t.trophyId)}
        renderItem={renderTrophy}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? (
            <>
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonTrophyRow key={i} />
              ))}
            </>
          ) : isError ? (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: text }]}>
                Failed to load trophies.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={[styles.retryBtn, { borderColor: tint }]}
              >
                <Text style={[styles.retryText, { color: tint }]}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: subtle }]}>
                No trophies found.
              </Text>
            </View>
          )
        }
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        refreshing={false}
        onRefresh={refetch}
      />

      {/* FAB — share button */}
      <Animated.View
        style={[
          styles.fab,
          fabStyle,
          { bottom: insets.bottom + 16, backgroundColor: PS_BLUE },
        ]}
      >
        <Pressable
          onPress={handleShare}
          onPressIn={() => {
            fabScale.value = withSpring(0.88, { damping: 12, stiffness: 220 });
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, { damping: 10, stiffness: 180 });
          }}
          disabled={sharing}
          hitSlop={8}
          style={styles.fabInner}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="square.and.arrow.up" size={22} color="#fff" />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  banner: {
    height: 280,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 280,
  },
  backBtn: {
    position: "absolute",
    top: 12, // overridden at runtime with topInset
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: "#fff",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "300",
    marginTop: -2,
  },
  heroInfo: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  heroName: {
    color: "#ECEDEE",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heroPlatform: {
    fontSize: 13,
    fontWeight: "500",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    width: 36,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingTop: 4,
  },
  statCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  statTotal: {
    fontSize: 13,
    marginLeft: 4,
  },
  // Trophy rows
  trophyRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 10,
  },
  trophyRowDimmed: {
    opacity: 0.45,
  },
  trophyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyBadgeLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  trophyIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  trophyText: {
    flex: 1,
    gap: 2,
  },
  trophyName: {
    fontSize: 14,
    fontWeight: "600",
  },
  trophyDetail: {
    fontSize: 12,
  },
  earnedDate: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  earnedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
  },
  // Utility
  centered: {
    paddingTop: 60,
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 16, fontWeight: "500" },
  emptyText: { fontSize: 15 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  retryText: { fontSize: 15, fontWeight: "600" },
  // Share FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  // Off-screen share card container
  offscreen: { position: "absolute", left: -9999, top: 0 },
});
