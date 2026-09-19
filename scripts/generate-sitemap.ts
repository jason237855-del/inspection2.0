// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

import { SITE_URL as BASE_URL } from "../src/config/site"

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

// 團報建案頁面：建置時向 Supabase 讀取「開放中」建案的 slug（公開資料，用 publishable key 即可）。
// 讀取失敗時只警告、不讓建置失敗；新增建案後，下次部署才會出現在 sitemap。
function loadEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env }
  try {
    for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2]
    }
  } catch {
    // 沒有 .env（例如 CI／Vercel）就只用系統環境變數
  }
  return env
}

async function groupSlugs(): Promise<string[]> {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.warn("sitemap: 缺少 Supabase 環境變數，略過團報建案頁面")
    return []
  }
  try {
    const res = await fetch(`${url}/rest/v1/group_projects?select=slug&status=eq.active&order=sort_order`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as { slug: string }[]
    return rows.map((r) => r.slug)
  } catch (e) {
    console.warn("sitemap: 讀取團報建案失敗，略過團報建案頁面：", e)
    return []
  }
}

const groupPages = await groupSlugs()

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/journal", lastmod: latestPost, changefreq: "weekly", priority: "0.9" },
  ...posts.map((p): SitemapEntry => ({
    path: `/journal/${p.slug}`,
    lastmod: p.date,
    changefreq: "monthly",
    priority: "0.8",
  })),
  { path: "/group", changefreq: "weekly", priority: "0.8" },
  ...groupPages.map((slug): SitemapEntry => ({
    path: `/group/${encodeURIComponent(slug)}`,
    changefreq: "weekly",
    priority: "0.7",
  })),
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
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
