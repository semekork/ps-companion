import type { GameTrophy, TrophySummary } from "@/types/psn";
import {
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
  getUserTrophyProfileSummary,
} from "psn-api";
import { buildPsnAuth } from "./psn-auth";

export async function fetchTrophySummary(
  accessToken: string,
  accountId: string,
): Promise<TrophySummary> {
  const auth = buildPsnAuth(accessToken);
  const res = await getUserTrophyProfileSummary(auth, accountId);

  return {
    accountId,
    trophyLevel: Number(res.trophyLevel) ?? 0,
    progress: res.progress ?? 0,
    tier: res.tier ?? 1,
    earnedTrophies: {
      bronze: res.earnedTrophies?.bronze ?? 0,
      silver: res.earnedTrophies?.silver ?? 0,
      gold: res.earnedTrophies?.gold ?? 0,
      platinum: res.earnedTrophies?.platinum ?? 0,
    },
  };
}

/**
 * Fetch the full merged trophy list for a specific game — title metadata
 * (name, icon, type) joined with the user's earned status and date.
 *
 * PS3 / PS4 / Vita titles require npServiceName = "trophy".
 * PS5 titles use npServiceName = "trophy2" (default).
 */
export async function fetchGameTrophies(
  accessToken: string,
  accountId: string,
  npCommunicationId: string,
  npServiceName: "trophy" | "trophy2",
): Promise<GameTrophy[]> {
  const auth = buildPsnAuth(accessToken);
  const serviceOpt =
    npServiceName === "trophy" ? { npServiceName: "trophy" as const } : {};

  const [titleRes, earnedRes] = await Promise.all([
    getTitleTrophies(auth, npCommunicationId, "all", serviceOpt),
    getUserTrophiesEarnedForTitle(
      auth,
      accountId,
      npCommunicationId,
      "all",
      serviceOpt,
    ),
  ]);

  // Build a lookup of earned status by trophyId
  const earnedMap = new Map<number, { earned: boolean; earnedAt?: string }>();
  for (const t of earnedRes.trophies ?? []) {
    earnedMap.set(t.trophyId, {
      earned: t.earned ?? false,
      earnedAt: t.earnedDateTime,
    });
  }

  return (titleRes.trophies ?? []).map((t: any) => {
    const earned = earnedMap.get(t.trophyId) ?? { earned: false };
    return {
      trophyId: t.trophyId,
      name:
        t.trophyHidden && !earned.earned
          ? "Hidden Trophy"
          : (t.trophyName ?? ""),
      detail:
        t.trophyHidden && !earned.earned
          ? "Earn to reveal"
          : (t.trophyDetail ?? ""),
      iconUrl: t.trophyHidden && !earned.earned ? "" : (t.trophyIconUrl ?? ""),
      type:
        t.trophyHidden && !earned.earned
          ? "hidden"
          : (t.trophyType ?? "bronze"),
      earned: earned.earned,
      earnedAt: earned.earnedAt,
      rarity: t.trophyEarnedRate,
    } satisfies GameTrophy;
  });
}
