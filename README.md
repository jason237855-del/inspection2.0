# 診斷室驗屋網站（Inspection2.0）

驗屋服務公司的官方網站，包含前台行銷頁面與預約流程、後台管理系統，並整合 LINE 官方帳號通知與綁定。

正式網址：https://inspection20.vercel.app

## 技術架構

- 框架：Vite + React 18 + TypeScript
- UI 元件：shadcn-ui（基於 Radix UI）+ Tailwind CSS
- 動畫：Framer Motion
- 表單：react-hook-form + zod
- 路由：react-router-dom
- 後端：Supabase（資料庫、驗證、Edge Functions）
- 其他：react-helmet-async（SEO meta）、date-fns、recharts（後台圖表）

專案原以 [Lovable](https://lovable.dev) 平台建置與協作編輯，目前已改為本機 + GitHub + Vercel 的部署流程。

## 開發環境設定

```sh
# 安裝相依套件
npm install

# 複製環境變數範本並填入實際值（Supabase 專案設定裡取得）
cp .env.example .env

# 啟動開發伺服器
npm run dev
```

`.env` 需要的變數：

| 變數 | 說明 |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | Supabase 專案 ID |
| `VITE_SUPABASE_URL` | Supabase 專案 API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase 前端可公開金鑰（非 service role key） |
| `VITE_LIFF_ID` | LINE LIFF App ID |

`npm run dev` / `npm run build` 會先跑 `predev` / `prebuild`（`scripts/generate-sitemap.ts`，用 `tsx` 執行）自動產生 `public/sitemap.xml`。

## 前台頁面（`src/pages`）

首頁（`Index.tsx`）由以下區塊組成（對應 `src/components/`）：

- **Hero**：背景輪播（首頁大圖 + 診斷情境照）
- **AboutSection**：關於我們，自動輪播的公司價值卡片（公正獨立／專業細緻／報告清晰／客戶至上）
- **Experience**：「為什麼選診斷室驗屋」，展示技術士證照分類（電匠／水匠／防水／燃氣）
- **QuickGuide**：六大診斷項目（電氣、給排水、防水、建築土建、設備、環境），每類有輪播圖與檢測項目清單
- **Process**：服務流程五步驟（預約洽詢 → 行前準備 → 現場檢測 → 報告交付 → 複驗追蹤），含 Canvas 動態背景（`FlowField.tsx`）
- **Services**：核心服務四項（新成屋驗屋／中古屋檢測／複驗服務／屋況諮詢）
- **Pricing**：驗屋費用，三種方案分頁（新成屋初驗 $7,777 起、新成屋複驗 $3,000 起、中古屋 $10,000 起、團報優惠 $6,888 起），附方案差異比較表
- **Booking**：預約 CTA，導向 `/booking`

其他獨立頁面：

| 頁面 | 說明 |
| --- | --- |
| `About.tsx` | 關於我們獨立頁 |
| `Contact.tsx` | 聯絡我們 |
| `Faq.tsx` | 常見問題 |
| `Journal.tsx` / `JournalArticle.tsx` | 診斷筆記部落格列表與文章頁 |
| `BookingPage.tsx` | 獨立預約頁（承載 `BookingForm`） |
| `Auth.tsx` | 登入頁（給後台管理員） |
| `Admin.tsx` | 後台管理（專案中最大的檔案） |

## 預約流程（`BookingForm.tsx`）

四步驟表單：

1. 坪數與方案選擇（新成屋／中古屋、是否加購複驗）
2. 聯絡與建案資料（姓名、電話、Email、建案區域/名稱、房型、樓層戶號）
3. 選擇日期與時段
4. 完成，導引加入官方 LINE 領取折扣

送出前會即時查詢 Supabase 的 `booking_availability`（可預約日期與名額上限）與 `booking_requests`（已預約數），檔掉已額滿或被封鎖的日期。表單送出後寫入 `booking_requests` 資料表，並呼叫 Edge Function 發送 LINE 通知給管理團隊；完成頁引導使用者透過 LINE LIFF 加好友以綁定預約並取得 $500 折扣。

## LINE 整合

- `src/config/line.ts`：LIFF ID 與官方 LINE 加好友連結設定
- `src/hooks/useLiffProfile.ts`：LIFF SDK 載入、登入與抓取使用者 LINE 個人資料
- `src/components/LineBookingBinder.tsx`：當使用者從 LIFF 連結（`?booking_id=xxx`）開啟 `/booking` 時，自動綁定 LINE 帳號到該筆預約

三個 Supabase Edge Functions（`supabase/functions/`）：

| Function | 說明 | 需要的環境變數 |
| --- | --- | --- |
| `send-line-notification` | 新預約產生時，推播 Flex Message 卡片給管理員 LINE 群組 | `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_ADMIN_GROUP_ID`、`ADMIN_LINE_USER_ID` |
| `bind-line-booking` | 使用者加 LINE 好友後，綁定該筆預約、套用 $500 折扣、回推播預約憑證給客戶 | `LINE_CHANNEL_ACCESS_TOKEN`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` |
| `line-webhook` | 接收 LINE 平台事件（主要用途是記錄群組 ID，方便設定管理員群組環境變數） | — |

## 資料庫（`supabase/migrations`）

三張主要資料表：

- `user_roles`：角色權限管理，含 Row Level Security 政策（使用者僅能看自己角色，管理員可管理所有角色）
- `booking_availability`：每日可預約名額與封鎖狀態
- `booking_requests`：預約明細（坪數、房型、價格、LINE 綁定狀態、狀態流程等），後續多次 migration 陸續增加欄位（`project_name`、`notes`、`time_slot` 等）

## 後台管理（`src/pages/Admin.tsx` + `src/components/admin/`）

- `OverviewDashboard.tsx`：統計儀表板
- `BookingEditorDialog.tsx`：編輯單筆預約
- `AdminSettings.tsx`：後台設定（例如每日開放名額）
- `types.ts`：預約狀態、檢測類型、房型、地區等對照表與選項清單
- 權限判斷透過 `useAdmin.ts` / `useAuth.tsx`，查詢 Supabase `user_roles` 表確認是否為管理員

功能涵蓋：預約清單管理、依日期/建立時間排序篩選、調整每日開放名額。`/admin`、`/auth` 已在 `public/robots.txt` 中設定 `Disallow`，不會被搜尋引擎索引。

## 部署

- 前端：Vercel（`vercel.json` 將所有路徑改寫至 `index.html`，供 SPA 路由使用），正式網域 `https://inspection20.vercel.app`
- 後端：Supabase（資料庫 / Auth / Edge Functions），專案 ID 見本機 `supabase/config.toml` 或 `.env`

## 安全性備註

`.env` 內含 Supabase publishable key 與 LIFF ID，這些屬於設計上可公開的前端金鑰（非 service role key），目前沒有安全疑慮。真正敏感的 LINE Channel Access Token、Supabase Service Role Key 都是設定在 Supabase Edge Function 的環境變數中，不在前端程式碼裡。`.env` 本身不進版控（見 `.gitignore`），改附 `.env.example` 放空值佔位。

## 更新紀錄

依時間新到舊排列，每筆記錄實際做了什麼變動、為什麼。

- **2026-09-11** — 「驗屋費用」區塊（`Pricing.tsx`）的「方案差異比較」表改版，套用使用者提供的新表格內容（`comparison` 陣列 12 列）：新增「適合對象」「給排水／機電檢測」「假日驗屋費用」3 項，移除原本的「多戶彙整報告」，「修繕費用說明」改成「屋況風險評估」（值不變，只有中古屋打勾），其餘幾項文字/數值同步更新（建議坪數基準 3 方案統一改成「20 坪內／戶」、複驗服務中古屋從「另計」改成「—」、檢測時機中古屋從「購屋前／簽約前」改成「交屋前」）。「假日驗屋費用」列維持照使用者提供的原樣用打勾表示（只有中古屋打勾），沒有改成實際加價金額文字。`npx tsc --noEmit` 通過。
- **2026-09-11** — 首頁 Hero 區塊重構（僅 Hero，其他 section／路由／後台／API／資料庫都沒動）：使用者提供 Dribbble「Assetize」動態視覺語言作參考（不直接複製），核心概念改成「正在被診斷的房子」。(1) 新增 `src/components/hero/` 子資料夾：`HeroSection.tsx`（容器，管 `useScroll` 進度＋滑鼠視差 MotionValue 來源）、`HeroVisual.tsx`（中央抽象線條房屋 SVG，含緩慢 scan sweep）、`InspectionElements.tsx`（11 個周圍漂浮的檢測視覺元素：熱像／scan line／雷射水平／水管／電路／插座／磁磚／牆體剖面／裂縫標記／濕度數據／inspection point，皆手刻 SVG，無外部素材）、`HeroContent.tsx`（新文案「看見問題，不只指出問題。」／「從建築、機電到環境檢測，以跨系統專業替你的房子做完整診斷。」＋「立即預約驗屋」／「了解服務」兩個 CTA）、`HeroStats.tsx`（新增的統計數據 section，緊接 Hero 後面，4 組數字皆為使用者提供的 placeholder：3,000+ 累積檢測戶數／10+ 年專業經驗／11,111+ 發現缺失與異常／30+ 專業檢測項目，count-up 動畫克制、`easeOut` 1.4s）；(2) `Hero.tsx` 改成純 re-export `HeroSection`，`Hero` 這個 import 路徑不變；(3) `Index.tsx` 插入 `<HeroStats />`，並把 `<Navigation />` 改成 `<Navigation variant="dark" />`——因為 Hero 背景從深色相片換成暖白背景後，原本首頁頂部半透明白字懸浮條（設計給深色背景用）會看不清楚，套用 `Navigation.tsx` 本來就有、`/faq`／`/journal` 已在用的 `variant="dark"`（強制深色實心懸浮條＋白字）解決，沒有改動 `Navigation.tsx` 本體。動畫全部用專案既有的 `framer-motion`（`useScroll`／`useTransform`／`useSpring`）＋ CSS transform ＋ inline SVG 做視差、漂浮、scroll-driven 縮小/拆解，沒有新增 GSAP 或 Three.js 依賴；滑鼠視差只在 `(pointer: fine)` 啟用，全部動畫吃 `prefers-reduced-motion`；手機版漂浮元素只顯示 6/11（約減少 45%，落在需求的 30–50% 區間）、平板 8/11、桌面全部 11 個，用 `hidden md:block`/`hidden lg:block` 立即隱藏避免斷點判斷完成前的閃爍。`npx tsc --noEmit`／`npm run lint`（新檔案零錯誤零警告，既有的 9 error/9 warning 跟這次改動無關）／`npm run build` 皆通過，首頁主要進入點從 506KB（gzip 165KB）增加到 531KB（gzip 172.5KB，+~5%）。
- **2026-09-11** — 新增全站右下角浮動按鈕（`FloatingConsultButton.tsx`，掛在 `App.tsx` 的 `BrowserRouter` 內，`/admin` 後台不顯示）：參考使用者提供的 nday.com.tw 右側「驗屋顧問」浮動按鈕排版，圖示改成本站自己的白色版 LOGO（`logo-mark-white.png`）套在 `--primary` 底色圓形按鈕上、加上輕微脈動光暈（`prefers-reduced-motion` 時關閉），下方文字標籤改成「優惠券領取」；點擊導到官方 LINE（`config/line.ts` 的 `LINE_OA_URL`，開新分頁），對應網站既有「加 LINE 好友」訂單折扣機制，優惠券即等於這個既有折扣，沒有另外做新的優惠券後端。`npx tsc --noEmit` 通過。
- **2026-09-11** — 首頁「為什麼選診斷室驗屋」區塊（`Experience.tsx`）改版：(1) 證照清單新增「木作」（裝潢木工乙級）、「空調」（冷凍空調裝修乙級）2 組，原本 4 組（電匠/水匠/防水/燃氣）擴充為 6 組；(2) 使用者提供 MotionArray 付費素材站的動態影片作為排版參考，因該站內容需付費授權、無法直接下載嵌入，改為每個工種手寫原創的 Framer Motion SVG 循環動畫取代原本靜態的 lucide icon（新增 `TradeMotionIcon.tsx`：電匠指針擺動+閃電閃爍、水匠水滴滴落、防水漣漪擴散、燃氣火焰搖曳、木作鐵鎚敲擊+衝擊線、空調風扇旋轉+氣流線，皆有 `prefers-reduced-motion` 靜態降級）；(3) 排版比較過「置中標題+3x2 滿版大網格」與「左側標題固定 sticky+右側證照網格兩欄」兩版後，確定採用後者，右側網格在超寬螢幕（xl）再展開成 3 欄，卡片內容改 flex 置中讓證照數量不同（電匠 2 張 vs 其他 1 張）的卡片高度視覺一致。`npx tsc --noEmit` 通過；先推到 `preview/experience-motion-graphics` 分支用 Vercel Preview 部署確認過，再 fast-forward 合併進 `main`。
- **2026-09-11** — 三處前端文案/排版微調：(1) 首頁「六大系統」區塊（`QuickGuide.tsx`）電氣診斷清單「電箱單線圖圖片審核」修正為「電箱單線圖圖面審核」，上方小標籤「我們的診斷項目」改成英文「CHECKLIST」；(2) 首頁「服務流程」區塊（`Process.tsx`）小標籤「Our Process」精簡為「Process」；(3) `/faq` 常見問題頁參考使用者提供的 Dribbble 設計圖（FAQ 標籤＋大標題左欄、可展開 Q&A 清單右欄的兩欄排版），把原本每個 PART 區塊「圖示卡片標頭＋標頭下方手風琴」的上下堆疊排版，改成桌面版左右兩欄（左：PART 標籤＋標題＋簡介，桌面版 `lg:sticky` 固定；右：該主題 4 題手風琴，第一題用 `defaultValue` 預設展開），手機版維持自動變回上下堆疊；PART 01~05 的 5 大主題結構與全部 20 題文案內容不變，只調整排版，配色沿用網站既有色票，未採用參考圖的橘色。CTA 卡片另外加上 `max-w-2xl` 讓寬度不會隨兩欄版面被拉太寬。`npx tsc --noEmit` 通過。
- **2026-09-11** — 調整首頁「六大系統」區塊（`src/components/QuickGuide.tsx`）的檢測項目文案，並加深全站淡灰文字顏色：(1) 電氣診斷、給排水診斷、建築土建診斷、設備診斷、環境診斷 5 個分類的檢測項目清單改用使用者提供的新措辭（多數改成「全戶／全室空間＋項目＋檢測」的完整寫法，環境診斷新增「全室空間電磁波檢測」一項），給排水診斷的「檢測重點」文字語序微調（「實測全戶水壓」→「全戶實測水壓」）；防水診斷維持原文案不變。(2) `src/index.css` 的 `--muted-foreground`（用於檢測重點/報告內容/清單等次要文字，也是全站共用的淡灰文字色票）從 `213 19% 45%`（對比背景約 4.8:1，卡在 WCAG AA 邊緣）加深到 `213 19% 36%`（約 6.75:1），色相/飽和度不變只加深，讓細字重（font-light）的說明文字更容易閱讀；深色模式（`.dark`）的 `--muted-foreground` 對比度本來就夠（約 6.9:1），未調整。`npx tsc --noEmit` 通過。
- **2026-09-07** — 「營收狀況」分頁改版，加上週/月/年切換，整頁跟著所選期間重新計算（參考使用者提供的 Dribbble 記帳 App 設計圖，取版面手法、配色沿用網站既有淺色系，不採用參考圖的鮮豔粉紅/橘色色塊）：(1) 新增 `period`（週/月/年）狀態與對應區間計算（`date-fns` 的 `startOfWeek/endOfWeek/subWeeks`、`startOfMonth/endOfMonth/subMonths`、`startOfYear/endOfYear/subYears`），4 格指標卡改成「本{週/月/年}營收＋較上期漲跌徽章」「上{週/月/年}營收」「期間平均客單價」「期間訂單數」，拿掉原本不隨期間變動的「累計營收」卡片；(2) 趨勢圖依 period 換分桶粒度：週＝7 天日長條、月＝當月每日長條（比照「近 30 天」的稀疏標籤手法，只標示頭/中/尾）、年＝當年 1~12 月長條；(3) 分布統計從「每類別一條進度條」改成 `SegmentedRevenueBar` 單一分段長條＋圖例，色階用既有 `--primary` token 的透明度深淺變化（`bg-primary`、`/75`、`/55`、`/40`、`/28`、`/18`）而非新色相，資料來源也改成跟著 period 篩選；(4) 營收明細從 `<Table>` 改成可點擊清單（比照 `OverviewDashboard.tsx` 近期預約清單的排版手法），點一筆會跳到「預約紀錄」分頁並開啟該筆詳情（新增 `onOpenBooking` prop，`Admin.tsx` 比照總覽頁的傳法）；(5) `OverviewDashboard.tsx` 的 `TrendBadge` 加上可選的 `compareLabel` prop（預設「較上月」），讓「營收狀況」能顯示「較上週/較上月/較去年」，其餘既有呼叫點不受影響。`npx tsc --noEmit`／`npm run build` 皆通過，並用 Chrome 手動新增一筆已確認＋有金額的測試預約，切換週/月/年三種模式確認指標卡、趨勢圖、分布、明細都正確重算，點明細項目確認會跳轉並開啟詳情，測試完已刪除。
- **2026-09-07** — 手機版後台總覽頁（`OverviewDashboard.tsx`）補上「本月營收」／「累計營收」兩張小卡片，放在既有統計卡最上方，算法跟桌面版「營收狀況」分頁一致（只計「已確認」＋「已完成」訂單的 `price` 總和）。原因：手機底部導覽（`MobileBottomNav.tsx`）維持原本 5 個入口不變、沒有新增「營收狀況」分頁的空間，但手機也需要能看到基本營收概況，所以用 `useIsMobile()` 判斷只在手機寬度顯示這兩張卡片，桌面版總覽頁不受影響（桌面已經有完整的「營收狀況」分頁，不需要重複）。`npx tsc --noEmit`／`npm run build` 皆通過，並用 Chrome 分別在手機寬度（確認卡片有出現在總覽頁最上方）與桌面寬度（確認總覽頁沒有多出這兩張卡片）截圖驗證。
- **2026-09-07** — 後台管理系統（`/admin`）側邊欄新增「營收狀況」分頁：(1) 新增 `src/components/admin/RevenueDashboard.tsx`，內容包含本月營收（含較上月漲跌徽章）／累計營收／平均客單價／已計入訂單數等 4 格指標卡、近 12 個月營收趨勢長條圖、依檢測類型／房屋類型／地區的營收分布，以及列出所有已計入訂單的營收明細表格；(2) 營收只計算 `status` 為「已確認」或「已完成」的訂單（排除「待確認」和「已取消」），金額一律取 `booking_requests.price` 欄位（客戶在前台預約表單送出時，依方案＋坪數＋複驗加價自動算好、扣掉 LINE 好友優惠後存進去的金額）；(3) 後台「新增預約」／「編輯預約」（`BookingEditorDialog.tsx`）原本完全沒有金額欄位，這次補上一個選填的「金額」欄位，之後後台手動建立/編輯的預約才能被正確算進營收，留空則視為尚未報價、不計入統計；(4) `OverviewDashboard.tsx` 原本內部沒 export 的 `TrendBadge`（本月 vs 上月漲跌徽章）改為 `export`，讓 `RevenueDashboard.tsx` 直接重用，避免重複寫一份幾乎一樣的元件；(5) `AdminSidebar.tsx` 的「管理」群組加入「營收狀況」項目（`TrendingUp` icon）。這次沒有動 `booking_requests` 資料庫 schema（`price` 欄位本來就存在、可為 NULL），也沒有動手機版底部導覽（先只在桌面側邊欄提供，跟先前後台改版取捨一致）。`npx tsc --noEmit`／`npm run build` 皆通過，並用 Chrome 實際登入 `/admin`：手動新增一筆帶金額、狀態為「已確認」的測試預約，確認總覽統計卡、營收趨勢圖、三種分布、明細表格都正確反映新資料後，再刪除測試資料還原。
- **2026-09-07** — 後台管理系統（`/admin`）桌面版（≥768px）改成左側側邊欄導覽，取代原本的頂部圓角分頁籤：(1) 新增 `src/components/admin/AdminSidebar.tsx`，分兩組（管理：總覽／預約紀錄［待確認數量徽章］／名額管理；帳號：管理者設定），頂部有品牌區塊（沿用 `logo-mark-black.png`）與「＋新增預約」快捷按鈕，底部有登入者 email＋登出；(2) `Admin.tsx` 拿掉 `<TabsList>` 分頁籤（手機版本來就是靠 `MobileBottomNav` 切換 `activeTab`，從沒用到這個 `TabsList`，移除不影響手機邏輯），改由側邊欄或既有的手機底部導覽驅動同一個 `activeTab` 狀態，4 個 `TabsContent`（總覽/名額管理/預約紀錄/管理者設定）內容與商業邏輯完全不動；(3) 桌面版隱藏原本置底的整站行銷 `Footer`（改成 `md:hidden` 包裹，手機版維持顯示），因為側邊欄式版面下再放一個深色行銷版尾會很突兀，兩張參考設計圖也都沒有版尾。配色沿用網站既有的 `--primary`/`--secondary`/`--border` 等淺色系色票，沒有採用參考圖（Dribbble「Xelio - AI Investigation Center」）的深色主題與紫色強調色。專案裡原本就有 shadcn 完整的 `src/components/ui/sidebar.tsx`（含 collapsible/手機 Sheet/cookie 持久化，Lovable 模板殘留、從未被使用），評估後決定不用它，改用純 Tailwind 手刻固定顯示的側邊欄，避免和既有的 `MobileBottomNav` 手機方案疊床架屋。`npx tsc --noEmit`／`npm run build` 皆通過，並用 Chrome 實際登入 `/admin` 在桌面寬度與 390px 手機寬度分別截圖確認：桌面側邊欄四個分頁切換、待確認徽章、登出都正常，手機版（底部導覽列＋原本版面）與改動前逐項比對一致。
- **2026-09-07** — 後台管理系統（`/admin`）新增獨立的手機版介面（<768px，沿用既有 `useIsMobile()` 斷點），桌面版完全不變：(1) 新增 `src/components/admin/MobileBottomNav.tsx`，手機版改用底部固定導覽列（總覽／預約紀錄／中間浮動＋新增／名額管理／設定）取代原本頂部分頁籤；(2) 新增 `src/components/admin/MobileBookingDetail.tsx`，手機版點一筆預約進全螢幕詳情頁（取代原本的彈出視窗 Dialog），桌面版仍是 Dialog；(3) `OverviewDashboard.tsx` 的「本月新預約」「取消率」統計卡片加上跟上個月比較的漲跌徽章（用既有 `bookings` 資料裡的 `created_at` 前端算，沒多打 API），「待確認」「已確認」「名額使用率」因為沒有歷史快照/資料，不加假的比較數字；(4) 預約紀錄手機版清單簡化成單純點擊進詳情頁的列表列（狀態改成小圓點+徽章），原本卡片上的狀態下拉/編輯/刪除按鈕移到新的全螢幕詳情頁裡；(5) 手機版搜尋框改成頂部常駐的圓角搜尋列+篩選圖示按鈕。全程沿用專案既有的 `--primary`／`--secondary`／`--destructive` 色票，沒有引入設計參考圖（Dribbble Ecomiq）的橘色配色。`npm run build`／`tsc --noEmit` 皆通過；因為 `/admin` 需要管理員登入，實際手機版視覺效果需使用者自行登入後台確認。
- **2026-09-06** — 排查 Supabase Dashboard 的 Authentication → URL Configuration：Site URL 一直被設成當初串接 Vercel 時的舊 preview 部署網址（`https://inspection20-leo-8739.vercel.app`）。手動改回 `https://inspection20.vercel.app` 後會被自動改回去，查出來是 **Vercel 專案 Settings → Integrations 裡裝的「Supabase」Marketplace 整合**在搞的鬼（跟 Supabase Dashboard 裡「Settings → Integrations → Vercel」那個管環境變數同步的整合是兩個不同東西）：這個整合的 Webhook 會監聽 Vercel 的 Deployments/Domains 事件，抓到的「預設網址」是 Vercel 專案內建的 `<專案名>-<team slug>.vercel.app`，不是後來另外加的正式自訂網域，所以每次有新部署就會把 Site URL 蓋回去。目前確認 Supabase／Vercel 兩邊都沒有能單獨關掉這個行為的開關，只能整個移除該整合（會連帶失去環境變數自動同步），評估後**先不處理**——因為 `resetPasswordForEmail`／`signUp` 的 `redirectTo` 都有寫死正式網域，且 Redirect URLs 允許清單已包含 `https://inspection20.vercel.app/*`、`/reset-password`（Supabase 比對得到就不會退回用 Site URL），實測應該不影響現有功能，頂多信件範本如果用到 `{{ .SiteURL }}` 變數顯示網址文字會顯示成怪網址。之後如果要徹底解決，要去 Vercel 專案的 Integrations 頁移除 Supabase 整合。
- **2026-09-06** — `App.tsx` 除首頁外的頁面（`/admin`、`/auth`、`/booking`、`/journal` 等）改用 `React.lazy` + `Suspense` 動態載入。原因：`npm run build` 一直跳出「chunk 超過 500KB」警告，一般訪客進站不管看哪一頁都要把整個網站（包含後台管理系統的所有元件）一次下載完，載入速度受影響。拆開後主要進入點的 JS 從 1015KB（gzip 317KB）降到 506KB（gzip 165KB），`Admin.tsx` 那包 95KB 變成只有進 `/admin` 才會下載。
- **2026-09-06** — 補上帳號自助管理：(1) 新增 `/reset-password` 頁面 + `/auth` 的「忘記密碼」連結，走 Supabase `resetPasswordForEmail`；(2) `/auth` 的「註冊」入口原本因為 `adminExists` 判斷、只有網站還沒有任何 admin 時才會顯示，導致已經有 admin 之後新使用者完全無法自行建立帳號（上次朋友登入不了就是卡在這裡）——移除該限制讓註冊入口一直存在，並在註冊流程加上跟預約表單同樣的蜜罐欄位+提交時間檢查，避免公開的註冊入口被機器人濫用。註冊完成後仍需要現有管理員在後台「AdminSettings」用既有的「新增管理員」功能（`add_admin_by_email` RPC）指派角色才能登入後台，這部分功能本來就存在、不用另外開發。另外把 signUp 的 `emailRedirectTo` 從 `/admin` 改成 `/auth`，確認信連結會導回登入頁而不是先跳一次 `/admin` 再被踢出來。**待辦**：Supabase Dashboard 的 Authentication → URL Configuration 要記得把 `https://inspection20.vercel.app/reset-password` 加進允許的 Redirect URLs，不然重設密碼信的連結會導向失敗。
- **2026-09-06** — `BookingForm.tsx` 加入基本防灌水機制：隱藏蜜罐欄位（機器人常會自動填入，真人看不到也不會填）+ 表單掛載後未滿 4 秒即送出視為異常。原因：`booking_requests` 的 RLS 允許任何人未登入直接 insert，且每筆都會觸發 LINE 推播給管理員群組，沒有防護容易被自動化機器人灌爆。此為純前端防護，可擋掉大部分通用機器人，但無法防止有心人直接呼叫 Supabase API；更強的防護（如 Cloudflare Turnstile）之後視需要再加。
- **2026-09-06** — 修正 `CLAUDE.md` 裡兩處過時說明：Supabase 專案 ID 改為指向 `.env`/`supabase/config.toml`（不再寫死舊值）、`predev`/`prebuild` 腳本已改用 `tsx` 執行（原本寫的 `bunx` workaround 已不適用，`npm run dev`/`npm run build` 可直接跑）。
- **2026-09-06** — 將 `網站程式總覽.md` 的內容整合進本檔並重新核對現況：確認 Locations 假資料頁面已移除、Supabase 專案 ID 已改為新專案、`predev`/`prebuild` 已改用 `tsx`；README 從 Lovable 預設模板改為專案實際說明文件，並新增本更新紀錄段落。
- **2026-09-06** — `send-line-notification` Edge Function 的 `ADMIN_URL` 從舊的 Lovable 網域改為正式 Vercel 網域 `https://inspection20.vercel.app/admin`；`supabase/.temp/`（Supabase CLI 本地暫存檔）加入 `.gitignore`。
