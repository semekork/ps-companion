import type { BlogPost } from "@/types/psn";
import { XMLParser } from "fast-xml-parser";

const RSS_URL = "https://blog.playstation.com/feed/";
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function extractThumbnail(item: any): string {
  // 1. Standard media namespace elements
  const mc = item["media:content"];
  if (mc) {
    if (Array.isArray(mc)) return mc[0]["@_url"] ?? "";
    return mc["@_url"] ?? "";
  }
  const mt = item["media:thumbnail"];
  if (mt) return mt["@_url"] ?? "";
  const enc = item.enclosure;
  if (enc) return enc["@_url"] ?? "";

  // 2. PS Blog embeds images inside content:encoded HTML — grab the first <img src>
  // fast-xml-parser preserves namespace keys as-is; CDATA may come back as object
  const rawEncoded = item["content:encoded"] ?? item["content"] ?? "";
  const html: string =
    typeof rawEncoded === "string"
      ? rawEncoded
      : (rawEncoded?.["#text"] ?? rawEncoded?.["__cdata"] ?? "");
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1] && !match[1].includes("placeholder")) return match[1];
    // Also try data-src (lazy-loaded images)
    const lazy = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
    if (lazy?.[1]) return lazy[1];
  }

  return "";
}

function extractCategory(item: any): string {
  const cat = item.category;
  if (!cat) return "PlayStation";
  if (Array.isArray(cat)) return cat[0] ?? "PlayStation";
  return cat;
}

export async function fetchBlogPosts(page = 1): Promise<BlogPost[]> {
  const url = page > 1 ? `${RSS_URL}?paged=${page}` : RSS_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const data = parser.parse(xml);
  const items: any[] = data?.rss?.channel?.item ?? [];

  return items.map((item, i) => ({
    id: item.guid?.["#text"] ?? item.guid ?? `${page}-${i}`,
    title: item.title ?? "",
    url: item.link ?? "",
    thumbnailUrl: extractThumbnail(item),
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : "",
    category: extractCategory(item),
  }));
}
