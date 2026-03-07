import { useAuth } from "@/context/auth-context";
import { fetchFriendIds, fetchFriendPresence } from "@/services/psn-friends";
import { fetchRecentlyPlayed, fetchUserLibrary } from "@/services/psn-games";
import { fetchBlogPosts } from "@/services/psn-news";
import { useQuery } from "@tanstack/react-query";

export function useRecentlyPlayed() {
  const { accessToken, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "recentlyPlayed"],
    queryFn: () => fetchRecentlyPlayed(accessToken!, 3),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
}

export function useContinuePlaying() {
  const { accessToken, accountId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "continuePlaying", accountId],
    queryFn: () => fetchUserLibrary(accessToken!, accountId!, 5),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFriendsOnline() {
  const { accessToken, accountId, isAuthenticated } = useAuth();

  const friendIdsQuery = useQuery({
    queryKey: ["friends", "ids", accountId],
    queryFn: () => fetchFriendIds(accessToken!, accountId!),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 2,
  });

  const friendIds = friendIdsQuery.data ?? [];

  // Use the SAME query key as the Friends tab so both screens share the cache
  const presenceQuery = useQuery({
    queryKey: ["friends", "presence", accountId, friendIds],
    queryFn: async () => {
      const results = await Promise.allSettled(
        friendIds.map((id) => fetchFriendPresence(accessToken!, id)),
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
    enabled: isAuthenticated && !!accessToken && friendIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const friends = presenceQuery.data ?? [];
  const onlineFriends = friends.filter((f) => f.isOnline);
  const offlineFriends = friends
    .filter((f) => !f.isOnline)
    .sort(
      (a, b) =>
        new Date(b.lastOnlineAt).getTime() - new Date(a.lastOnlineAt).getTime(),
    );

  // Online first, then offline sorted by most recently seen
  const allFriends = [...onlineFriends, ...offlineFriends];

  return {
    isLoading:
      friendIdsQuery.isLoading ||
      (friendIds.length > 0 && presenceQuery.isLoading),
    onlineCount: onlineFriends.length,
    allFriends,
    totalFriends: friendIds.length,
  };
}

export function useLatestNews() {
  return useQuery({
    queryKey: ["news", 1],
    queryFn: () => fetchBlogPosts(1),
    staleTime: 1000 * 60 * 15,
    select: (posts) => posts[0] ?? null,
  });
}
