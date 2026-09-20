// 團報建案的 LINE／Facebook 分享圖（1200×630 PNG，風格＝文字海報）。
// 由 api/group-meta.js 的 og:image 指向：/api/group-og?slug=<建案 slug>
// 顏色與網站上卡片封面（GroupCover.tsx）使用同一組色盤與雜湊，同一個建案顏色一致。
// 後台有上傳封面照片的建案不會用到這裡（分享圖直接用照片）。
//
// 需要的環境變數：VITE_SUPABASE_URL、VITE_SUPABASE_PUBLISHABLE_KEY（Vercel 上本來就為建置設定過）
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const SITE_URL = "https://inspection20.vercel.app";
const PALETTE = ["#3f5a78", "#3e6b6b", "#4d5687", "#5b6b7c", "#4a6a56", "#6b5b7b", "#7a6a55", "#3a4a63"];

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const discountText = (rate) => `${Number((Number(rate) * 10).toFixed(1))} 折`;

// 沒有 JSX 編譯，用小 helper 組元素
const h = (style, children) => ({ type: "div", props: { style: { display: "flex", ...style }, children } });

// Google Fonts 只載入用到的字（避免整套中文字型太大）；要用舊 UA 才不會回 woff2（satori 不支援）
async function loadFont(text) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(text)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
      },
    })
  ).text();
  const m = css.match(/src: url\((.+?)\) format\('(woff|opentype|truetype)'\)/); // satori 支援 woff／ttf／otf，不支援 woff2
  if (!m) throw new Error("font url not found");
  return (await fetch(m[1])).arrayBuffer();
}

const nameSize = (name) => {
  const len = Array.from(name).length;
  if (len <= 4) return 132;
  if (len <= 6) return 112;
  if (len <= 9) return 88;
  if (len <= 13) return 68;
  return 56;
};

export default async function handler(req, res) {
  const fallback = () => {
    res.statusCode = 302;
    res.setHeader("Location", `${SITE_URL}/og-image.jpg`);
    res.end();
  };

  try {
    let slug = req.query?.slug ?? "";
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // 保持原值
    }
    const base = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!base || !key || !slug) return fallback();

    const r = await fetch(
      `${base}/rest/v1/group_projects?select=name,region,min_units,discount_rate&status=eq.active&slug=eq.${encodeURIComponent(slug)}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!r.ok) return fallback();
    const p = (await r.json())[0];
    if (!p) return fallback();

    const color = PALETTE[hash(slug) % PALETTE.length];
    const size = nameSize(p.name);
    const badge = `滿 ${p.min_units} 戶享 ${discountText(p.discount_rate)}`;
    const fontText = `${p.name}${p.region}${badge}診斷室驗屋建案團報GROUPINSPECTION `;
    const font = await loadFont(fontText);

    const tree = h(
      { width: "100%", height: "100%", background: color, color: "#fff", position: "relative", fontFamily: "Noto Sans TC" },
      [
        // 右上的裝飾圓（與卡片封面一致）
        h({ position: "absolute", right: -120, top: -120, width: 560, height: 560, borderRadius: 9999, background: "rgba(255,255,255,0.10)" }, ""),
        h({ position: "absolute", right: 60, top: 300, width: 250, height: 250, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }, ""),
        h({ position: "absolute", left: 80, top: 70, fontSize: 26, letterSpacing: 8, color: "rgba(255,255,255,0.72)" }, "GROUP INSPECTION"),
        h({ position: "absolute", left: 80, right: 80, bottom: 96, flexDirection: "column" }, [
          h({ fontSize: size, fontWeight: 700, lineHeight: 1.15, letterSpacing: 3 }, p.name),
          h({ width: 96, height: 3, background: "rgba(255,255,255,0.65)", marginTop: 34 }, ""),
          h({ fontSize: 38, marginTop: 24, color: "rgba(255,255,255,0.85)", letterSpacing: 4 }, p.region),
        ]),
        h(
          {
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 34,
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 3,
          },
          [h({}, "診斷室驗屋　建案團報"), h({ padding: "8px 22px", border: "2px solid rgba(255,255,255,0.55)", borderRadius: 9999 }, badge)],
        ),
      ],
    );

    // satori：版面 → SVG；resvg：SVG → PNG
    const svg = await satori(tree, {
      width: 1200,
      height: 630,
      fonts: [{ name: "Noto Sans TC", data: font, weight: 700, style: "normal" }],
    });
    const buf = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.end(buf);
  } catch (e) {
    console.error("group-og error", e);
    return fallback();
  }
}
