import type { LibraryGame, Platform } from "@/types/psn";

// ─── Analytics Data ─────────────────────────────────────────────────────────

export interface OverviewStats {
  totalGames: number;
  totalPlayTimeMinutes: number;
  averageSessionMinutes: number;
  mostPlayedGame: {
    name: string;
    imageUrl: string;
    playTimeMinutes: number;
  } | null;
  /** ISO date of earliest firstPlayedAt */
  gamingSince: string;
}

export interface TrophyInsights {
  /** 0-100 average trophy completion across all games */
  averageCompletion: number;
  platinumCount: number;
  /** Games that define at least one platinum */
  platinumEligibleCount: number;
  /** Games at 100% progress */
  completionistCount: number;
  /** progress > 0 && < 10, last trophy > 6 months ago */
  abandonedCount: number;
  /** Games with progress >= 70 that have an unearned platinum, sorted desc */
  almostPlatinum: LibraryGame[];
}

export interface PlatformStats {
  platform: Platform;
  gameCount: number;
  playTimeMinutes: number;
}

export type MilestoneId =
  | "century-club"
  | "platinum-hunter"
  | "marathon-runner"
  | "perfectionist"
  | "veteran"
  | "platform-loyalist"
  | "multi-platform";

export interface Milestone {
  id: MilestoneId;
  label: string;
  description: string;
  earned: boolean;
  /** SF Symbol name */
  icon: string;
}

export interface AnalyticsData {
  overview: OverviewStats;
  trophyInsights: TrophyInsights;
  platformBreakdown: PlatformStats[];
  /** Top 5 games sorted by play duration */
  topPlayed: {
    name: string;
    imageUrl: string;
    platform: Platform;
    playTimeMinutes: number;
  }[];
  milestones: Milestone[];
}