import type { LibraryGame, PlayedGame } from "@/types/psn";
import {
  getRecentlyPlayedGames,
  getUserPlayedGames,
  getUserTitles,
} from "psn-api";
import { buildPsnAuth } from "./psn-auth";

/** Parse ISO 8601 duration "PT228H56M33S" → total minutes (numeric) */
export function parsePlayDurationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  return h * 60 + m;
}

/** Parse ISO 8601 duration "PT228H56M33S" → "228h 56m" */
export function formatPlayDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0m";
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function normalizeCategory(category: string): PlayedGame["platform"] {
  if (category.includes("ps5")) return "ps5";
  if (category.includes("ps4")) return "ps4";
  if (category.includes("ps3")) return "ps3";
  return "unknown";
}

export async function fetchRecentlyPlayed(
  accessToken: string,
  limit = 6,
): Promise<PlayedGame[]> {
  const auth = buildPsnAuth(accessToken);
  const res = await getRecentlyPlayedGames(auth, { limit });
  return ((res as any).titles ?? []).map((t: any) => ({
    titleId: t.titleId ?? "",
    name: t.name ?? t.localizedName ?? "",
    imageUrl: t.imageUrl ?? t.localizedImageUrl ?? "",
    platform: normalizeCategory(t.category ?? ""),
    playCount: t.playCount ?? 0,
    firstPlayedAt: t.firstPlayedDateTime ?? "",
    lastPlayedAt: t.lastPlayedDateTime ?? "",
    playDuration: t.playDuration ?? "PT0S",
  }));
}

/** Normalize a TrophyTitle platform string to our Platform type */
function normalizePlatform(raw: string): LibraryGame["platform"] {
  const s = raw.toLowerCase();
  if (s.includes("ps5")) return "ps5";
  if (s.includes("ps4")) return "ps4";
  if (s.includes("ps3")) return "ps3";
  if (s.includes("vita") || s.includes("psvita")) return "psvita";
  return "unknown";
}

/**
 * Fetch the user's full trophy library ordered by most recently earned trophy.
 * Uses getUserTitles which returns up to 800 titles.
 */
export async function fetchUserLibrary(
  accessToken: string,
  accountId: string,
  limit = 800,
): Promise<LibraryGame[]> {
  const auth = buildPsnAuth(accessToken);
  const res = await getUserTitles(auth, accountId, { limit });
  return (res.trophyTitles ?? []).map((t: any) => ({
    npCommunicationId: t.npCommunicationId ?? "",
    npServiceName: (t.npServiceName ?? "trophy2") as "trophy" | "trophy2",
    name: t.trophyTitleName ?? "",
    imageUrl: t.trophyTitleIconUrl ?? "",
    platform: normalizePlatform(t.trophyTitlePlatform ?? ""),
    progress: t.progress ?? 0,
    earnedTrophies: {
      bronze: t.earnedTrophies?.bronze ?? 0,
      silver: t.earnedTrophies?.silver ?? 0,
      gold: t.earnedTrophies?.gold ?? 0,
      platinum: t.earnedTrophies?.platinum ?? 0,
    },
    definedTrophies: {
      bronze: t.definedTrophies?.bronze ?? 0,
      silver: t.definedTrophies?.silver ?? 0,
      gold: t.definedTrophies?.gold ?? 0,
      platinum: t.definedTrophies?.platinum ?? 0,
    },
    lastTrophyEarnedAt: t.lastUpdatedDateTime ?? "",
  }));
}

/**
 * Fetch full play history with durations for ALL games (paginated).
 * Uses getUserPlayedGames — returns up to 200 per page.
 */
export async function fetchFullPlayHistory(
  accessToken: string,
  accountId: string,
): Promise<PlayedGame[]> {
  const auth = buildPsnAuth(accessToken);
  const allTitles: PlayedGame[] = [];
  let offset = 0;
  const limit = 200;

  while (true) {
    const res = await getUserPlayedGames(auth, accountId, { limit, offset });
    const titles = (res.titles ?? []).map((t: any) => ({
      titleId: t.titleId ?? "",
      name: t.name ?? t.localizedName ?? "",
      imageUrl: t.imageUrl ?? t.localizedImageUrl ?? "",
      platform: normalizeCategory(t.category ?? ""),
      playCount: t.playCount ?? 0,
      firstPlayedAt: t.firstPlayedDateTime ?? "",
      lastPlayedAt: t.lastPlayedDateTime ?? "",
      playDuration: t.playDuration ?? "PT0S",
    }));
    allTitles.push(...titles);
    if (titles.length < limit) break;
    offset += limit;
  }

  return allTitles;
}
