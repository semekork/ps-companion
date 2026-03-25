import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressRing } from "@/components/progress-ring";
import { PsnAvatar } from "@/components/psn-avatar";
import { Skeleton } from "@/components/skeleton-placeholder";
import { useUser } from "@/context/user-context";
import type { FriendPresence, LibraryGame } from "@/types/psn";
import { NewsList } from "../news/news-screen";
import {
  useContinuePlaying,
  useFriendsOnline,
  useLatestNews,
} from "./use-dashboard";

// ─── Palette shortcuts ───────────────────────────────────────────────────────
const PS_BLUE = "#0070D1";

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<"games" | "news">("games");
  const router = useRouter();
  const { profile, trophySummary } = useUser();

  const continuePlaying = useContinuePlaying();
  const friendsOnline = useFriendsOnline();
  const latestNews = useLatestNews();

  const insets = useSafeAreaInsets();
  const isRefreshing = continuePlaying.isFetching || latestNews.isFetching;
  const hero = continuePlaying.data?.[0] ?? null;

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
      {/* ── Fixed Hero Background  ─────────────── */}
      {activeTab === "games" && hero ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 500,
          }}
        >
          <Image
            source={{ uri: hero.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)", "#000000"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : activeTab === "news" ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 500,
          }}
        >
          <View
            style={{ width: "100%", height: "100%", backgroundColor: "#111" }}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)", "#000000"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 500,
            backgroundColor: "#0a0a0a",
          }}
        />
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* ── Top Bar ───────────────────────────────────────── */}
        <View
          className="flex-row items-center justify-between px-5 mb-10"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-baseline gap-x-6">
            <Pressable onPress={() => setActiveTab("games")}>
              <Text
                className={`text-xl font-bold ${activeTab === "games" ? "text-white" : "text-gray-500"}`}
              >
                Games
              </Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab("news")}>
              <Text
                className={`text-xl font-bold ${activeTab === "news" ? "text-white" : "text-gray-500"}`}
              >
                News
              </Text>
            </Pressable>
          </View>
          <Pressable
            className="active:opacity-70"
            onPress={() => router.push("/profile")}
            hitSlop={8}
          >
            <PsnAvatar
              uri={profile?.avatarUrl}
              onlineId={profile?.onlineId}
              size={36}
              isOnline={profile?.primaryOnlineStatus === "online"}
            />
          </Pressable>
        </View>

        {activeTab === "games" ? (
          <>
            {/* ── Game Shelf ────────────────────────────────────── */}
            <View>
              {continuePlaying.isLoading ? (
                <View className="flex-row px-5 gap-x-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} width={72} height={72} borderRadius={8} />
                  ))}
                </View>
              ) : continuePlaying.data && continuePlaying.data.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                  {continuePlaying.data.map((game, i) => {
                    const isSelected = i === 0;
                    return (
                      <Pressable
                        key={game.npCommunicationId}
                        onPress={() => handleOpenGame(game)}
                        className="active:opacity-80"
                      >
                        <View
                          className={`rounded-lg overflow-hidden ${
                            isSelected
                              ? "border-2 border-white"
                              : "border border-white/10"
                          }`}
                          style={{ width: 72, height: 72 }}
                        >
                          <Image
                            source={{ uri: game.imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View className="px-5">
                  <EmptyState label="No recently played games." />
                </View>
              )}
            </View>

            {/* ── Hero Info & Action ────────────────────────────── */}
            {hero && (
              <View className="px-5 mt-8 mb-10">
                <Text
                  className="text-white font-bold text-3xl leading-tight mb-1"
                  numberOfLines={2}
                >
                  {hero.name}
                </Text>
                <Text className="text-gray-300 text-sm mb-6">
                  {hero.platform} • Last played{" "}
                  {formatRelativeDate(hero.lastTrophyEarnedAt)}
                </Text>

                <Pressable
                  className="flex-row items-center justify-center rounded-lg px-8 py-3 self-start active:opacity-80"
                  style={{ backgroundColor: "white" }}
                  onPress={() => handleOpenGame(hero)}
                >
                  <Text className="text-black text-sm font-bold">
                    Open Game
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── Trophies Activity ─────────────────────────────── */}
            <View className="px-5 mt-6 pt-6 border-t border-white/10">
              <SectionHeader title="Your Trophy Summary" />
              {trophySummary ? (
                <View className="bg-zinc-900 rounded-xl p-5 border border-white/5 mt-2">
                  <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center gap-x-4">
                      <ProgressRing
                        progress={trophySummary.progress}
                        size={48}
                        color={PS_BLUE}
                        strokeWidth={4}
                      >
                        <Text className="text-white font-bold text-sm">
                          {trophySummary.trophyLevel}
                        </Text>
                      </ProgressRing>
                      <View>
                        <Text className="text-white font-semibold mb-0.5">
                          Level {trophySummary.trophyLevel}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {trophySummary.progress}% to next level
                        </Text>
                      </View>
                    </View>
                    <TrophyPill
                      color="#B468F0"
                      label="PLT"
                      count={trophySummary.earnedTrophies.platinum}
                    />
                  </View>

                  <View className="flex-row gap-x-3">
                    <View className="flex-1 bg-black/40 rounded-lg py-2 items-center">
                      <Text className="text-gray-400 text-[10px] mb-1">
                        Gold
                      </Text>
                      <Text className="text-[#E8B420] font-bold text-sm">
                        {trophySummary.earnedTrophies.gold}
                      </Text>
                    </View>
                    <View className="flex-1 bg-black/40 rounded-lg py-2 items-center">
                      <Text className="text-gray-400 text-[10px] mb-1">
                        Silver
                      </Text>
                      <Text className="text-[#9BA7AF] font-bold text-sm">
                        {trophySummary.earnedTrophies.silver}
                      </Text>
                    </View>
                    <View className="flex-1 bg-black/40 rounded-lg py-2 items-center">
                      <Text className="text-gray-400 text-[10px] mb-1">
                        Bronze
                      </Text>
                      <Text className="text-[#C47A3A] font-bold text-sm">
                        {trophySummary.earnedTrophies.bronze}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="mt-2">
                  <Skeleton width="100%" height={120} borderRadius={12} />
                </View>
              )}
            </View>

            {/* ── Friends ───────────────────────────────────────── */}
            <View className="px-5 mt-8">
              <SectionHeader
                title="Friends"
                action="View All"
                onAction={() => router.push("/(tabs)/friends")}
              />

              {friendsOnline.isLoading ? (
                <View className="flex-row gap-x-5 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} className="items-center gap-y-2">
                      <Skeleton width={48} height={48} borderRadius={24} />
                      <Skeleton width={44} height={8} borderRadius={4} />
                    </View>
                  ))}
                </View>
              ) : friendsOnline.allFriends.length === 0 ? (
                <View className="mt-2">
                  <Text className="text-gray-500 text-sm">
                    No friends online
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 20, paddingTop: 8 }}
                >
                  {friendsOnline.allFriends
                    .slice(0, 5)
                    .map((f: FriendPresence) => (
                      <View key={f.accountId} className="items-center gap-y-2">
                        <PsnAvatar
                          uri={f.avatarUrl}
                          onlineId={f.onlineId}
                          size={48}
                          isOnline={f.isOnline}
                        />
                        <Text
                          className="text-gray-300 text-xs"
                          numberOfLines={1}
                          style={{ maxWidth: 62, textAlign: "center" }}
                        >
                          {f.onlineId}
                        </Text>
                      </View>
                    ))}
                </ScrollView>
              )}
            </View>

            {/* ── Activity Feed ─────────────────────────────────── */}
            <View className="px-5 mt-8">
                <SectionHeader title="Recent Activity" />
                <View className="gap-y-4">
                    <ActivityItem 
                        onlineId="KratosFan99"
                        avatarUrl="https://avatar-res.api.playstation.com/avatar/PPL/UP00012102001_A01.png"
                        type="trophy"
                        title="Trophy Earned"
                        detail="Platinum Trophy in God of War Ragnarök"
                        timestamp="2h ago"
                        imageUrl="https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/67Oq8O76C29U2D9b0e257B.png"
                    />
                    <ActivityItem 
                        onlineId="AstroExplorer"
                        avatarUrl="https://avatar-res.api.playstation.com/avatar/PPL/UP00012102001_A05.png"
                        type="playing"
                        title="Started Playing"
                        detail="Astro Bot: Rescue Mission"
                        timestamp="5h ago"
                        imageUrl="https://image.api.playstation.com/vulcan/ap/rnd/202009/2419/ZxtH9QoXWf3A9e6G2L3T1H.png"
                    />
                    <ActivityItem 
                        onlineId="NathanDrake_007"
                        avatarUrl="https://avatar-res.api.playstation.com/avatar/PPL/UP00012102001_A03.png"
                        type="trophy"
                        title="Trophy Earned"
                        detail="Charted! - Crushing in Uncharted 4"
                        timestamp="1d ago"
                        imageUrl="https://image.api.playstation.com/vulcan/ap/rnd/202109/2821/SrtH9QoXWf3A9e6G2L3T1H.png"
                    />
                </View>
            </View>

            {/* ── Latest PS News ────────────────────────────────── */}
            <View className="px-5 mt-8 mb-4">
              <SectionHeader
                title="Official News"
                action="See All"
                onAction={() => router.push("/(tabs)/news")}
              />

              {latestNews.isLoading ? (
                <View className="mt-2">
                  <Skeleton width="100%" height={220} borderRadius={12} />
                </View>
              ) : latestNews.data ? (
                <Pressable
                  className="mt-2 bg-zinc-900 rounded-xl overflow-hidden border border-white/5 active:opacity-85"
                  onPress={() => router.push("/(tabs)/news")}
                >
                  {latestNews.data.thumbnailUrl ? (
                    <>
                      <Image
                        source={{ uri: latestNews.data.thumbnailUrl }}
                        style={{ width: "100%", height: 160 }}
                        contentFit="cover"
                      />
                      <View className="p-4 bg-zinc-900 border-t border-white/5">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                          {latestNews.data.category} •{" "}
                          {formatRelativeDate(latestNews.data.publishedAt)}
                        </Text>
                        <Text
                          className="text-white font-semibold text-sm leading-snug"
                          numberOfLines={2}
                        >
                          {latestNews.data.title}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View className="p-5">
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
                <View className="mt-2">
                  <EmptyState label="Could not load news." />
                </View>
              )}
            </View>
          </>
        ) : (
          <NewsList showHeader={false} showHeaderSpacing={false} />
        )}
      </ScrollView>
    </View>
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
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-white font-bold text-lg">{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-medium" style={{ color: PS_BLUE }}>
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
    <View className="flex-row items-center gap-x-1.5">
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="text-white font-bold">{count}</Text>
      <Text className="text-[10px] font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View className="bg-zinc-900 rounded-xl px-4 py-6 items-center border border-white/5">
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

function ActivityItem({
    onlineId,
    avatarUrl,
    type,
    title,
    detail,
    timestamp,
    imageUrl,
}: {
    onlineId: string;
    avatarUrl: string;
    type: "trophy" | "playing";
    title: string;
    detail: string;
    timestamp: string;
    imageUrl: string;
}) {
    return (
        <View className="flex-row gap-x-3 bg-zinc-900/50 rounded-xl p-3 border border-white/5">
            <PsnAvatar uri={avatarUrl} onlineId={onlineId} size={40} />
            <View className="flex-1">
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    {onlineId} • {timestamp}
                </Text>
                <Text className="text-white font-bold text-sm mt-0.5">{title}</Text>
                <Text className="text-gray-300 text-xs mt-1" numberOfLines={1}>{detail}</Text>
            </View>
            {imageUrl && (
                <Image 
                    source={{ uri: imageUrl }} 
                    style={{ width: 44, height: 44, borderRadius: 6 }} 
                    contentFit="cover"
                />
            )}
        </View>
    );
}
