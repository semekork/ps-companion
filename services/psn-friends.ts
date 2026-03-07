import type {
  FriendExtras,
  FriendPresence,
  FriendRecentGame,
} from "@/types/psn";
import {
  getBasicPresence,
  getProfileFromAccountId,
  getUserFriendsAccountIds,
  getUserTitles,
  getUserTrophyProfileSummary,
} from "psn-api";
import { buildPsnAuth } from "./psn-auth";

export async function fetchFriendIds(
  accessToken: string,
  _accountId: string,
): Promise<string[]> {
  const auth = buildPsnAuth(accessToken);
  const res = await getUserFriendsAccountIds(auth, "me", { limit: 500 });
  return res.friends ?? [];
}

export async function fetchFriendPresence(
  accessToken: string,
  accountId: string,
): Promise<FriendPresence> {
  const auth = buildPsnAuth(accessToken);

  const [presenceRes, profileRes] = await Promise.all([
    getBasicPresence(auth, accountId).catch(() => null),
    getProfileFromAccountId(auth, accountId).catch(() => null),
  ]);

  if (!presenceRes && !profileRes) {
    throw new Error(`Could not fetch presence or profile for ${accountId}`);
  }

  // getProfileFromAccountId returns ProfileFromAccountIdResponse directly (no .profile wrapper)
  // avatars use { size, url } shape
  const presence = presenceRes?.basicPresence;
  const avatars = profileRes?.avatars ?? [];
  const avatarUrl = avatars.length > 0 ? avatars[avatars.length - 1].url : "";

  const game = presence?.gameTitleInfoList?.[0];

  return {
    accountId,
    onlineId: profileRes?.onlineId ?? accountId,
    avatarUrl,
    isOnline: presence?.primaryPlatformInfo?.onlineStatus === "online",
    platform: presence?.primaryPlatformInfo?.platform ?? "",
    lastOnlineAt:
      presence?.primaryPlatformInfo?.lastOnlineDate ??
      presence?.lastOnlineDate ??
      new Date().toISOString(),
    currentlyPlayingTitle: game?.titleName,
    currentlyPlayingPlatform: game?.format,
    currentlyPlayingIconUrl: game?.conceptIconUrl ?? game?.npTitleIconUrl,
    aboutMe: profileRes?.aboutMe ?? "",
    isPlus: profileRes?.isPlus ?? false,
  };
}

export async function fetchFriendExtras(
  accessToken: string,
  accountId: string,
): Promise<FriendExtras> {
  const auth = buildPsnAuth(accessToken);

  const [trophyRes, titlesRes] = await Promise.all([
    getUserTrophyProfileSummary(auth, accountId).catch(() => null),
    getUserTitles(auth, accountId, { limit: 8 }).catch(() => null),
  ]);

  const recentGames: FriendRecentGame[] = (titlesRes?.trophyTitles ?? []).map(
    (t: any) => ({
      npCommunicationId: t.npCommunicationId,
      name: t.trophyTitleName,
      iconUrl: t.trophyTitleIconUrl,
      platform: t.trophyTitlePlatform,
      progress: t.progress,
      lastUpdatedAt: t.lastUpdatedDateTime,
    }),
  );

  return {
    trophyLevel: Number(trophyRes?.trophyLevel ?? 0),
    tier: trophyRes?.tier ?? 1,
    levelProgress: trophyRes?.progress ?? 0,
    earnedTrophies: {
      platinum: trophyRes?.earnedTrophies?.platinum ?? 0,
      gold: trophyRes?.earnedTrophies?.gold ?? 0,
      silver: trophyRes?.earnedTrophies?.silver ?? 0,
      bronze: trophyRes?.earnedTrophies?.bronze ?? 0,
    },
    recentGames,
  };
}
