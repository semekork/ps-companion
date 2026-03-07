import { useQuery } from "@tanstack/react-query";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import { fetchUserLibrary } from "@/services/psn-games";
import type { LibraryGame } from "@/types/psn";

export type TrophySort = "recent" | "progress" | "platinum" | "most-won";
export type TrophyFilter = "all" | "platinum" | "incomplete" | "complete";

export function useTrophyTracker() {
  const { accessToken, accountId } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<TrophySort>("most-won");
  const [filter, setFilter] = useState<TrophyFilter>("all");

  // Debounce search 200 ms
  useEffect(() => {
    const t = setTimeout(
      () => startTransition(() => setDebouncedSearch(searchQuery)),
      200,
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Shares the same cache key as the library screen — zero extra requests
  const query = useQuery<LibraryGame[]>({
    queryKey: ["library", accountId],
    queryFn: () => fetchUserLibrary(accessToken!, accountId!),
    enabled: !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 5,
  });

  const games = useMemo<LibraryGame[]>(() => {
    const all = query.data ?? [];

    // 1. Filter
    let filtered = all;
    if (filter === "platinum") {
      filtered = all.filter((g) => (g.earnedTrophies.platinum ?? 0) > 0);
    } else if (filter === "incomplete") {
      filtered = all.filter((g) => g.progress > 0 && g.progress < 100);
    } else if (filter === "complete") {
      filtered = all.filter((g) => g.progress === 100);
    }

    // 2. Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(q));
    }

    // 3. Sort
    const totalEarned = (g: LibraryGame) =>
      g.earnedTrophies.bronze +
      g.earnedTrophies.silver +
      g.earnedTrophies.gold +
      g.earnedTrophies.platinum;

    return [...filtered].sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "most-won") return totalEarned(b) - totalEarned(a);
      if (sortBy === "platinum") {
        const aPlt = a.earnedTrophies.platinum > 0 ? 1 : 0;
        const bPlt = b.earnedTrophies.platinum > 0 ? 1 : 0;
        if (aPlt !== bPlt) return bPlt - aPlt;
        // Tie-break by most recent
        return (
          new Date(b.lastTrophyEarnedAt).getTime() -
          new Date(a.lastTrophyEarnedAt).getTime()
        );
      }
      // "recent" — default ordering from API (already sorted by lastUpdatedDateTime)
      return (
        new Date(b.lastTrophyEarnedAt).getTime() -
        new Date(a.lastTrophyEarnedAt).getTime()
      );
    });
  }, [query.data, filter, debouncedSearch, sortBy]);

  const handleSearch = useCallback((text: string) => setSearchQuery(text), []);
  const handleSort = useCallback((s: TrophySort) => setSortBy(s), []);
  const handleFilter = useCallback((f: TrophyFilter) => setFilter(f), []);

  return {
    ...query,
    games,
    searchQuery,
    sortBy,
    filter,
    totalCount: query.data?.length ?? 0,
    onSearch: handleSearch,
    onSort: handleSort,
    onFilter: handleFilter,
  };
}
