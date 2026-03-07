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
import type { LibraryGame, Platform } from "@/types/psn";

export type SortOption = "recent" | "name" | "progress";

export function useLibrary() {
  const { accessToken, accountId } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");

  // Debounce search input — only filter after the user pauses typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const query = useQuery<LibraryGame[]>({
    queryKey: ["library", accountId],
    queryFn: () => fetchUserLibrary(accessToken!, accountId!),
    enabled: !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const platforms = useMemo<(Platform | "all")[]>(() => {
    if (!query.data) return ["all"];
    const found = new Set(query.data.map((g) => g.platform));
    return ["all", ...Array.from(found).sort()] as (Platform | "all")[];
  }, [query.data]);

  const filtered = useMemo<LibraryGame[]>(() => {
    let list = query.data ?? [];

    if (platformFilter !== "all") {
      list = list.filter((g) => g.platform === platformFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "progress":
        list = [...list].sort((a, b) => b.progress - a.progress);
        break;
      case "recent":
      default: {
        // Pre-compute timestamps once so we don’t construct Date objects inside comparator
        const withTs = list.map((g) => ({
          g,
          ts: new Date(g.lastTrophyEarnedAt).getTime(),
        }));
        withTs.sort((a, b) => b.ts - a.ts);
        list = withTs.map(({ g }) => g);
        break;
      }
    }

    return list;
  }, [query.data, debouncedSearch, sortBy, platformFilter]);

  const togglePlatform = useCallback((p: Platform | "all") => {
    startTransition(() => {
      setPlatformFilter((prev) => (prev === p ? "all" : p));
    });
  }, []);

  const handleSetSortBy = useCallback((s: SortOption) => {
    startTransition(() => setSortBy(s));
  }, []);

  return {
    ...query,
    games: filtered,
    totalCount: query.data?.length ?? 0,
    platforms,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy: handleSetSortBy,
    platformFilter,
    togglePlatform,
  };
}
