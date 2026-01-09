import rss from "@astrojs/rss";
import { sanityClient } from "sanity:client";

export async function GET(context) {
  // 1. Sanity'den postları çek
  const posts = await sanityClient.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      title,
      slug,
      publishedAt,
      excerpt,
      authorName
    }
  `);

  // 2. RSS Feed'i oluştur
  return rss({
    // XML İsim Alanları (Namespaces) - Yazar adı ve Atom linki için gerekli
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      dc: "http://purl.org/dc/elements/1.1/",
    },

    title: "Sins of the Fathers | Blog",
    description:
      "Gizliliği kaldırılmış belgeler, operasyon notları ve evrenin derinlikleri.",
    site: context.site,

    // Kanal seviyesinde ek veriler (Dil ve Self Link)
    // Not: context.site sonunda / olabilir veya olmayabilir, onu garantiye alıyoruz.
    customData: `
      <language>tr</language>
      <atom:link href="${new URL("rss.xml", context.site).href}" rel="self" type="application/rss+xml" />
    `,

    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.excerpt,
      link: `/post/${post.slug.current}/`,

      // ÖNEMLİ DEĞİŞİKLİK: 'author' yerine 'customData' içinde 'dc:creator' kullanıyoruz.
      // Bu sayede e-posta zorunluluğunu aşıp sadece isim gösterebiliyoruz.
      customData: `<dc:creator>${post.authorName || "Bilinmeyen Yazar"}</dc:creator>`,
    })),
  });
}
