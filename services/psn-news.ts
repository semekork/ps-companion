import type { BlogPost } from "@/types/psn";

const WP_API_URL = "https://blog.playstation.com/wp-json/wp/v2/posts";

function decodeHTMLEntities(text: string): string {
  if (!text) return "";
  const entities: Record<string, string> = {
    "&#8217;": "'",
    "&#8216;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8211;": "-",
    "&#8212;": "—",
    "&#038;": "&",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#160;": " ",
  };
  return text.replace(/&#?\w+;/g, (match) => entities[match] || match);
}

export async function fetchBlogPosts(page = 1): Promise<BlogPost[]> {
  const url = `${WP_API_URL}?page=${page}&per_page=10&_embed=1`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`WP API fetch failed: ${res.status}`);

  const posts: any[] = await res.json();

  return posts.map((post) => {
    // Extract thumbnail from embedded media
    const media = post._embedded?.["wp:featuredmedia"]?.[0];
    const thumbnailUrl = media?.source_url ?? "";

    // Extract category from embedded terms
    const terms = post._embedded?.["wp:term"]?.[0] ?? [];
    const category = terms.length > 0 ? terms[0].name : "PlayStation";

    return {
      id: String(post.id),
      title: decodeHTMLEntities(post.title?.rendered ?? ""),
      url: post.link ?? "",
      thumbnailUrl,
      publishedAt: post.date_gmt
        ? new Date(post.date_gmt + "Z").toISOString()
        : "",
      category,
    };
  });
}
