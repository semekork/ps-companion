import { parsePlayDurationMinutes } from "@/services/psn-games";
import type { LibraryGame, PlayedGame, TrophySummary } from "@/types/psn";

import type { AnalyticsData, Milestone, PlatformStats } from "./analytics-types";

// ─── Main computation (pure, no React) ──────────────────────────────────────

export function computeAnalytics(
  library: LibraryGame[],
  playHistory: PlayedGame[],
  trophySummary: TrophySummary | null,
): AnalyticsData {
  return {
    overview: computeOverview(playHistory),
    trophyInsights: computeTrophyInsights(library),
    platformBreakdown: computePlatformBreakdown(library, playHistory),
    topPlayed: computeTopPlayed(playHistory),
    milestones: computeMilestones(library, playHistory, trophySummary),
  };
}

// ─── Section A: Gaming Overview ─────────────────────────────────────────────

function computeOverview(playHistory: PlayedGame[]): AnalyticsData["overview"] {
  if (playHistory.length === 0) {
    return {
      totalGames: 0,
      totalPlayTimeMinutes: 0,
      averageSessionMinutes: 0,
      mostPlayedGame: null,
      gamingSince: "",
    };
  }

  let totalMinutes = 0;
  let totalPlayCount = 0;
  let maxMinutes = 0;
  let mostPlayed: PlayedGame | null = null;
  let earliest = playHistory[0].firstPlayedAt;

  for (const game of playHistory) {
    const mins = parsePlayDurationMinutes(game.playDuration);
    totalMinutes += mins;
    totalPlayCount += game.playCount;

    if (mins > maxMinutes) {
      maxMinutes = mins;
      mostPlayed = game;
    }

    if (game.firstPlayedAt && game.firstPlayedAt < earliest) {
      earliest = game.firstPlayedAt;
    }
  }

  return {
    totalGames: playHistory.length,
    totalPlayTimeMinutes: totalMinutes,
    averageSessionMinutes:
      totalPlayCount > 0 ? Math.round(totalMinutes / totalPlayCount) : 0,
    mostPlayedGame: mostPlayed
      ? {
          name: mostPlayed.name,
          imageUrl: mostPlayed.imageUrl,
          playTimeMinutes: maxMinutes,
        }
      : null,
    gamingSince: earliest,
  };
}

// ─── Section B: Trophy Insights ─────────────────────────────────────────────

function computeTrophyInsights(
  library: LibraryGame[],
): AnalyticsData["trophyInsights"] {
  if (library.length === 0) {
    return {
      averageCompletion: 0,
      platinumCount: 0,
      platinumEligibleCount: 0,
      completionistCount: 0,
      abandonedCount: 0,
      almostPlatinum: [],
    };
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoIso = sixMonthsAgo.toISOString();

  let totalProgress = 0;
  let platinumCount = 0;
  let platinumEligibleCount = 0;
  let completionistCount = 0;
  let abandonedCount = 0;
  const almostPlatinum: LibraryGame[] = [];

  for (const game of library) {
    totalProgress += game.progress;

    const hasPlatinumDefined = game.definedTrophies.platinum > 0;
    if (hasPlatinumDefined) platinumEligibleCount++;
    if (game.earnedTrophies.platinum > 0) platinumCount++;
    if (game.progress === 100) completionistCount++;

    if (
      game.progress > 0 &&
      game.progress < 10 &&
      game.lastTrophyEarnedAt < sixMonthsAgoIso
    ) {
      abandonedCount++;
    }

    if (
      game.progress >= 70 &&
      game.progress < 100 &&
      hasPlatinumDefined &&
      game.earnedTrophies.platinum === 0
    ) {
      almostPlatinum.push(game);
    }
  }

  almostPlatinum.sort((a, b) => b.progress - a.progress);

  return {
    averageCompletion: Math.round(totalProgress / library.length),
    platinumCount,
    platinumEligibleCount,
    completionistCount,
    abandonedCount,
    almostPlatinum: almostPlatinum.slice(0, 5),
  };
}

// ─── Section D: Platform Breakdown ──────────────────────────────────────────

function computePlatformBreakdown(
  library: LibraryGame[],
  playHistory: PlayedGame[],
): PlatformStats[] {
  const map = new Map<
    string,
    { gameCount: number; playTimeMinutes: number }
  >();

  for (const game of library) {
    const entry = map.get(game.platform) ?? { gameCount: 0, playTimeMinutes: 0 };
    entry.gameCount++;
    map.set(game.platform, entry);
  }

  // Overlay play time from play history
  for (const game of playHistory) {
    const entry = map.get(game.platform);
    if (entry) {
      entry.playTimeMinutes += parsePlayDurationMinutes(game.playDuration);
    }
  }

  return Array.from(map.entries())
    .map(([platform, stats]) => ({
      platform: platform as PlatformStats["platform"],
      ...stats,
    }))
    .sort((a, b) => b.gameCount - a.gameCount);
}

// ─── Section E: Top Played ──────────────────────────────────────────────────

function computeTopPlayed(
  playHistory: PlayedGame[],
): AnalyticsData["topPlayed"] {
  return playHistory
    .map((g) => ({
      name: g.name,
      imageUrl: g.imageUrl,
      platform: g.platform,
      playTimeMinutes: parsePlayDurationMinutes(g.playDuration),
    }))
    .sort((a, b) => b.playTimeMinutes - a.playTimeMinutes)
    .slice(0, 5);
}

// ─── Section F: Milestones ──────────────────────────────────────────────────

function computeMilestones(
  library: LibraryGame[],
  playHistory: PlayedGame[],
  trophySummary: TrophySummary | null,
): Milestone[] {
  const totalGames = Math.max(library.length, playHistory.length);

  let totalMinutes = 0;
  let earliest = "";
  for (const g of playHistory) {
    totalMinutes += parsePlayDurationMinutes(g.playDuration);
    if (!earliest || (g.firstPlayedAt && g.firstPlayedAt < earliest)) {
      earliest = g.firstPlayedAt;
    }
  }
  const totalHours = totalMinutes / 60;
  const gamingSinceYear = earliest ? new Date(earliest).getFullYear() : 9999;

  const platinumCount = trophySummary?.earnedTrophies.platinum ?? 0;
  const completionistCount = library.filter((g) => g.progress === 100).length;

  const platformCounts = new Map<string, number>();
  for (const g of library) {
    platformCounts.set(g.platform, (platformCounts.get(g.platform) ?? 0) + 1);
  }
  const maxPlatformCount = Math.max(0, ...platformCounts.values());
  const platformRatio = totalGames > 0 ? maxPlatformCount / totalGames : 0;
  const uniquePlatforms = platformCounts.size;

  return [
    {
      id: "century-club",
      label: "Century Club",
      description: "Play 100+ games",
      earned: totalGames >= 100,
      icon: "star.fill",
    },
    {
      id: "platinum-hunter",
      label: "Platinum Hunter",
      description: "Earn 10+ platinums",
      earned: platinumCount >= 10,
      icon: "trophy.fill",
    },
    {
      id: "marathon-runner",
      label: "Marathon Runner",
      description: "1,000+ hours played",
      earned: totalHours >= 1000,
      icon: "flame.fill",
    },
    {
      id: "perfectionist",
      label: "Perfectionist",
      description: "100% complete 10+ games",
      earned: completionistCount >= 10,
      icon: "checkmark.seal.fill",
    },
    {
      id: "veteran",
      label: "PS Veteran",
      description: "Gaming since before 2016",
      earned: gamingSinceYear < 2016,
      icon: "shield.fill",
    },
    {
      id: "platform-loyalist",
      label: "Platform Loyalist",
      description: "90%+ games on one platform",
      earned: platformRatio >= 0.9,
      icon: "gamecontroller.fill",
    },
    {
      id: "multi-platform",
      label: "Multi-Platform",
      description: "Play on 4+ platforms",
      earned: uniquePlatforms >= 4,
      icon: "square.grid.2x2.fill",
    },
  ];
}