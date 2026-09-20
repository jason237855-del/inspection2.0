// 團報建案頁面的「連結預覽」：LINE／Facebook 等爬蟲不會執行 JavaScript，
// 只讀原始 HTML，所以 vercel.json 把這些爬蟲對 /group/:slug 的請求轉到這裡，
// 回傳帶有該建案標題、描述、分享圖的 HTML。一般訪客與 Google 不會經過這裡（走 SPA）。
//
// 需要的環境變數（Vercel 上本來就為建置設定過）：VITE_SUPABASE_URL、VITE_SUPABASE_PUBLISHABLE_KEY

const SITE_URL = "https://inspection20.vercel.app";
const SITE_NAME = "診斷室驗屋";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const discountText = (rate) => `${Number((Number(rate) * 10).toFixed(1))} 折`;

function page({ title, description, path, status = 200, image = OG_IMAGE, imageIsPhoto = false }) {
  const url = `${SITE_URL}${path}`;
  const html = `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${status === 200 ? "" : '<meta name="robots" content="noindex">\n'}<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="zh_TW">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
${imageIsPhoto ? "" : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(url)}">${esc(url)}</a></p>
</body>
</html>`;
  return { status, html };
}

export default async function handler(req, res) {
  let slug = req.query?.slug ?? "";
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // 保持原值
  }
  const path = `/group/${encodeURIComponent(slug)}`;

  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let result;
  try {
    if (!base || !key || !slug) throw new Error("missing config");
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const r = await fetch(
      `${base}/rest/v1/group_projects?select=id,name,region,slug,cover_image_url,min_units,discount_rate&status=eq.active&slug=eq.${encodeURIComponent(slug)}`,
      { headers },
    );
    if (!r.ok) throw new Error(`supabase ${r.status}`);
    const rows = await r.json();
    const p = rows[0];
    if (!p) {
      result = page({
        title: `找不到這個團報建案｜${SITE_NAME}`,
        description: "這個團報建案不存在，或已結束開放。",
        path,
        status: 404,
      });
    } else {
      let count = 0;
      try {
        const cr = await fetch(`${base}/rest/v1/rpc/get_group_project_counts`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: "{}",
        });
        if (cr.ok) count = (await cr.json()).find((x) => x.group_project_id === p.id)?.unit_count ?? 0;
      } catch {
        // 取不到戶數就當 0
      }
      const d = discountText(p.discount_rate);
      const progress =
        count >= p.min_units ? `已成團，全團享 ${d}` : `已報名 ${count} 戶，再 ${p.min_units - count} 戶即成團`;
      result = page({
        title: `${p.name} 團購驗屋｜滿 ${p.min_units} 戶享 ${d}｜${SITE_NAME}`,
        description: `${p.region}「${p.name}」建案團購驗屋：${progress}。同建案滿 ${p.min_units} 戶全團享 ${d}，每戶各自預約時段，邀請鄰居一起加入。`,
        path,
        // 後台有上傳封面照片就用照片，否則用自動產生的文字海報分享圖（api/group-og.js）
        image: p.cover_image_url || `${SITE_URL}/api/group-og?slug=${encodeURIComponent(p.slug)}`,
        imageIsPhoto: Boolean(p.cover_image_url),
      });
    }
  } catch (e) {
    console.error("group-meta error", e);
    // 讀不到資料時回一般的網站預覽，不讓分享出現壞掉的卡片
    result = page({
      title: `建案團報｜同建案團購驗屋享折扣｜${SITE_NAME}`,
      description: "同建案多戶一起報名驗屋，達成團戶數全團享折扣。",
      path: "/group",
    });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(result.status).send(result.html);
}
