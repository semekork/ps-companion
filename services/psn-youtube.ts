import { XMLParser } from "fast-xml-parser";

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export async function fetchPlayStationVideos(): Promise<YouTubeVideo[]> {
  try {
    // PlayStation Official Channel ID: UC-2Y8dQb0S6DtpxNgAKoJKA
    const res = await fetch(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC-2Y8dQb0S6DtpxNgAKoJKA",
    );
    if (!res.ok) throw new Error("Failed to fetch YouTube RSS");

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xml);

    const entries = jsonObj.feed?.entry || [];
    const videos = Array.isArray(entries) ? entries : [entries];

    return videos.map((entry: any) => {
      const videoId = entry["yt:videoId"];
      return {
        id: videoId,
        title: entry.title,
        url:
          entry.link?.["@_href"] ||
          `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, // Try maxres
        publishedAt: entry.published,
      };
    });
  } catch (error) {
    console.error("fetchPlayStationVideos error:", error);
    return [];
  }
}
