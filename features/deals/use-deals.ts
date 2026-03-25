import { useQuery } from "@tanstack/react-query";

export interface Deal {
  id: string;
  title: string;
  imageUrl: string;
  originalPrice: string;
  salePrice: string;
  discount: string;
  endDate: string;
  platform: "PS4" | "PS5" | "Both";
}

export function useDeals() {
  return useQuery<Deal[]>({
    queryKey: ["psnDeals"],
    queryFn: async () => {
      // simulate delay
      await new Promise(r => setTimeout(r, 800));
      
      return [
        {
          id: "1",
          title: "The Last of Us Part II Remastered",
          imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202311/1717/991da36398b0f85f3de4d0cc0a12e84d436cf4af1d1fb86f.png",
          originalPrice: "$49.99",
          salePrice: "$39.99",
          discount: "-20%",
          endDate: "Ends 04/02/2026",
          platform: "PS5"
        },
        {
          id: "2",
          title: "Elden Ring",
          imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/a799SHUzaoZjD3sUf8SIdYUr.png",
          originalPrice: "$59.99",
          salePrice: "$41.99",
          discount: "-30%",
          endDate: "Ends 04/05/2026",
          platform: "Both"
        },
        {
          id: "3",
          title: "God of War Ragnarök",
          imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/67Oq8O76C29U2D9b0e257B.png",
          originalPrice: "$69.99",
          salePrice: "$34.99",
          discount: "-50%",
          endDate: "Ends 03/30/2026",
          platform: "Both"
        },
        {
          id: "4",
          title: "Ghost of Tsushima: Director's Cut",
          imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202106/2322/6dbf7a1b4d06a74b010f36f6d6.png",
          originalPrice: "$69.99",
          salePrice: "$29.39",
          discount: "-58%",
          endDate: "Ends 04/10/2026",
          platform: "Both"
        },
        {
          id: "5",
          title: "Cyberpunk 2077: Ultimate Edition",
          imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202311/2810/6dbf7a1b4d06a74b010f36f6d6.png",
          originalPrice: "$79.99",
          salePrice: "$53.59",
          discount: "-33%",
          endDate: "Ends 04/15/2026",
          platform: "PS5"
        }
      ];
    },
    staleTime: 1000 * 60 * 60,
  });
}
