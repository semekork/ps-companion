import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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

import { ProgressRing } from "@/components/progress-ring";
import { PsnAvatar } from "@/components/psn-avatar";
import { useUser } from "@/context/user-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { LibraryGame } from "@/types/psn";

import {
  type TrophyFilter,
  type TrophySort,
  useTrophyTracker,
} from "./use-trophy-tracker";

// ─── Constants ────────────────────────────────────────────────────────────────

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

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
const TROPHY_COLORS = {
  platinum: "#B0C4DE",
  gold: "#D4AF37",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
} as const;

const FILTER_LABELS: { key: TrophyFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "platinum", label: "Platinum ✓" },
  { key: "incomplete", label: "Incomplete" },
  { key: "complete", label: "100%" },
];

const SORT_LABELS: Record<TrophySort, string> = {
  recent: "Last Earned",
  progress: "Completion %",
  platinum: "Platinum First",
  "most-won": "Most Won",
};
const SORT_CYCLE: TrophySort[] = ["recent", "progress", "platinum", "most-won"];
const SHEET_SPRING = { damping: 22, stiffness: 280 } as const;

// ─── Sort + filter sheet ──────────────────────────────────────────────────────

function SortFilterSheet({
  visible,
  onClose,
  sortBy,
  onSort,
  filter,
  onFilter,
  tint,
  subtle,
  text,
  bg,
  inputBg,
}: {
  visible: boolean;
  onClose: () => void;
  sortBy: TrophySort;
  onSort: (s: TrophySort) => void;
  filter: TrophyFilter;
  onFilter: (f: TrophyFilter) => void;
  tint: string;
  subtle: string;
  text: string;
  bg: string;
  inputBg: string;
}) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

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

      <Animated.View
        style={[
          styles.sheet,
          sheetStyle,
          { backgroundColor: bg, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTitleRow}>
          <Text style={[styles.sheetTitle, { color: text }]}>
            Sort &amp; Filter
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.sheetDoneBtn, { color: tint }]}>Done</Text>
          </Pressable>
        </View>

        <Text style={[styles.sheetSection, { color: subtle }]}>SORT BY</Text>
        <View style={styles.sheetChipRow}>
          {SORT_CYCLE.map((key) => {
            const active = sortBy === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.sheetPill,
                  { borderColor: active ? tint : "rgba(128,128,128,0.3)" },
                  active && { backgroundColor: `${tint}22` },
                ]}
                onPress={() => onSort(key)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    { color: active ? tint : subtle },
                  ]}
                >
                  {SORT_LABELS[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.sheetDivider, { backgroundColor: inputBg }]} />
        <Text style={[styles.sheetSection, { color: subtle }]}>FILTER</Text>
        <View style={styles.sheetChipRow}>
          {FILTER_LABELS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.sheetPill,
                  { borderColor: active ? tint : "rgba(128,128,128,0.3)" },
                  active && { backgroundColor: `${tint}22` },
                ]}
                onPress={() => onFilter(key)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    { color: active ? tint : subtle },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Animated pressable ───────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
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

// ─── Trophy title row ────────────────────────────────────────────────────────

const TrophyTitleRow = React.memo(function TrophyTitleRow({
  game,
  index,
  onPress,
  text,
  subtle,
}: {
  game: LibraryGame;
  index: number;
  onPress: () => void;
  text: string;
  subtle: string;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasPlatinum = game.earnedTrophies.platinum > 0;
  const earned = game.earnedTrophies;
  const defined = game.definedTrophies;
  const totalEarned =
    earned.platinum + earned.gold + earned.silver + earned.bronze;
  const totalDefined =
    defined.platinum + defined.gold + defined.silver + defined.bronze;
  const delay = Math.min(index * 40, 400);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18).stiffness(130)}
    >
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.965, { damping: 14, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        }}
        onPress={onPress}
        style={[styles.row, cardStyle]}
      >
        {/* Cover art */}
        <View style={styles.iconWrap}>
          {game.imageUrl ? (
            <Image
              source={{ uri: game.imageUrl }}
              style={styles.icon}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.icon, styles.iconFallback]}>
              <Text style={styles.iconFallbackText}>🎮</Text>
            </View>
          )}
          {hasPlatinum && (
            <View style={styles.platBadge}>
              <Text style={styles.platBadgeText}>P</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.rowBody}>
          {/* Name + platform */}
          <View style={styles.nameRow}>
            <Text style={[styles.gameName, { color: text }]} numberOfLines={1}>
              {game.name}
            </Text>
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>
                {game.platform.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Trophy count pills */}
          <View style={styles.trophyCountRow}>
            {(["platinum", "gold", "silver", "bronze"] as const).map((grade) =>
              defined[grade] > 0 ? (
                <View key={grade} style={styles.trophyCountItem}>
                  <View
                    style={[
                      styles.trophyDot,
                      { backgroundColor: TROPHY_COLORS[grade] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.trophyCountNum,
                      {
                        color:
                          earned[grade] > 0 ? TROPHY_COLORS[grade] : subtle,
                      },
                    ]}
                  >
                    {earned[grade]}
                  </Text>
                  <Text style={[styles.trophyCountDenom, { color: subtle }]}>
                    /{defined[grade]}
                  </Text>
                </View>
              ) : null,
            )}
            <Text style={[styles.trophyTotal, { color: subtle }]}>
              {totalEarned}/{totalDefined}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${game.progress}%` as any,
                    backgroundColor:
                      game.progress === 100 ? TROPHY_COLORS.gold : PS_BLUE,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPct, { color: subtle }]}>
              {game.progress}%
            </Text>
          </View>
        </View>

        {/* Right column */}
        <View style={styles.rowRight}>
          <Text
            style={[styles.lastUpdated, { color: subtle }]}
            numberOfLines={2}
          >
            {formatRelative(game.lastTrophyEarnedAt)}
          </Text>
          <Text style={[styles.chevron, { color: subtle }]}>›</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Profile card (list header) ───────────────────────────────────────────────

function ProfileCard({ topInset }: { topInset: number }) {
  const { profile, trophySummary } = useUser();
  const tierColor = TIER_COLOR[trophySummary?.tier ?? 1] ?? "#CD7F32";
  const tierLabel = TIER_LABEL[trophySummary?.tier ?? 1] ?? "Bronze I";

  return (
    <LinearGradient
      colors={[PS_DARK, "#001A3A", "#080808"]}
      locations={[0, 0.6, 1]}
      style={[styles.headerGradient, { paddingTop: topInset + 16 }]}
    >
      {/* Title row */}
      <View style={styles.headerTitleRow}>
        <Text style={styles.screenTitle}>Trophies</Text>
        {profile && (
          <View style={styles.headerAvatarRow}>
            <Text style={styles.headerOnlineId}>{profile.onlineId}</Text>
            <PsnAvatar
              uri={profile.avatarUrl}
              onlineId={profile.onlineId}
              size={36}
              isOnline={profile.primaryOnlineStatus === "online"}
            />
          </View>
        )}
      </View>

      {/* Level & summary */}
      {trophySummary ? (
        <View style={styles.summaryRow}>
          {/* Progress ring */}
          <ProgressRing
            progress={trophySummary.progress}
            size={72}
            color={tierColor}
            strokeWidth={5}
          >
            <View style={styles.ringInner}>
              <Text style={styles.levelNum}>{trophySummary.trophyLevel}</Text>
              <Text style={styles.levelLv}>LV</Text>
            </View>
          </ProgressRing>

          {/* Tier + counts */}
          <View style={styles.summaryRight}>
            <View style={styles.tierRow}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: `${tierColor}30` },
                ]}
              >
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {tierLabel}
                </Text>
              </View>
              <Text style={styles.progressToNext}>
                {trophySummary.progress}% to next
              </Text>
            </View>

            {/* Trophy count grid */}
            <View style={styles.trophySumGrid}>
              {(
                [
                  ["platinum", "PLT"],
                  ["gold", "GLD"],
                  ["silver", "SLV"],
                  ["bronze", "BRZ"],
                ] as const
              ).map(([grade, abbr]) => (
                <View key={grade} style={styles.trophySumItem}>
                  <View
                    style={[
                      styles.trophySumDot,
                      { backgroundColor: TROPHY_COLORS[grade] },
                    ]}
                  />
                  <Text style={styles.trophySumCount}>
                    {trophySummary.earnedTrophies[grade]}
                  </Text>
                  <Text
                    style={[
                      styles.trophySumLabel,
                      { color: TROPHY_COLORS[grade] },
                    ]}
                  >
                    {abbr}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.summaryPlaceholder} />
      )}
    </LinearGradient>
  );
}

// ─── Controls bar ─────────────────────────────────────────────────────────────

function ControlsBar({
  searchQuery,
  sortBy,
  filter,
  totalCount,
  visibleCount,
  onSearch,
  onOpenSheet,
  tint,
  subtle,
  inputBg,
  text,
}: {
  searchQuery: string;
  sortBy: TrophySort;
  filter: TrophyFilter;
  totalCount: number;
  visibleCount: number;
  onSearch: (text: string) => void;
  onOpenSheet: () => void;
  tint: string;
  subtle: string;
  inputBg: string;
  text: string;
}) {
  const hasActive = sortBy !== "most-won" || filter !== "all";
  const filterLabel =
    filter !== "all"
      ? (FILTER_LABELS.find((f) => f.key === filter)?.label ?? "Filter")
      : SORT_LABELS[sortBy];

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.controlsWrap}>
      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
          <Text style={[styles.searchIcon, { color: subtle }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: text }]}
            placeholder="Search games…"
            placeholderTextColor={subtle}
            value={searchQuery}
            onChangeText={onSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Sort & Filter button */}
        <Pressable
          style={({ pressed }) => [
            styles.sortBtn,
            { backgroundColor: inputBg },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onOpenSheet}
          hitSlop={6}
        >
          <Text style={[styles.sortIcon, { color: subtle }]}>⇅</Text>
          <Text style={[styles.sortLabel, { color: text }]} numberOfLines={1}>
            {filterLabel}
          </Text>
          {hasActive && (
            <View style={[styles.sortActiveDot, { backgroundColor: tint }]} />
          )}
        </Pressable>
      </View>

      <Text style={[styles.gameCount, { color: subtle }]}>
        {visibleCount}
        {visibleCount !== totalCount ? `/${totalCount}` : ""} games
      </Text>
      <View style={[styles.divider, { backgroundColor: inputBg }]} />
    </Animated.View>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse = useSharedValue(0.35);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 750 }),
        withTiming(0.35, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.row, pulseStyle]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10 },
        ]}
      />
      <View style={{ flex: 1, gap: 9, justifyContent: "center" }}>
        <View
          style={{
            height: 14,
            width: "68%",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 5,
          }}
        />
        <View
          style={{
            height: 11,
            width: "48%",
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: 4,
          }}
        />
        <View
          style={{
            height: 3,
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: 2,
          }}
        />
      </View>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function TrophyTrackerScreen() {
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
    games,
    isLoading,
    isError,
    isFetching,
    refetch,
    searchQuery,
    sortBy,
    filter,
    totalCount,
    onSearch,
    onSort,
    onFilter,
  } = useTrophyTracker();

  const [sheetOpen, setSheetOpen] = useState(false);

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

  const renderItem = useCallback(
    ({ item, index }: { item: LibraryGame; index: number }) => (
      <TrophyTitleRow
        game={item}
        index={index}
        text={text}
        subtle={subtle}
        onPress={() => handleOpenGame(item)}
      />
    ),
    [handleOpenGame, text, subtle],
  );

  const ListHeader = useMemo(
    () => (
      <>
        <ProfileCard topInset={insets.top} />
        <ControlsBar
          searchQuery={searchQuery}
          sortBy={sortBy}
          filter={filter}
          totalCount={totalCount}
          visibleCount={games.length}
          onSearch={onSearch}
          onOpenSheet={() => setSheetOpen(true)}
          tint={tint}
          subtle={subtle}
          inputBg={inputBg}
          text={text}
        />
        {isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Failed to load trophy list.</Text>
            <Pressable
              onPress={() => refetch()}
              style={[styles.retryBtn, { borderColor: tint }]}
            >
              <Text style={[styles.retryText, { color: tint }]}>Retry</Text>
            </Pressable>
          </View>
        )}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      insets.top,
      searchQuery,
      sortBy,
      filter,
      totalCount,
      games.length,
      isError,
      tint,
      subtle,
      inputBg,
      text,
    ],
  );

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: subtle }]}>
          No games found.
        </Text>
      </View>
    );
  }, [isLoading, subtle]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList<LibraryGame>
        style={[styles.list, { backgroundColor: bg }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        data={isLoading ? [] : games}
        keyExtractor={(g) => g.npCommunicationId}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={tint}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: inputBg }]} />
        )}
        initialNumToRender={20}
        maxToRenderPerBatch={30}
        windowSize={10}
        removeClippedSubviews
      />
      <SortFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sortBy={sortBy}
        onSort={onSort}
        filter={filter}
        onFilter={onFilter}
        tint={tint}
        subtle={subtle}
        text={text}
        bg={bg}
        inputBg={inputBg}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: { flex: 1 },

  // ── Gradient header
  headerGradient: { paddingBottom: 28, paddingHorizontal: 20 },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  screenTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  headerAvatarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerOnlineId: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Trophy level summary
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  summaryPlaceholder: { height: 72 },
  ringInner: { alignItems: "center" },
  levelNum: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  levelLv: { color: "#888", fontSize: 9 },
  summaryRight: { flex: 1 },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tierBadge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  tierText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  progressToNext: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  trophySumGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  trophySumItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trophySumDot: { width: 7, height: 7, borderRadius: 3.5 },
  trophySumCount: { color: "#fff", fontSize: 13, fontWeight: "700" },
  trophySumLabel: { fontSize: 10, fontWeight: "600" },

  // ── Controls
  controlsWrap: { paddingTop: 12, paddingBottom: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  searchIcon: { fontSize: 18, lineHeight: 22 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 13,
    paddingHorizontal: 11,
    height: 42,
  },
  sortIcon: { fontSize: 13 },
  sortLabel: { fontSize: 11, fontWeight: "600", maxWidth: 80 },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  countLabel: { fontSize: 12, marginLeft: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  // ── Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  iconWrap: { width: 62, height: 62, position: "relative" },
  icon: { width: 62, height: 62, borderRadius: 10 },
  iconFallback: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconFallbackText: { fontSize: 24 },
  platBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#B0C4DE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  platBadgeText: { color: "#000", fontSize: 8, fontWeight: "900" },
  rowBody: { flex: 1, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  gameName: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  platformBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  platformBadgeText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  trophyCountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trophyCountItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  trophyDot: { width: 6, height: 6, borderRadius: 3 },
  trophyCountNum: { fontSize: 11, fontWeight: "600" },
  trophyCountDenom: { fontSize: 10 },
  trophyTotal: { fontSize: 11, marginLeft: "auto" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 1.5 },
  progressPct: {
    fontSize: 10,
    fontWeight: "600",
    width: 28,
    textAlign: "right",
  },
  rowRight: { alignItems: "flex-end", gap: 4 },
  lastUpdated: { fontSize: 10, textAlign: "right", maxWidth: 56 },
  chevron: { fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -2 },

  // ── Separator — inset aligned with text column
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 + 62 + 12 },

  // ── Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  errorText: { color: "#ff453a", fontSize: 13 },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: { fontSize: 13, fontWeight: "600" },

  // ── Empty
  emptyWrap: { paddingTop: 60, alignItems: "center" },
  emptyText: { fontSize: 15, fontWeight: "600" },

  // ── Sort button active dot
  sortActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
    marginBottom: 6,
    alignSelf: "flex-end",
  },

  // ── Game count label
  gameCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  // ── Bottom sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.4)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  sheetDoneBtn: { fontSize: 15, fontWeight: "600" },
  sheetSection: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sheetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  sheetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sheetPillText: { fontSize: 13, fontWeight: "600" },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginBottom: 20 },
});
