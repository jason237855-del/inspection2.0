import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 新版部署後，仍開著舊版頁面的訪客點擊時會找不到舊檔名的 chunk，
// 整頁會變空白。偵測到這種載入失敗時自動重新整理一次，改載入新版；
// 用 sessionStorage 旗標避免無限重整（載入成功 10 秒後清除旗標）。
window.addEventListener("vite:preloadError", () => {
  try {
    if (sessionStorage.getItem("chunk-reload") === "1") return;
    sessionStorage.setItem("chunk-reload", "1");
  } catch {
    // sessionStorage 不可用時仍嘗試重整一次
  }
  window.location.reload();
});
setTimeout(() => {
  try {
    sessionStorage.removeItem("chunk-reload");
  } catch {
    // 忽略
  }
}, 10000);

// index.html 內帶 data-static-seo 的 meta 是給「不執行 JavaScript 的爬蟲」看的預設值；
// 前端載入後移除，改由各頁的 <Seo>（Helmet）輸出，避免同一頁出現兩組重複的 description／og 標籤。
document.querySelectorAll("[data-static-seo]").forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(<App />);
