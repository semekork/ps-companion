import { useAuth } from "@/context/auth-context";
import { searchUsers } from "@/services/psn-profile";
import type { SocialAccountResult } from "psn-api";
import { useCallback, useState } from "react";

export function useSearch() {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialAccountResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!accessToken || !searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const users = await searchUsers(accessToken, searchQuery);
        setResults(users);
      } catch (err: any) {
        setError(err.message || "Failed to search for users");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
  );

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    handleSearch,
  };
}
