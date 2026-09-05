// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://hushed-haven-stays.lovable.app"

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

// Journal slugs + publish dates are read straight from the content source so
// new articles are picked up automatically.
function journalPosts(): { slug: string; date: string }[] {
  const src = readFileSync(resolve("src/data/journal.ts"), "utf8")
  const body = src.slice(src.indexOf("journalArticles"))
  const slugs = [...body.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
  const dates = [...body.matchAll(/date:\s*"([^"]+)"/g)].map((m) => m[1])
  return slugs.map((slug, i) => ({ slug, date: dates[i] }))
}

const posts = journalPosts()
const latestPost = posts
  .map((p) => p.date)
  .filter(Boolean)
  .sort()
  .at(-1)

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/journal", lastmod: latestPost, changefreq: "weekly", priority: "0.9" },
  ...posts.map((p): SitemapEntry => ({
    path: `/journal/${p.slug}`,
    lastmod: p.date,
    changefreq: "monthly",
    priority: "0.8",
  })),
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
]

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
console.log(`sitemap.xml written (${entries.length} entries)`)
