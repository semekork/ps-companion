import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";
import type { LibraryGame, Platform as PsnPlatform } from "@/types/psn";
import { type SortOption, useLibrary } from "./use-library";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "name", label: "A–Z" },
  { key: "progress", label: "Progress" },
];

const TROPHY_COLORS = {
  platinum: "#B0C4DE",
  gold: "#D4AF37",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
} as const;

// ---------------------------------------------------------------------------
// Platform badge
// ---------------------------------------------------------------------------

function PlatformBadge({ label }: { label: string }) {
  return (
    <View style={styles.platformBadge}>
      <Text style={styles.platformBadgeText}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  active,
  onPress,
  tint,
  subtle,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tint: string;
  subtle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? tint : "rgba(255,255,255,0.12)" },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? tint : subtle }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Sort pill
// ---------------------------------------------------------------------------

function SortPill({
  label,
  active,
  onPress,
  tint,
  subtle,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tint: string;
  subtle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.sortPill,
        active
          ? { backgroundColor: tint }
          : { backgroundColor: "rgba(255,255,255,0.07)" },
      ]}
    >
      <Text style={[styles.sortPillText, { color: active ? "#fff" : subtle }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Filter icon (three decreasing horizontal bars)
// ---------------------------------------------------------------------------

function FilterIcon({ color }: { color: string }) {
  return (
    <View style={{ gap: 3.5, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 14,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: 10,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: 6,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Filter bottom sheet
// ---------------------------------------------------------------------------

const SHEET_SPRING = { damping: 22, stiffness: 280 } as const;

function FilterSheet({
  visible,
  onClose,
  platforms,
  platformFilter,
  togglePlatform,
  sortBy,
  setSortBy,
  tint,
  subtle,
  text,
  bg,
  inputBg,
}: {
  visible: boolean;
  onClose: () => void;
  platforms: string[];
  platformFilter: string;
  togglePlatform: (p: PsnPlatform | "all") => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  tint: string;
  subtle: string;
  text: string;
  bg: string;
  inputBg: string;
}) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(false);
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  // Mount when opened
  React.useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Drive animation whenever mounted/visible changes
  React.useEffect(() => {
    if (!mounted) return;
    if (visible) {
      translateY.value = withSpring(0, SHEET_SPRING);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withSpring(600, SHEET_SPRING, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.55)" },
          backdropStyle,
        ]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          sheetStyle,
          { backgroundColor: bg, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Title row */}
        <View style={styles.sheetTitleRow}>
          <Text style={[styles.sheetTitle, { color: text }]}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.sheetDoneBtn, { color: tint }]}>Done</Text>
          </Pressable>
        </View>

        {/* Sort section */}
        <Text style={[styles.sheetSection, { color: subtle }]}>SORT BY</Text>
        <View style={styles.sheetChipRow}>
          {SORT_OPTIONS.map(({ key, label }) => (
            <SortPill
              key={key}
              label={label}
              active={sortBy === key}
              onPress={() => setSortBy(key)}
              tint={tint}
              subtle={subtle}
            />
          ))}
        </View>

        {/* Platform section */}
        {platforms.length > 2 && (
          <>
            <View style={[styles.sheetDivider, { backgroundColor: inputBg }]} />
            <Text style={[styles.sheetSection, { color: subtle }]}>
              PLATFORM
            </Text>
            <View style={styles.sheetChipRow}>
              {platforms.map((p) => (
                <FilterChip
                  key={p}
                  label={p === "all" ? "All" : p}
                  active={platformFilter === p}
                  onPress={() => togglePlatform(p as PsnPlatform | "all")}
                  tint={tint}
                  subtle={subtle}
                />
              ))}
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card (shown while loading — same height as GameCard so no layout shift)
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
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.card, pulseStyle]}>
      <View
        style={[styles.cover, { backgroundColor: "rgba(255,255,255,0.08)" }]}
      />
      <View style={{ flex: 1, gap: 9, justifyContent: "center" }}>
        <View
          style={{
            height: 14,
            width: "72%",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 5,
          }}
        />
        <View
          style={{
            height: 11,
            width: "42%",
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: 4,
          }}
        />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Full-screen loading view (shown instead of FlatList while data fetches)
// ---------------------------------------------------------------------------

function LoadingView({
  bg,
  text,
  subtle,
  inputBg,
  topInset,
  bottomInset,
}: {
  bg: string;
  text: string;
  subtle: string;
  inputBg: string;
  topInset: number;
  bottomInset: number;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      scrollEnabled={false}
    >
      {/* Mirrors the real title row */}
      <View style={[styles.titleRow, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.heading, { color: text }]}>Library</Text>
      </View>

      {/* Greyed-out search bar placeholder */}
      <View style={[styles.searchRow]}>
        <View
          style={[styles.searchBar, { backgroundColor: inputBg, opacity: 0.5 }]}
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
        <View
          style={[styles.filterBtn, { backgroundColor: inputBg, opacity: 0.5 }]}
        />
      </View>

      <View style={[styles.sectionDivider, { backgroundColor: inputBg }]} />

      {/* Staggered skeleton rows */}
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Animated game card
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GameCard = React.memo(function GameCard({
  game,
  index,
  animate,
  onPress,
  subtle,
}: {
  game: LibraryGame;
  index: number;
  animate: boolean;
  onPress: () => void;
  subtle: string;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const earned = game.earnedTrophies;
  const defined = game.definedTrophies;
  const earnedTotal =
    earned.bronze + earned.silver + earned.gold + earned.platinum;
  const totalTrophies =
    defined.bronze + defined.silver + defined.gold + defined.platinum;
  const delay = Math.min(index * 55, 500);

  return (
    <Animated.View
      entering={
        animate
          ? FadeInDown.delay(delay).springify().damping(16).stiffness(120)
          : undefined
      }
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.965, { damping: 14, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        }}
        style={[styles.card, cardStyle]}
      >
        {/* Cover — sharedTransitionTag powers the hero animation on navigation */}
        {game.imageUrl ? (
          <Image
            source={{ uri: game.imageUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverInitial}>{game.name.charAt(0)}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {game.name}
            </Text>
            <PlatformBadge label={game.platform} />
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.trophyRow}>
              {(["platinum", "gold", "silver", "bronze"] as const).map(
                (grade) =>
                  earned[grade] > 0 ? (
                    <View key={grade} style={styles.trophyItem}>
                      <View
                        style={[
                          styles.trophyDot,
                          { backgroundColor: TROPHY_COLORS[grade] },
                        ]}
                      />
                      <Text style={[styles.trophyCount, { color: subtle }]}>
                        {earned[grade]}
                      </Text>
                    </View>
                  ) : null,
              )}
            </View>
            {totalTrophies > 0 && (
              <Text style={[styles.trophyFraction, { color: subtle }]}>
                {earnedTotal}
                <Text style={{ opacity: 0.5 }}>/{totalTrophies}</Text>
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.chevron, { color: subtle }]}>›</Text>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function LibraryScreen() {
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = useCallback(() => setSheetOpen(true), []);

  // Only animate cards on the very first data load; skip on filter/sort changes
  const [animateCards, setAnimateCards] = useState(true);
  const listOpacity = useSharedValue(1);
  const listStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const {
    games,
    totalCount,
    platforms,
    isLoading,
    isError,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    platformFilter,
    togglePlatform,
    refetch,
    isFetching,
  } = useLibrary();

  // After the initial stagger finishes, disable per-card entering animations permanently
  useEffect(() => {
    if (!isLoading && games.length > 0 && animateCards) {
      const t = setTimeout(() => setAnimateCards(false), 650);
      return () => clearTimeout(t);
    }
  }, [isLoading, games.length, animateCards]);

  // Flash the list opacity on filter / sort changes (skip during initial load)
  useEffect(() => {
    if (animateCards) return;
    listOpacity.value = 0.6;
    listOpacity.value = withTiming(1, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const handleOpenGame = useCallback(
    (game: LibraryGame) => {
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
    },
    [router],
  );

  const renderGame = useCallback(
    ({ item, index }: { item: LibraryGame; index: number }) => (
      <GameCard
        game={item}
        index={index}
        animate={animateCards}
        onPress={() => handleOpenGame(item)}
        subtle={subtle}
      />
    ),
    [handleOpenGame, subtle, animateCards],
  );

  const hasActiveFilters = platformFilter !== "all" || sortBy !== "recent";

  const ListHeader = useMemo(
    () => (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ backgroundColor: bg }}
      >
        {/* Title row — top padding absorbs status-bar safe area */}
        <View style={[styles.titleRow, { paddingTop: insets.top + 8 }]}>
          <Text style={[styles.heading, { color: text }]}>Library</Text>
          <View style={styles.titleRight}>
            {isFetching && !isLoading && (
              <ActivityIndicator size="small" color={tint} />
            )}
            {totalCount > 0 && (
              <Text style={[styles.countLabel, { color: subtle }]}>
                {totalCount} games
              </Text>
            )}
          </View>
        </View>

        {/* Search bar + filter button */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
            <Text style={[styles.searchIcon, { color: subtle }]}>⌕</Text>
            <TextInput
              style={[styles.searchInput, { color: text }]}
              placeholder="Search games…"
              placeholderTextColor={subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <Pressable
            onPress={openSheet}
            hitSlop={4}
            style={({ pressed }) => [
              styles.filterBtn,
              { backgroundColor: inputBg, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <FilterIcon color={hasActiveFilters ? tint : subtle} />
            {hasActiveFilters && (
              <View style={[styles.filterBadge, { backgroundColor: tint }]} />
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { backgroundColor: inputBg }]} />
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
      searchQuery,
      hasActiveFilters,
      openSheet,
    ],
  );

  if (isError) {
    return (
      <View
        style={[
          styles.fullCenter,
          { backgroundColor: bg, paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={[styles.stateTitle, { color: text }]}>
          Couldn’t load library
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
      <LoadingView
        bg={bg}
        text={text}
        subtle={subtle}
        inputBg={inputBg}
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
    );
  }

  return (
    <>
      <Animated.View style={[{ flex: 1, backgroundColor: bg }, listStyle]}>
        <FlatList<LibraryGame>
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          data={games}
          keyExtractor={(g) => g.npCommunicationId}
          renderItem={renderGame}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.fullCenter}>
              <Text style={[styles.stateTitle, { color: subtle }]}>
                {searchQuery ? "No results" : "No games found"}
              </Text>
              {!!searchQuery && (
                <Text style={[styles.stateSubtitle, { color: subtle }]}>
                  Try a different search term
                </Text>
              )}
            </View>
          }
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== "web"}
        />
      </Animated.View>
      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        platforms={platforms}
        platformFilter={platformFilter}
        togglePlatform={togglePlatform}
        sortBy={sortBy}
        setSortBy={setSortBy}
        tint={tint}
        subtle={subtle}
        text={text}
        bg={bg}
        inputBg={inputBg}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Header
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 6,
  },
  heading: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  titleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countLabel: { fontSize: 14 },
  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 18, marginRight: 6, lineHeight: 22 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  // Chip / sort (used inside FilterSheet)
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  sortPill: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  sortPillText: { fontSize: 13, fontWeight: "600" },
  // Filter sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  sheetDoneBtn: { fontSize: 16, fontWeight: "600" },
  sheetSection: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sheetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginBottom: 20 },
  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 13,
  },
  cover: { width: 72, height: 72, borderRadius: 10, overflow: "hidden" },
  coverPlaceholder: {
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitial: { color: "#ffffff", fontSize: 28, fontWeight: "700" },
  cardInfo: { flex: 1, gap: 6, justifyContent: "center" },
  cardTop: { gap: 4 },
  cardTitle: {
    color: "#ECEDEE",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trophyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trophyItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trophyDot: { width: 7, height: 7, borderRadius: 3.5 },
  trophyCount: { fontSize: 12, fontWeight: "500" },
  trophyFraction: { fontSize: 12, fontWeight: "600" },
  platformBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  platformBadgeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  chevron: { fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -2 },
  // Separator aligns with card text (skips cover width + horizontal padding + gap)
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 101,
  },
  // States
  fullCenter: { paddingTop: 80, alignItems: "center", gap: 10 },
  stateTitle: { fontSize: 17, fontWeight: "600" },
  stateSubtitle: { fontSize: 14 },
  retryBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  retryText: { fontSize: 15, fontWeight: "600" },
});
