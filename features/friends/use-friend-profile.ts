import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import { useAuth } from "@/hooks/use-auth";
import { fetchFriendExtras, fetchFriendPresence } from "@/services/psn-friends";

export function useFriendProfile() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["friend", "profile", accountId],
    queryFn: () => fetchFriendPresence(accessToken!, accountId),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 2, // 2 min
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useFriendExtras() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["friend", "extras", accountId],
    queryFn: () => fetchFriendExtras(accessToken!, accountId),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 5,
  });
}
