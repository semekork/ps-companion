import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { fetchFriendIds, fetchFriendPresence } from "@/services/psn-friends";
import { fetchFriendTrophies } from "@/services/psn-trophies";

export function useFriendComparison(titleId: string, service: "trophy" | "trophy2") {
  const { accessToken, accountId } = useAuth();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // 1. Fetch friend IDs
  const friendsListQuery = useQuery({
    queryKey: ["friendIds", accountId],
    queryFn: () => fetchFriendIds(accessToken!, accountId!),
    enabled: !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  // 2. Fetch presence/profiles for those friends (batching is better, but psn-api is 1-by-1 for presence usually)
  // For the demo/prototype, let's just fetch the first 10 friends to avoid overwhelming the API
  const friendMetadataQuery = useQuery({
    queryKey: ["friendMetadata", accountId, friendsListQuery.data?.slice(0, 15)],
    queryFn: async () => {
      const ids = friendsListQuery.data?.slice(0, 15) ?? [];
      const results = await Promise.allSettled(
        ids.map((id) => fetchFriendPresence(accessToken!, id))
      );
      return results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<any>).value);
    },
    enabled: !!friendsListQuery.data,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  // 3. Fetch specific friend's trophies for this title IF one is selected
  const friendTrophyQuery = useQuery({
    queryKey: ["friendTrophiesForTitle", titleId, selectedFriendId],
    queryFn: () => fetchFriendTrophies(accessToken!, selectedFriendId!, titleId, service),
    enabled: !!accessToken && !!selectedFriendId && !!titleId,
    staleTime: 1000 * 60 * 10, // 10 mins
  });

  return {
    friendMetadata: friendMetadataQuery.data ?? [],
    isMetadataLoading: friendMetadataQuery.isLoading,
    selectedFriendId,
    setSelectedFriendId,
    friendTrophyMap: friendTrophyQuery.data,
    isFriendTrophyLoading: friendTrophyQuery.isFetching, // use isFetching so loading shows when switching friends
  };
}
