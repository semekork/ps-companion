import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { fetchFriendIds, fetchFriendPresence } from "@/services/psn-friends";
import type { FriendPresence } from "@/types/psn";

export function useFriends() {
  const { accessToken, accountId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const friendIdsQuery = useQuery({
    queryKey: ["friends", "ids", accountId],
    queryFn: () => fetchFriendIds(accessToken!, accountId!),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 2,
  });

  const friendIds = friendIdsQuery.data ?? [];

  const presenceQuery = useQuery<FriendPresence[]>({
    queryKey: ["friends", "presence", accountId, friendIds],
    queryFn: async () => {
      const results = await Promise.allSettled(
        friendIds.map((id) => fetchFriendPresence(accessToken!, id)),
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<FriendPresence> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
    enabled: !!accessToken && friendIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const all = useMemo(() => presenceQuery.data ?? [], [presenceQuery.data]);

  const friends = useMemo<FriendPresence[]>(() => {
    let list = all;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.onlineId.toLowerCase().includes(q) ||
          (f.currentlyPlayingTitle ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return (
        new Date(b.lastOnlineAt).getTime() - new Date(a.lastOnlineAt).getTime()
      );
    });
  }, [all, searchQuery]);

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["friends", "ids", accountId] });
    queryClient.invalidateQueries({
      queryKey: ["friends", "presence", accountId],
    });
  }

  return {
    friends,
    onlineFriends: friends.filter((f) => f.isOnline),
    offlineFriends: friends.filter((f) => !f.isOnline),
    totalCount: friendIds.length,
    onlineCount: all.filter((f) => f.isOnline).length,
    isLoading:
      friendIdsQuery.isLoading ||
      (friendIds.length > 0 && presenceQuery.isLoading),
    isError: friendIdsQuery.isError || presenceQuery.isError,
    isFetching: friendIdsQuery.isFetching || presenceQuery.isFetching,
    searchQuery,
    setSearchQuery,
    refetch,
  };
}
