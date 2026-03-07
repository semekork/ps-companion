import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlatformBadge } from "@/components/platform-badge";
import { ProgressRing } from "@/components/progress-ring";
import { PsnAvatar } from "@/components/psn-avatar";
import { Skeleton } from "@/components/skeleton-placeholder";
import { useAuth } from "@/context/auth-context";
import { useUser } from "@/context/user-context";
import type { LibraryGame } from "@/types/psn";
import {
  useContinuePlaying,
  useFriendsOnline,
  useLatestNews,
} from "./use-dashboard";

// ─── Palette shortcuts ───────────────────────────────────────────────────────
const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";

export default function DashboardScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile, trophySummary } = useUser();

  const continuePlaying = useContinuePlaying();
  const friendsOnline = useFriendsOnline();
  const latestNews = useLatestNews();

  const insets = useSafeAreaInsets();
  const isRefreshing = continuePlaying.isFetching || latestNews.isFetching;
  const hero = continuePlaying.data?.[0] ?? null;
  const rest = continuePlaying.data?.slice(1) ?? [];

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

  function handleRefresh() {
    continuePlaying.refetch();
    latestNews.refetch();
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* ── Hero header — gradient bleeds through status bar ─────── */}
        <LinearGradient
          colors={[PS_DARK, "#001A3A", "#000000"]}
          locations={[0, 0.6, 1]}
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 32,
            paddingHorizontal: 20,
          }}
        >
          <View className="flex-row items-center justify-between mb-6">
            {/* Branding */}
            <View className="flex-row items-center gap-x-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: PS_BLUE }}
              >
                <Text className="text-white font-black text-sm">PS</Text>
              </View>
              <Text className="text-white font-semibold text-base">
                Companion
              </Text>
            </View>

            {/* Avatar + name */}
            <Pressable
              className="flex-row items-center gap-x-2 active:opacity-70"
              onPress={signOut}
              hitSlop={8}
            >
              <View className="items-end">
                <Text className="text-white text-sm font-semibold leading-4">
                  {profile?.onlineId ?? "—"}
                </Text>
                {profile?.isPsPlus && (
                  <View
                    className="mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "#F9AA00" }}
                  >
                    <Text className="text-black text-[9px] font-black tracking-wider">
                      PS PLUS
                    </Text>
                  </View>
                )}
              </View>
              <PsnAvatar
                uri={profile?.avatarUrl}
                onlineId={profile?.onlineId}
                size={40}
                isOnline={profile?.primaryOnlineStatus === "online"}
              />
            </Pressable>
          </View>

          {/* Trophy level strip */}
          {trophySummary ? (
            <View className="flex-row items-center gap-x-4">
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
                <View className="flex-row gap-x-3">
                  <TrophyPill
                    color="#B468F0"
                    label="PLT"
                    count={trophySummary.earnedTrophies.platinum}
                  />
                  <TrophyPill
                    color="#E8B420"
                    label="GLD"
                    count={trophySummary.earnedTrophies.gold}
                  />
                  <TrophyPill
                    color="#9BA7AF"
                    label="SLV"
                    count={trophySummary.earnedTrophies.silver}
                  />
                  <TrophyPill
                    color="#C47A3A"
                    label="BRZ"
                    count={trophySummary.earnedTrophies.bronze}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-x-4">
              <Skeleton width={60} height={60} borderRadius={30} />
              <View className="flex-1 justify-center gap-y-2">
                <Skeleton width={160} height={10} borderRadius={5} />
                <Skeleton width={120} height={10} borderRadius={5} />
              </View>
            </View>
          )}
        </LinearGradient>

        {/* ── Continue Playing (hero game) ─────────────────────────────── */}
        <View className="px-4 mt-6">
          <SectionHeader
            title="Continue Playing"
            action="See All"
            onAction={() => router.push("/(tabs)/library")}
          />

          {continuePlaying.isLoading ? (
            <Skeleton width="100%" height={180} borderRadius={16} />
          ) : hero ? (
            <HeroGameCard game={hero} onPress={() => handleOpenGame(hero)} />
          ) : (
            <EmptyState label="No recently played games." />
          )}
        </View>

        {/* ── Game shelf (horizontal scroll) ──────────────────────────── */}
        {!continuePlaying.isLoading && rest.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              gap: 10,
            }}
          >
            {rest.map((game) => (
              <GameShelfCard
                key={game.npCommunicationId}
                game={game}
                onPress={() => handleOpenGame(game)}
              />
            ))}
          </ScrollView>
        )}

        {/* ── Friends ──────────────────────────────────────────────────── */}
        <View className="px-4 mt-6">
          <SectionHeader
            title="Friends"
            action="View All"
            onAction={() => router.push("/(tabs)/friends")}
          />

          {friendsOnline.isLoading ? (
            <View className="flex-row gap-x-5">
              {[0, 1, 2, 3].map((i) => (
                <View key={i} className="items-center gap-y-2">
                  <Skeleton width={52} height={52} borderRadius={26} />
                  <Skeleton width={44} height={8} borderRadius={4} />
                </View>
              ))}
            </View>
          ) : friendsOnline.allFriends.length === 0 ? (
            <View className="bg-zinc-900 rounded-2xl px-5 py-4 flex-row items-center gap-x-3">
              <View className="w-2 h-2 rounded-full bg-zinc-600" />
              <Text className="text-gray-500 text-sm">No friends found</Text>
            </View>
          ) : (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 20 }}
              >
                {friendsOnline.allFriends.slice(0, 5).map((f) => (
                  <View key={f.accountId} className="items-center gap-y-2">
                    <PsnAvatar
                      uri={f.avatarUrl}
                      onlineId={f.onlineId}
                      size={52}
                      isOnline={f.isOnline}
                    />
                    <Text
                      className="text-gray-400 text-xs"
                      numberOfLines={1}
                      style={{ maxWidth: 62 }}
                    >
                      {f.onlineId}
                    </Text>
                    <Text
                      className="text-gray-600 text-[9px]"
                      numberOfLines={1}
                      style={{ maxWidth: 62 }}
                    >
                      {f.isOnline
                        ? (f.currentlyPlayingTitle ?? "Online")
                        : formatRelativeDate(f.lastOnlineAt)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── Latest PS News ───────────────────────────────────────────── */}
        <View className="px-4 mt-6">
          <SectionHeader
            title="Latest PS News"
            action="See All"
            onAction={() => router.push("/(tabs)/news")}
          />

          {latestNews.isLoading ? (
            <Skeleton width="100%" height={200} borderRadius={16} />
          ) : latestNews.data ? (
            <Pressable
              className="rounded-2xl overflow-hidden active:opacity-85"
              onPress={() => router.push("/(tabs)/news")}
            >
              {latestNews.data.thumbnailUrl ? (
                <View style={{ height: 200 }}>
                  <Image
                    source={{ uri: latestNews.data.thumbnailUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    locations={[0.3, 1]}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 16,
                    }}
                  >
                    <View className="flex-row items-center gap-x-2 mb-1.5">
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: PS_BLUE }}
                      >
                        <Text className="text-white text-[9px] font-bold uppercase tracking-wider">
                          {latestNews.data.category}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-[10px]">
                        {formatRelativeDate(latestNews.data.publishedAt)}
                      </Text>
                    </View>
                    <Text
                      className="text-white font-bold text-sm leading-5"
                      numberOfLines={2}
                    >
                      {latestNews.data.title}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View className="bg-zinc-900 rounded-2xl p-5">
                  <Text
                    className="text-white font-semibold text-sm"
                    numberOfLines={3}
                  >
                    {latestNews.data.title}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : (
            <EmptyState label="Could not load news." />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Hero game card ───────────────────────────────────────────────────────────

function HeroGameCard({
  game,
  onPress,
}: {
  game: LibraryGame;
  onPress: () => void;
}) {
  const progressWidth = `${game.progress}%` as const;
  return (
    <Pressable
      className="rounded-2xl overflow-hidden active:opacity-85"
      style={{ height: 180 }}
      onPress={onPress}
    >
      <Image
        source={{ uri: game.imageUrl }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.92)"]}
        locations={[0.15, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 14,
        }}
      >
        <View className="flex-row items-end justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text
              className="text-white font-bold text-base leading-5"
              numberOfLines={1}
            >
              {game.name}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              Last trophy {formatRelativeDate(game.lastTrophyEarnedAt)}
            </Text>
          </View>
          <PlatformBadge platform={game.platform} />
        </View>
        {/* Progress bar */}
        <View className="flex-row items-center gap-x-2">
          <View
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <View
              className="h-1 rounded-full"
              style={{ width: progressWidth, backgroundColor: PS_BLUE }}
            />
          </View>
          <Text className="text-gray-400 text-[10px] font-semibold w-7 text-right">
            {game.progress}%
          </Text>
        </View>
      </LinearGradient>
      {/* Play arrow overlay */}
      <View
        className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Text className="text-white text-sm" style={{ marginLeft: 2 }}>
          {"▶"}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Small shelf card ─────────────────────────────────────────────────────────

function GameShelfCard({
  game,
  onPress,
}: {
  game: LibraryGame;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={{ width: 90 }}
      onPress={onPress}
      className="active:opacity-75"
    >
      <View className="rounded-xl overflow-hidden" style={{ height: 90 }}>
        <Image
          source={{ uri: game.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View style={{ position: "absolute", bottom: 4, right: 4 }}>
          <PlatformBadge platform={game.platform} />
        </View>
        {/* Thin progress bar along bottom edge */}
        {game.progress > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: `${game.progress}%`,
              height: 3,
              backgroundColor: PS_BLUE,
            }}
          />
        )}
      </View>
      <Text
        className="text-gray-400 text-[10px] mt-1.5 text-center"
        numberOfLines={1}
      >
        {game.name}
      </Text>
    </Pressable>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-white font-bold text-base">{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-xs font-medium" style={{ color: PS_BLUE }}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

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
      className="flex-row items-center gap-x-1 px-2 py-1 rounded-full"
      style={{ backgroundColor: `${color}22` }}
    >
      <View
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="text-white text-xs font-semibold">{count}</Text>
      <Text className="text-xs" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View className="bg-zinc-900 rounded-2xl px-5 py-6 items-center">
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  );
}

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
