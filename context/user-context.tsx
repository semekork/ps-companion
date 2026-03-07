import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext } from "react";

import { useAuth } from "@/context/auth-context";
import { fetchProfile } from "@/services/psn-profile";
import { fetchTrophySummary } from "@/services/psn-trophies";
import type { PsnProfile, TrophySummary } from "@/types/psn";

// ─── Context ─────────────────────────────────────────────────────────────────

interface UserContextValue {
  profile: PsnProfile | null;
  trophySummary: TrophySummary | null;
  isLoadingProfile: boolean;
  isLoadingTrophies: boolean;
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  trophySummary: null,
  isLoadingProfile: false,
  isLoadingTrophies: false,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, accountId, isAuthenticated } = useAuth();

  const { data: profile = null, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user", "profile", accountId],
    queryFn: () => fetchProfile(accessToken!, accountId!),
    enabled: isAuthenticated && !!accessToken && !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: trophySummary = null, isLoading: isLoadingTrophies } = useQuery(
    {
      queryKey: ["user", "trophySummary", accountId],
      queryFn: () => fetchTrophySummary(accessToken!, accountId!),
      enabled: isAuthenticated && !!accessToken && !!accountId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  return (
    <UserContext.Provider
      value={{ profile, trophySummary, isLoadingProfile, isLoadingTrophies }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUser() {
  return useContext(UserContext);
}
