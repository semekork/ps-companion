import type { PsnProfile } from "@/types/psn";
import { getProfileFromAccountId } from "psn-api";
import { buildPsnAuth } from "./psn-auth";

export async function fetchProfile(
  accessToken: string,
  accountId: string,
): Promise<PsnProfile> {
  const auth = buildPsnAuth(accessToken);
  const p = await getProfileFromAccountId(auth, accountId);

  const avatarUrl =
    p.avatars && p.avatars.length > 0
      ? p.avatars[p.avatars.length - 1].url
      : "";

  return {
    accountId,
    onlineId: p.onlineId ?? "",
    avatarUrl,
    aboutMe: p.aboutMe ?? "",
    isPsPlus: p.isPlus ?? false,
    primaryOnlineStatus: "offline" as const,
  };
}
