# 診斷場域（Diagnostic Field）— 只改「為什麼選診斷室驗屋」區塊

只調整首頁 `Experience` 這一個 Section 的背景與互動氛圍。文字內容、其他區塊、Header／Hero／Footer 一律不動。

## 視覺方向

- 背景改為極深的 Midnight Navy → Charcoal → Near Black 的細微 radial gradient（保留少量深藍延續品牌識別，不用純黑）。
- 背景上疊一層程序生成的「診斷場」Canvas：極細同心圓波紋、微小粒子、少量流動線條、微弱空間光暈，像 radar scan / wave interference。
- 能量核心不置中：桌機 X≈68%、Y≈50%；手機 X≈75%、Y≈60%。波紋可部分超出畫面，不呈現完整圓形。
- 顏色低飽和：blue gray、soft white、muted warm gray，少量 muted champagne 點綴。禁止亮青、電光藍、霓虹紫、彩虹漸層。

## 動態行為

- Ambient：無操作時仍以約 8–12 秒週期緩慢呼吸、波紋擴張、粒子漂移，效果非常克制。
- 游標：桌機游標附近粒子輕微位移，移動時產生極小、緩慢擴散並淡出的 ripple；不做水波特效。
- 捲動：以 IntersectionObserver 控制強度，進入時淡入、置中時達正常強度、離開時淡出並暫停繪製。
- 手機：降低粒子數、ripple 數、Canvas 解析度與複雜度；觸控只觸發一次 subtle ripple，不持續追蹤。
- `prefers-reduced-motion: reduce` 時停用動畫，只保留靜態診斷場背景。

## 可讀性

- 文字與證照卡片區塊後方加入非常 subtle 的 dark gradient / vignette。
- 左側 0–45% 粒子密度降低，主要視覺集中在右側 45–100%。
- 因背景轉深，此區塊內的標題、說明與四張證照卡片改用深色系對應的樣式（淺色文字、半透明深色卡面與細邊框），排版與文字內容維持不變。

## 技術細節

- 新增 `src/components/DiagnosticField.tsx`：純 Canvas 2D 元件，`position: absolute; inset: 0`，`pointer-events: none`，`aria-hidden`，無新增套件。
- 使用單一 `requestAnimationFrame` 迴圈；不在 viewport 時停止更新；所有狀態存於 ref，不觸發 React re-render。
- 依 devicePixelRatio 設定畫布尺寸（手機上限 1.5），`ResizeObserver` 處理尺寸變化。
- 沿用既有 `usePrefersReducedMotion` hook。
- `Experience.tsx` 只改外層 section 的 class（深色背景、`min-h-[80vh]` 桌機、`relative`、`overflow-hidden`）、掛上 Canvas 與 vignette 層，內容包在 `relative z-10`。
- 本版不含麥克風、Listen 按鈕或任何 Audio Reactive 功能。

## 附註

預約檢測表單「滑鼠進入卡片變深、文字轉白」已在先前實作完成，本次不重複更動。
