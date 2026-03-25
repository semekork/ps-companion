import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

export type BacklogStatus = "None" | "Playing" | "Backlog" | "Completed" | "Abandoned";

interface BacklogContextValue {
  tags: Record<string, BacklogStatus>;
  setTag: (titleId: string, status: BacklogStatus) => void;
  isLoading: boolean;
}

const BacklogContext = createContext<BacklogContextValue | null>(null);

const STORE_KEY = "ps_companion_backlog_tags";

export function BacklogProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<Record<string, BacklogStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored) {
          setTags(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load backlog tags", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const setTag = async (titleId: string, status: BacklogStatus) => {
    const newTags = { ...tags };
    if (status === "None") {
      delete newTags[titleId];
    } else {
      newTags[titleId] = status;
    }
    setTags(newTags);
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(newTags));
    } catch (e) {
      console.error("Failed to save backlog tags", e);
    }
  };

  return (
    <BacklogContext.Provider value={{ tags, setTag, isLoading }}>
      {children}
    </BacklogContext.Provider>
  );
}

export function useBacklog() {
  const ctx = useContext(BacklogContext);
  if (!ctx) throw new Error("useBacklog must be used within BacklogProvider");
  return ctx;
}
