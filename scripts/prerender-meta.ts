// Runs after `vite build` (postbuild hook).
// 這是 SPA，所有網址原本都回同一份 index.html（標題／說明都是首頁的）。
// 不執行 JavaScript 的爬蟲（LINE／Facebook 預覽、部分搜尋與 AI 爬蟲）只看得到這份原始碼，
// 所以這裡為每個主要頁面複製一份 dist/<路徑>/index.html，只換掉 <head> 裡的標題、說明、og、canonical。
// 內容仍由前端渲染；這些標籤帶 data-static-seo，前端載入後會被移除並改由 <Seo> 接手（見 src/main.tsx）。
// 後台「SEO 設定」的修改，要等下一次部署（重新執行建置）才會進到這些靜態標籤。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, resolve } from "path"

import { SITE_URL } from "../src/config/site"
import { SEO_PAGES } from "../src/config/seoPages"
import { AREAS, areaPath, areaSeo } from "../src/config/areas"

type Page = { path: string; title: string; description: string }

function loadEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env }
  try {
    for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2]
    }
  } catch {
    // 沒有 .env（例如 CI／Vercel）就只用系統環境變數
  }
  return env
}

async function rest<T>(table: string, query: string): Promise<T[]> {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T[]
  } catch (e) {
    console.warn(`prerender: 讀取 ${table} 失敗，使用預設值：`, e)
    return []
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function journalPages(): Page[] {
  const src = readFileSync(resolve("src/data/journal.ts"), "utf8")
  const body = src.slice(src.indexOf("journalArticles"))
  const slugs = [...body.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
  const titles = [...body.matchAll(/seoTitle:\s*"([^"]+)"/g)].map((m) => m[1])
  const descs = [...body.matchAll(/metaDescription:\s*"([^"]+)"/g)].map((m) => m[1])
  return slugs.map((slug, i) => ({ path: `/journal/${slug}`, title: titles[i], description: descs[i] })).filter((p) => p.title && p.description)
}

function applyMeta(html: string, p: Page): string {
  const title = esc(p.title)
  const desc = esc(p.description)
  const url = `${SITE_URL}${p.path === "/" ? "/" : p.path}`
  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta data-static-seo name="description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta data-static-seo property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta data-static-seo property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta data-static-seo property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  const extra = [
    `<link data-static-seo rel="canonical" href="${url}" />`,
    `<meta data-static-seo name="twitter:title" content="${title}" />`,
    `<meta data-static-seo name="twitter:description" content="${desc}" />`,
  ].join("\n    ")
  out = out.replace("</head>", `    ${extra}\n  </head>`)
  return out
}

const distIndex = resolve("dist/index.html")
if (!existsSync(distIndex)) {
  console.warn("prerender: 找不到 dist/index.html，略過")
  process.exit(0)
}
const template = readFileSync(distIndex, "utf8")
if (!template.includes("data-static-seo")) {
  console.warn("prerender: index.html 沒有 data-static-seo 標籤，略過")
  process.exit(0)
}

const [settings] = await rest<{ default_min_units: number; default_discount_rate: number }>("group_settings", "select=default_min_units,default_discount_rate")
const terms = settings
  ? `滿 ${settings.default_min_units} 戶享 ${Number((Number(settings.default_discount_rate) * 10).toFixed(1))} 折`
  : "滿 3 戶享 9 折"
const overrides = await rest<Page>("page_seo", "select=path,title,description")
const override = (path: string) => overrides.find((o) => o.path === path)

const pages: Page[] = [
  ...SEO_PAGES.map((p) => ({ path: p.path as string, title: override(p.path)?.title || p.title, description: override(p.path)?.description || p.description })),
  ...AREAS.map((a) => ({ path: areaPath(a.slug), ...areaSeo(a.name, terms) })),
  ...journalPages(),
]

let count = 0
for (const p of pages) {
  const html = applyMeta(template, p)
  if (p.path === "/") {
    writeFileSync(distIndex, html)
  } else {
    const file = resolve("dist", p.path.slice(1), "index.html")
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  }
  count++
}
console.log(`prerender: 已為 ${count} 個頁面產生靜態標題／說明`)
