// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
  tokenType: string;
  scope: string;
  idToken: string; // JWT — contains `sub` claim = accountId
  refreshTokenExpiresIn?: number;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  /** ISO timestamp of when the access token expires */
  accessTokenExpiresAt: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface PsnProfile {
  accountId: string;
  onlineId: string;
  avatarUrl: string;
  aboutMe: string;
  isPsPlus: boolean;
  primaryOnlineStatus: "online" | "offline";
}

// ─── Trophy ──────────────────────────────────────────────────────────────────

export type TrophyGrade = "bronze" | "silver" | "gold" | "platinum";

export interface EarnedTrophyCounts {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export interface TrophySummary {
  accountId: string;
  trophyLevel: number;
  progress: number; // 0–100 % to next level
  tier: number; // 1–10
  earnedTrophies: EarnedTrophyCounts;
}

// ─── Games ───────────────────────────────────────────────────────────────────

export type Platform = "ps5" | "ps4" | "ps3" | "psvita" | "unknown";

export interface PlayedGame {
  titleId: string;
  name: string;
  imageUrl: string;
  platform: Platform;
  playCount: number;
  firstPlayedAt: string; // ISO 8601
  lastPlayedAt: string; // ISO 8601
  /** ISO 8601 duration string, e.g. "PT228H56M33S" */
  playDuration: string;
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface FriendPresence {
  accountId: string;
  onlineId: string;
  avatarUrl: string;
  isOnline: boolean;
  platform: string;
  lastOnlineAt: string; // ISO 8601
  currentlyPlayingTitle?: string;
  currentlyPlayingPlatform?: string;
  currentlyPlayingIconUrl?: string;
  aboutMe?: string;
  isPlus?: boolean;
}

export interface FriendRecentGame {
  npCommunicationId: string;
  name: string;
  iconUrl: string;
  platform: string;
  progress: number;
  lastUpdatedAt: string;
}

export interface FriendExtras {
  trophyLevel: number;
  tier: number;
  levelProgress: number;
  earnedTrophies: EarnedTrophyCounts;
  recentGames: FriendRecentGame[];
}

// ─── News ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string; // ISO 8601
  category: string;
}

// ─── Library ─────────────────────────────────────────────────────────────────

export interface LibraryGame {
  /** npCommunicationId — used for trophy API calls and as nav param */
  npCommunicationId: string;
  /** "trophy" for PS3/PS4/Vita, "trophy2" for PS5 */
  npServiceName: "trophy" | "trophy2";
  name: string;
  imageUrl: string;
  platform: Platform;
  /** 0-100 percentage of trophies earned */
  progress: number;
  earnedTrophies: EarnedTrophyCounts;
  definedTrophies: EarnedTrophyCounts;
  /** ISO 8601 – date of most recent trophy earned */
  lastTrophyEarnedAt: string;
}

// ─── Game trophies ────────────────────────────────────────────────────────────

export interface GameTrophy {
  trophyId: number;
  name: string;
  detail: string;
  iconUrl: string;
  type: TrophyGrade | "hidden";
  earned: boolean;
  earnedAt?: string; // ISO 8601
  /** Percentage of players who have earned this (string from API, e.g. "25.5") */
  rarity?: string;
}
