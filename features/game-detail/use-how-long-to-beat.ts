import { useQuery } from "@tanstack/react-query";

export interface HLTBData {
  mainStory: number;
  mainExtra: number;
  completionist: number;
}

/**
 * Mocked HowLongToBeat hook for demonstration.
 * In a production app, you would proxy requests to howlongtobeat.com via a small
 * Node.js backend to bypass CORS and avoid rate limiting.
 */
export function useHowLongToBeat(gameName: string) {
  return useQuery<HLTBData>({
    queryKey: ["hltb", gameName],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (!gameName) {
        return { mainStory: 0, mainExtra: 0, completionist: 0 };
      }

      // Generate stable but distinct realistic hour estimates based on the game name
      let hash = 0;
      for (let i = 0; i < gameName.length; i++) {
        hash = gameName.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const baseHours = Math.abs(hash % 40) + 5; // 5 to 45 hours
      
      // Some known games overrides to show how cool it looks
      if (gameName.toLowerCase().includes("persona")) return { mainStory: 80, mainExtra: 100, completionist: 130 };
      if (gameName.toLowerCase().includes("witcher")) return { mainStory: 50, mainExtra: 100, completionist: 170 };
      if (gameName.toLowerCase().includes("astro")) return { mainStory: 10, mainExtra: 15, completionist: 20 };
      if (gameName.toLowerCase().includes("spider-man")) return { mainStory: 15, mainExtra: 25, completionist: 35 };

      return {
        mainStory: baseHours,
        mainExtra: Math.floor(baseHours * 1.5),
        completionist: Math.floor(baseHours * 2.2),
      };
    },
    enabled: !!gameName,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
