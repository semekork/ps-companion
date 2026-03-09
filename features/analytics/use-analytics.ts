import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useUser } from "@/context/user-context";
import { fetchFullPlayHistory, fetchUserLibrary } from "@/services/psn-games";

import { computeAnalytics } from "./compute-analytics";

export function useAnalytics() {
  const { accessToken, accountId } = useAuth();
  const { trophySummary } = useUser();

  const libraryQuery = useQuery({
    queryKey: ["library", accountId],
    queryFn: () => fetchUserLibrary(accessToken!, accountId!),
    enabled: !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 5,
  });

  const playHistoryQuery = useQuery({
    queryKey: ["analytics", "playHistory", accountId],
    queryFn: () => fetchFullPlayHistory(accessToken!, accountId!),
    enabled: !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 15, // 15 min — heavy data, changes slowly
  });

  const analytics = useMemo(
    () =>
      computeAnalytics(
        libraryQuery.data ?? [],
        playHistoryQuery.data ?? [],
        trophySummary,
      ),
    [libraryQuery.data, playHistoryQuery.data, trophySummary],
  );

  return {
    analytics,
    isLoading: libraryQuery.isLoading || playHistoryQuery.isLoading,
    isLibraryLoaded: !!libraryQuery.data,
    isPlayHistoryLoaded: !!playHistoryQuery.data,
    error: libraryQuery.error ?? playHistoryQuery.error,
    refetch: () => {
      libraryQuery.refetch();
      playHistoryQuery.refetch();
    },
  };
}