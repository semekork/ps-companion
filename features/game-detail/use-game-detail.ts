import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import { useAuth } from "@/context/auth-context";
import { fetchGameTrophies } from "@/services/psn-trophies";
import type { GameTrophy } from "@/types/psn";

/** Read route params and fetch full trophy list for the game. */
export function useGameDetail() {
  const { accessToken, accountId } = useAuth();

  // expo-router generic type must extend Record<string, string | string[]>
  const params = useLocalSearchParams<Record<string, string>>();

  const titleId = params.titleId ?? "";
  const service = (params.service ?? "trophy2") as "trophy" | "trophy2";
  const { name, imageUrl, platform, progress } = params;

  const trophyQuery = useQuery<GameTrophy[]>({
    queryKey: ["gameTrophies", titleId, service, accountId],
    queryFn: () =>
      fetchGameTrophies(accessToken!, accountId!, titleId, service),
    enabled: !!accessToken && !!accountId && !!titleId,
    staleTime: 1000 * 60 * 10, // 10 min
  });

  // Compute summary counts from trophy list
  const earned = trophyQuery.data ?? [];
  const earnedCounts = earned.reduce(
    (acc, t) => {
      if (t.earned)
        acc[t.type as keyof typeof acc] =
          (acc[t.type as keyof typeof acc] ?? 0) + 1;
      return acc;
    },
    { platinum: 0, gold: 0, silver: 0, bronze: 0, hidden: 0 },
  );
  const total = earned.length;
  const earnedTotal = earned.filter((t) => t.earned).length;

  return {
    ...trophyQuery,
    trophies: earned,
    titleId,
    // Metadata passed via route params (instant display, no extra fetch)
    meta: {
      name: name ?? "",
      imageUrl: imageUrl ?? "",
      platform: platform ?? "",
      progress: Number(progress ?? 0),
    },
    earnedCounts,
    earnedTotal,
    total,
  };
}
