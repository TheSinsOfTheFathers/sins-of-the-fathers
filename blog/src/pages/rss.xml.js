import rss from "@astrojs/rss";
import { sanityClient } from "sanity:client";

export async function GET(context) {
  // 1. Fetch posts from Sanity
  const posts = await sanityClient.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      title,
      slug,
      publishedAt,
      excerpt,
      authorName
    }
  `);

  // 2. Generate the RSS Feed
  return rss({
    // XML Namespaces - Required for Author (DC) and Atom self-link
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      dc: "http://purl.org/dc/elements/1.1/",
    },

    title: "Sins of the Fathers | Intelligence Hub",
    description:
      "Declassified documents, operational logs, and transmissions from the depths of the psyche.",
    site: context.site,

    // Channel-level metadata (Language and Self Link)
    customData: `
      <language>en</language>
      <atom:link href="${new URL("rss.xml", context.site).href}" rel="self" type="application/rss+xml" />
    `,

    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.excerpt,
      link: `/post/${post.slug.current}/`,

      // Using 'dc:creator' to show the author's name without requiring an email address
      customData: `<dc:creator>${post.authorName || "Unknown Agent"}</dc:creator>`,
    })),
  });
}