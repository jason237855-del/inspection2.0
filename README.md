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
- **Pricing**：驗屋費用，三種方案分頁（新成屋初驗 $7,777 起、新成屋複驗 $3,000 起、中古屋 $10,000 起；團報優惠分頁不顯示價格，僅列同社區 3 戶以上適用與專屬服務內容），附方案差異比較表
- **GroupBuying**：建案團報區塊（`#group-buying`），列出開放中建案與成團進度，導向 `/booking?group=<id>`；資料來自 `group_projects`
- **Booking**：預約 CTA，導向 `/booking`

其他獨立頁面：

| 頁面 | 說明 |
| --- | --- |
| `About.tsx` | 關於我們獨立頁 |
| `Faq.tsx` | 常見問題 |
| `GroupHub.tsx` | 團報專區 `/group`（流程說明＋所有開放中的團報建案＋提出新建案） |
| `GroupProject.tsx` | 單一建案團報頁 `/group/<slug>`（進度、加入團報、分享到 LINE／複製連結） |
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

- **2026-09-19（後台總覽：近期預約移到最上方）** — 使用者要求把後台「總覽」最下方的「近期預約」（最新 5 筆，點擊可開啟該筆預約）移到總覽最上方，因為這是最常用的資訊。`OverviewDashboard.tsx` 將該區塊移到根容器的第一個子節點，其餘區塊（手機版營收概況、關鍵指標、趨勢圖、各項分布）順序不變。此元件桌機與手機共用，所以手機版的總覽也一併調整（接在頂端精簡統計列之後）。
- **2026-09-19（後台手機版修正）** — 用 390 像素寬的框（`iframe` 載入 `/admin`，沿用管理員登入狀態）逐頁檢查後台手機版（7 個分頁皆無橫向溢出），發現並修正四個問題：
  1. **手機上進不去「團報管理」「營收狀況」**：底部導覽只有 總覽／預約紀錄／新增／名額管理／設定（「時段管理」只能從名額管理頁的按鈕進入）。`MobileBottomNav.tsx` 最右邊的「設定」改為「更多」，點開底部面板列出 時段管理、團報管理、營收狀況、管理者設定（與桌機側邊欄一致）；目前分頁在「更多」內時該按鈕會高亮。
  2. **團報管理、時段管理在手機上表格被擠壓**（建案名稱一字一行、狀態標籤直排、操作按鈕被切在右邊）：`GroupBuyingAdmin.tsx`（建案清單、待審核提案、成員清單視窗）與 `Admin.tsx` 的時段管理，手機改成卡片式（`md:hidden`），桌機維持表格（`hidden md:block`）；團報的操作按鈕抽成 `renderActions`，表格與卡片共用。
  3. **每個分頁最上面都先出現一整屏統計卡片**：手機上改為只有「總覽」與「預約紀錄」顯示那排統計，其他分頁直接看內容（桌機每頁仍顯示）。**追加（使用者回報「每個分頁最上面都有一整屏統計卡片」）**：「總覽」與「預約紀錄」的統計卡片在手機上仍是兩排大卡片、佔滿一個螢幕，改為手機上單排四欄的精簡版（小內距、隱藏圖示、較小數字；`grid-cols-4 gap-2`、`p-3`），桌機維持原本的大卡片。
  4. **預約類型顯示原始代碼 `newfirst_recheck`（手機與桌機都有）**：`admin/types.ts` 的 `inspectionLabels` 缺這個類型（預約表單勾選「加購複驗」時會寫入），補上「新成屋初驗 + 複驗方案」，同時補進 `inspectionOptions`，「檢測類型」篩選與新增／編輯預約也可選。
  - **未涵蓋**：「新增預約」「名額單日設定」等視窗在手機上的樣子、真機（iOS Safari／Android Chrome）的觸控與字體大小；本次是以寬度模擬，仍需在實機確認。
- **2026-09-19（團報專區與各建案專屬頁面）** — 依 SEO 討論的方向，把團報從首頁一個區塊擴充成完整專區，並取代刪除的 `/contact`。
  - **資料庫**（新 migration `20260919140000_group_project_slug.sql`，已套用）：`group_projects` 新增 `slug`（唯一、不可為空；保留中文與英數，空白與 `/ \ ? # % & +` 換成 `-`，撞名加 `-2`、`-3`）。既有建案已回填（如 `大亮泊`、`三松-jade-park`）；新增時由 trigger 自動產生，**訪客提案一律由系統產生、不能自訂**，管理員／後端可自訂。已用「交易內測試後回滾」驗證回填、特殊字元、撞名、管理員自訂、訪客不能自訂。
  - **頁面**：`/group` 團報專區（`GroupHub.tsx`）與 `/group/:slug` 建案頁（`GroupProject.tsx`：進度條、加入團報、分享到 LINE／複製連結、團報流程、BreadcrumbList 結構化資料、每頁獨立標題描述與 canonical；找不到或已關閉的建案顯示說明並設 `noindex`）。可重用元件放 `src/components/group/`（`GroupProjectCard`、`ProposeGroupDialog`、`ShareButtons`、`GroupHowItWorks`），資料讀取 `src/hooks/useGroupProjects.ts`，`formatDiscount`／`groupPath`／`groupUrl` 在 `src/lib/group.ts`。首頁的團報區塊改用同一批元件並加「團報專區與流程說明」連結；導覽列「建案團報」改連 `/group`；`/contact` 導向 `/group`。
  - **後台**「團報管理」：建案名稱下顯示頁面路徑，新增「複製建案頁面連結」按鈕（貼到社區群組用）。
  - **sitemap**：`scripts/generate-sitemap.ts` 建置時向 Supabase 讀取「開放中」建案的 slug，加入 `/group` 與各 `/group/<slug>`（`<loc>` 已編碼）；讀取失敗只警告、不讓建置失敗。**限制：新增或關閉建案後，sitemap 要等下次部署才會更新。**
  - **連結預覽（LINE／Facebook）**：這些爬蟲不執行 JavaScript，只讀原始 HTML。新增 Vercel 函式 `api/group-meta.js`，`vercel.json` 只把爬蟲的 User-Agent（`facebookexternalhit`（LINE 的預覽爬蟲也是這個）、`Facebot`、`Twitterbot`、`Slackbot`、`Discordbot`、`TelegramBot`、`WhatsApp`、`LinkedInBot`）對 `/group/:slug` 的請求轉過去，回傳該建案自己的標題、描述（含已報名戶數）與分享圖；一般訪客與 Google 不經過這裡（走 SPA）。函式讀資料庫用 `VITE_SUPABASE_URL`／`VITE_SUPABASE_PUBLISHABLE_KEY`（Vercel 已為建置設定），讀不到時回一般的團報預覽而不是壞掉的卡片；快取 5 分鐘。
  - 測試：`tsc`、`eslint`、`npm run build` 通過；`api/group-meta.js` 已在本機以真實資料測過（有／無此建案、HTML 特殊字元轉義）。
- **2026-09-19（移除 `/contact` 頁）** — 使用者不知道有這頁，決定刪除。原因：這頁顯示的電話 `+86 10-1234 5678`（中國號碼）、信箱 `hello@homeinspection.tw`、地址「北京市朝陽區建國路 88 號 建外 SOHO 寫字樓 A 座 1206 室」、營業時間都是 Lovable 範本的示範資料，並非診斷室驗屋的真實資訊；而且頁面內的聯絡表單是假的（`handleSubmit` 只寫了 `Simulate form submission`：等 1 秒後跳出「消息已發送」，資料沒有送到任何地方，曾在此頁填表的訪客訊息會遺失）。導覽列與頁尾原本就沒有連到這頁。處理：刪除 `src/pages/Contact.tsx`、`App.tsx` 的 lazy import 與路由，`/contact` 改為 `<Navigate to="/group" replace />` 導向團報專區（最初導向首頁，同一次上線時改為團報專區）（因為它在 sitemap 內、可能已被搜尋引擎收錄，直接變 404 較差），並從 `scripts/generate-sitemap.ts` 移除，重新產生 sitemap；README 的頁面結構表同步移除。目前對外聯絡管道為官方 LINE（`LINE_OA_URL`）與預約表單。
- **2026-09-19（SEO：分享預覽圖與本地商家結構化資料）** — 延續前一筆 SEO 修正。
  - **分享預覽圖**：新增 `public/og-image.jpg`（1200×630，約 140 KB，以 HTML/CSS 排版＋Chrome 截圖製作，素材為既有的 Logo、首頁驗屋師照片與網站配色，文案取自頁尾標語與服務範圍，未新增宣傳語）。用途：把網站連結貼到 LINE／Facebook／Threads 時的連結預覽大圖。`src/config/site.ts` 新增 `DEFAULT_OG_IMAGE`／`DEFAULT_OG_IMAGE_ALT`，`<Seo>` 沒指定圖片時自動使用；`Journal.tsx`、`BookingPage.tsx`（自己用 Helmet）補上同一張；診斷筆記文章仍用各自的封面圖。`index.html` 也寫了 `og:image`／`og:url`／`twitter:image` 靜態預設值（帶 `data-static-seo`，給不執行 JavaScript 的 LINE／Facebook 爬蟲；前端啟動後由 `main.tsx` 移除、改由 `<Seo>` 輸出）。**換圖時用同檔名覆蓋 `public/og-image.jpg` 即可，不用改程式**（LINE／Facebook 有快取，換圖後可能要等一陣子或到各平台的除錯工具重新抓取）。
  - **首頁「本地商家」結構化資料**（`Index.tsx`，schema.org `ProfessionalService`）：名稱、網址、Logo、描述、服務範圍（依常見問題頁：台中以北及花蓮、台東）、官方 LINE。**刻意沒有放電話、信箱、地址**，因為 `/contact` 頁目前顯示的是範本示範資料（見下）。
  - **發現的問題已在下一筆處理**：`/contact` 頁的電話、信箱、地址是範本示範資料（見下一筆）。
- **2026-09-19（SEO：修正舊網域、補各頁標題）** — 使用者詢問如何增加曝光度，先檢視現有 SEO 基礎，發現兩個實質問題並修正：
  1. **`診斷筆記` 列表／每篇文章、`預約` 頁的 canonical、`og:url`、JSON-LD 全部寫死舊的 Lovable 網域 `hushed-haven-stays.lovable.app`**：等於告訴 Google 這些頁面的正本在另一個網站，排名與流量會算到舊網域而不是現在的網站。改為統一讀新增的 `src/config/site.ts` 的 `SITE_URL`（`Journal.tsx`、`JournalArticle.tsx`、`BookingPage.tsx`）；`scripts/generate-sitemap.ts` 也改讀同一個值。**日後換成自己的網域，只要改 `src/config/site.ts` 的 `SITE_URL` 並同步 `public/robots.txt` 的 `Sitemap:` 行。**
  2. **首頁、關於、常見問題、聯絡、404 都沒有各自的標題／描述／canonical**，全部沿用 `index.html` 的同一組（Google 會看成重複內容）。新增可重用的 `src/components/Seo.tsx`（title、description、canonical、`og:*`、`twitter:*`、`robots`，支援 `noindex`），並套用到這些頁面，各給獨立的標題與描述；404 設為 `noindex`。
  - **上線後驗證發現的追加修正**：`index.html` 寫死的 `description`／`og:*`／`twitter:card` 會和 Helmet 輸出的並存，同一頁出現兩組重複標籤（實測常見問題頁標題是新的、description 卻是首頁那句）。這些靜態標籤加上 `data-static-seo` 屬性（保留給不執行 JavaScript 的爬蟲當預設值），前端啟動時由 `src/main.tsx` 移除，改由各頁 `<Seo>` 輸出。
  - **尚未做（規劃中）**：`og:image` 分享預覽圖（需要品牌圖）、首頁「本地商家」結構化資料、每個團報建案的專屬公開頁面、預先渲染（prerender）讓 LINE／Facebook 爬蟲讀得到各頁標題、自訂網域、Google 商家檔案／Search Console。
- **2026-09-19（實測後修正）** — 用真實團報預約＋真實 LINE 綁定實測 A（通知）與 B（LIFF 憑證驗證）：通知標記已寫入、LINE 綁定成功且收到憑證、團報單價格維持 $7,777（未被扣 $500）。實測抓到兩個問題並修正：
  1. **團報單的折扣文字誤導**：綁定成功頁（`LineBookingBinder.tsx`）與 LINE 預約憑證（`bind-line-booking`）原本一律寫「已套用 LINE 好友折價 $500」，但團報訂單不與 LINE 折價並用。改為後端回傳 `is_group`，團報單顯示「依成團戶數計價（不與 LINE 好友折價並用）」，`discount_applied` 對團報單為 false；綁定中的提示文字也不再預先承諾 $500。
  2. **新版部署後舊頁面整頁空白**：Console 錯誤 `Failed to fetch dynamically imported module: BookingPage-….js`——訪客開著舊版頁面、Vercel 發布新版後舊 chunk 檔名不存在，點擊載入該頁面時 React 整棵樹卸載成空白（前面兩次「預約頁空白」都是這個原因，發生在我剛 push 完新版時）。`src/main.tsx` 新增 `vite:preloadError` 監聽：偵測到 chunk 載入失敗時自動 `location.reload()` 一次改載新版，用 `sessionStorage` 旗標避免無限重整（載入成功 10 秒後清旗標）。
- **2026-09-19（資安：LINE 綁定 `bind-line-booking`）** — 原本客戶端直接告訴後端「我的 LINE ID 是 X」，後端不驗證真偽，且已綁定的訂單可被改綁成別的 LINE 帳號。改為：前端 `LineBookingBinder.tsx` 傳 `{ booking_id, access_token }`（`access_token` 為 `liff.getAccessToken()`），後端拿憑證向 LINE `GET /v2/profile` 取得真正的 `userId`／`displayName`（憑證無效回 401），完全不採用客戶端自報的 LINE ID；若設定了環境變數 `LINE_LOGIN_CHANNEL_ID`，還會先呼叫 LINE `oauth2/v2.1/verify` 確認憑證屬於我們的 LINE Login channel（尚未設定時略過，可日後補設）；只允許綁定 72 小時內建立的訂單；已被其他 LINE 帳號綁定的訂單回 409 不可改綁（同一人重複綁定照常處理）；錯誤回應不再洩漏內部訊息。價格邏輯不變（仍沿用資料庫算好的 `discounted_price`，團報單不會被扣 $500）。
  - **測試**：憑證無效的拒絕路徑以正式站 API 測過；「真的在 LINE 裡綁定」需用真實 LINE App 走一遍（由使用者實測）。
  - **回退方式**：若 LINE 綁定出問題，`git revert` 這次 commit 後重新部署 `bind-line-booking` 即可恢復舊行為。
- **2026-09-19（資安：套件漏洞）** — 執行 `npm audit fix`（不含 `--force`，只更新 `package-lock.json`，`package.json` 未變）：正式環境依賴的漏洞從 13 個（11 個高風險，含 `glob`、`lodash`、`minimatch`、`nanoid`、`picomatch`、`postcss`、`ws`、`@remix-run/router` 等）降到 2 個中風險；`npx tsc --noEmit`、`npm run build` 通過。**刻意不處理的殘留項**：`react-router`／`react-router-dom` 6.x 的兩個中風險（`<Link>`／`useNavigate` 反斜線 open redirect、SSR hydration 的 `deserializeErrors`），修法是升級到 v7（大版本、有破壞性變更）；本站沒有把使用者可控網址傳給 `<Link>`／`navigate`（導向網址都寫死），也沒有 SSR，實際不可利用，故暫不升級；日後若要升 v7 需另外規劃並完整測試路由。另開啟 GitHub Dependabot 安全更新，之後有漏洞會自動開 PR。
- **2026-09-19（資安：LINE 通知與 webhook）** — 資安檢視發現三個 LINE 相關 Edge Function 都是 `verify_jwt: false`（任何人不帶金鑰即可呼叫），其中 `send-line-notification` 可被用來對內部 LINE 群組灌假的「新預約」卡片、對任意 LINE 使用者推播、消耗 LINE 訊息額度。本次先修 `send-line-notification` 與 `line-webhook`（`bind-line-booking` 的 LIFF 憑證驗證需要用真的 LINE 實測，另案處理）。
  - **`send-line-notification`**：改成只接受 `{ booking_id }`，通知內容一律由資料庫的訂單資料組成（新增 `_shared/booking-notification.ts`，純函式、已在本機以範例資料測過），不再採用客戶端傳來的姓名／電話等欄位；只處理「10 分鐘內建立」的訂單，且用原子式更新新欄位 `booking_requests.admin_notified_at`（新 migration `20260919130000_booking_admin_notified_at.sql`）確保每筆訂單只通知一次（推播失敗會放回未通知狀態以便補發）；移除原本沒有正常用途的 `user_line_id` 客戶推播分支；錯誤回應不再洩漏內部訊息。訊息新增「團報建案」與「預估費用」兩列。前端 `BookingForm.tsx` 改成只傳 `booking_id`。
  - **`line-webhook`**：若設定了 `LINE_CHANNEL_SECRET`，用 `x-line-signature`（HMAC-SHA256）驗證請求，不符回 401（演算法已在本機以正確／錯誤簽章／內容被改／缺簽章／錯誤密鑰五種情境測過）；尚未設定時維持原行為並在日誌留警告。**若要啟用，需到 LINE Developers 後台複製 Channel secret，執行 `supabase secrets set LINE_CHANNEL_SECRET=...`。**
  - `supabase/config.toml` 明確寫出三個函式刻意 `verify_jwt = false` 的原因（LINE 平台與匿名訪客不會帶 Supabase JWT）。
  - **已知空窗**：前端先上線、函式後部署，中間及仍開著舊版頁面的訪客送出預約時，訂單會成功但內部群組收不到通知（後台照常看得到）。
  - **尚未處理**：`bind-line-booking`（客戶端自報 LINE ID、已綁定訂單可被改綁）、`npm audit` 套件漏洞、儲存庫公開／`main` 分支保護／Dependabot。
- **2026-09-19（資安）** — 收緊訪客新增預約訂單的規則（新 migration `20260919120000_harden_public_booking_insert.sql`，已用 `supabase db push` 套用到正式庫）。原因：資安檢視發現 `booking_requests` 的訪客新增政策 `with check` 是 `true`，任何人拿公開的 anon key 直接打 API 就能寫入任意內容（價格、狀態、`group_project_id` 等），前端的隱藏欄位／最短停留時間擋不住；團報上線後還可能有人灌 3 筆假訂單讓整團成團、全團被調成 9 折。
  - **RLS**：訪客只能寫 `status=pending`、`source=web`、不帶 LINE 欄位與備註、日期不得為過去、欄位有長度上限的訂單；加入團報時建案必須是 `active`。
  - **`enforce_public_booking_rules` BEFORE INSERT trigger**（僅約束 anon 與非管理員登入者；管理員、`service_role`、直接連資料庫者 `auth.role()` 為 null 皆放行）：忽略客戶端送來的價格，由資料庫依房屋類型／坪數／複驗自行計算（新成屋 $7,777、中古屋 $10,000、複驗 +$3,000、超過 20 坪每坪 +$400；一般預約再扣 LINE 好友價 $500，團報不扣，成團折扣仍由 `booking_group_pricing` 處理）；伺服器端檢查日期是否封鎖、時段是否存在且啟用、是否額滿（同日期＋時段用 advisory lock 排隊，避免同時搶最後名額超收）；頻率限制：同電話 1 小時最多 5 筆、全站 `web` 來源 10 分鐘最多 60 筆。
  - **`limit_pending_group_proposals` trigger**：待審核的團報提案上限 30 筆。
  - **!! 維護注意**：價格公式在前端 `BookingForm.tsx`（`BASE_PRICE`／`REINSPECTION_PRICE`／每坪 $400／LINE 折 $500）與這個 migration 的 trigger 各有一份，**調整價格時兩邊都要改**，否則客戶看到的價格與實際儲存的會不一致。
  - **驗證**：先在正式庫用「交易內執行 migration＋測試後回滾」測過 16 種情境（正常單、中古＋複驗、團報、假狀態／來源／過去日期／假建案／待審核建案／假房屋類型／封鎖日／不存在時段／額滿／同電話超額／訪客直接建立 active 建案，以及管理員、service_role、直接 SQL 寫入不受限），過程中發現第一版直接 SQL 連線（`auth.role()` 為 null）會被誤套用限制，已修正；套用後再用匿名金鑰打正式 API 確認假狀態、假來源（401）與假房屋類型、不存在時段（400）都被拒且沒有寫入任何資料。
  - **尚未處理的資安項目**：LINE 三個 Edge Function（`line-webhook` 簽章驗證、`send-line-notification` 防濫用、`bind-line-booking` 身分檢查）、`npm audit` 套件漏洞、儲存庫公開／`main` 分支保護／Dependabot。
- **2026-09-19（建案團報）** — 新增「建案團報」功能：同建案多戶各自預約，滿 3 戶後全團享 9 折（含先報的戶，價格追溯調整）。使用者決策：折扣時機＝滿門檻後全團追溯；團報不與「LINE 好友折 $500」並用；未達門檻時前端顯示原價＋「滿 3 戶享 9 折」；建案來源＝後台可建立，客戶也可提出新建案（待後台核准）。
  - **資料庫**（新 migration `20260919100000_group_booking.sql`，2026-09-19 已透過 Dashboard SQL Editor 套用到正式庫，並用 `migration repair` 標記 applied，`db push --dry-run` 為 `upToDate`）：新增 `group_projects` 表（名稱、區域、狀態 `pending`/`active`/`closed`、成團門檻 `min_units` 預設 3、折扣 `discount_rate` 預設 0.9、提出人資料、排序）；`booking_requests` 新增 `group_project_id`（刪除建案時 `on delete set null`）。RLS：訪客只能看 `active` 建案、只能新增 `pending` 且預設條件的提案；admin 全權。`recalc_group_pricing()`（security definer）依團內未取消戶數重算該團所有未取消訂單的 `discounted_price`／`price`（達門檻＝`original_price × discount_rate`，未達＝原價），由 `booking_requests` 的新增／刪除／狀態或 `group_project_id` 變更，以及 `group_projects` 的門檻／折扣變更觸發。`get_group_project_counts()` 讓匿名訪客只能取得開放建案的戶數（訪客沒有 `booking_requests` 的 SELECT 權限）。
  - **官網**：首頁 Pricing 後新增「建案團報」區塊（`GroupBuying.tsx`，導覽列新增「建案團報」錨點），列出開放中建案、已報戶數與成團進度，「加入團報」導向 `/booking?group=<id>`；另有「提出新建案團報」對話框（含防灌水的隱藏欄位＋最短停留時間）。若資料表讀取失敗整個區塊會自動隱藏。
  - **預約表單**（`BookingForm.tsx`）：帶 `?group=` 時載入該建案、鎖定建案區域／名稱、頂端顯示團報資訊；價格改用團報規則（不含 LINE 折扣）；LINE 通知的價格說明與成功頁文字改成團報版本。`bind-line-booking` Edge Function 在 `discounted_price` 已有值時直接沿用、不再扣 $500，所以不需修改。
  - **後台**：新增「團報管理」分頁（`admin/GroupBuyingAdmin.tsx`）：新增／編輯（門檻、折數）／開關／刪除建案、核准客戶提案、查看各建案成員與價格。
  - **已知限制**：`booking-intake` webhook 只在 INSERT／DELETE 觸發，成團後回頭調價（UPDATE）不會同步到驗屋系統；admin 手動改過的團報訂單價格，會在該團戶數或條件變動時被重算覆蓋。
  - **測試**：在正式庫用「交易內模擬後 rollback」驗證計價邏輯（1、2 戶原價；第 3 戶起全團 $7,777→$6,999；一般單不受影響；取消一戶後其餘還原；恢復後再度折扣；改 8 折後重算），確認無殘留資料。另以 CLI 在正式庫新增 5 個 `active` 測試建案（大亮泊、大華菁耕、長耀IPARK、三松 Jade Park、恦品-里山，取自 nday.com.tw 公開團購清單），前端上線後會公開顯示，不需要時到後台關閉。`npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-19** — 官網「驗屋費用」（`src/components/Pricing.tsx`）的「新成屋團報優惠」分頁拿掉價格顯示（使用者要求，因為團報折扣方案還在規劃中）：卡片上的 $6,888、原價 $8,000、「現省」標籤、單位與每坪 $400 說明全部移除，只保留「同社區 3 戶以上適用」與團報專屬服務內容；`Plan` 型別的 `price`／`unit` 改為選填，沒有價格時不渲染價格區塊。方案差異比較表「複驗服務」列的團報欄原本顯示 `$3,000 起`，改成打勾。`Faq.tsx` 的團報說明本來就沒寫價格，未動。`npx tsc --noEmit` 通過。
- **2026-09-15** — 補充記錄一個先前完全沒寫進這個 repo 的既有整合，並新增對應的 reference migration（`supabase/migrations/20260915100000_document_booking_intake_trigger.sql`，密鑰用 placeholder，已用 `migration repair` 標記 applied、不會被 `db push` 真的執行）：`booking_requests` 表上有一個 Database Webhook Trigger（名稱 `booking-intake`，AFTER INSERT OR DELETE），是直接在 Supabase Dashboard／SQL Editor 建在正式資料庫上的，從未寫進這個 repo。這個 trigger 會在 `booking_requests` 新增或刪除一筆資料時，呼叫另一個獨立系統「驗屋系統」（inspection-app repo，https://github.com/jason237855-del/inspection-app）的 Edge Function `booking-intake`，讓對方自動建立／刪除對應的驗屋場次：新增訂單 → 對方自動建案；刪除訂單 → 對方自動刪除對應案件（刪除同步是 2026-09-15 才加上的，之前只處理新增）。真正的 `x-webhook-secret` 密鑰值不寫進任何 git 檔案，請去 Supabase Dashboard → Database → Triggers → `booking-intake` 查目前值。**之後若異動 `booking_requests` 表結構、或整個重建這個 Supabase 專案，務必記得這個 trigger 要一併保留或重建，否則驗屋系統那邊就不會再自動同步訂單。**
- **2026-09-15** — 預約表單（`src/components/BookingForm.tsx`）送出成功畫面（step 4）的「再預約一筆」按鈕，改成「返回首頁」並導向 `/`（原本用 `onClick={handleReset}` 重置表單回到第一步，讓客戶原地再填一筆；改為直接離開表單、回首頁）。因為按鈕行為已改變，原本只有這個按鈕在用的 `handleReset`（重置所有表單欄位/步驟/預約 ID 的 function）不再有任何呼叫端，一併刪除避免留下死程式碼；按鈕改用 `Button asChild` 包一層 `react-router-dom` 的 `Link`，沿用既有的 outline 樣式。`npx tsc --noEmit` 通過。
- **2026-09-14** — 補齊 Supabase CLI 的本機設定，並修正 migration 追蹤紀錄（環境維護，非功能異動）。原本這台機器沒登入過 `supabase` CLI 也沒 link 過專案；補跑 `supabase login`（互動登入需要真正的終端機視窗，`!` 前綴的非互動環境跑不動）與 `supabase link --project-ref gzewuphhnxzyhiwnhjpm`。用 `supabase migration list` 檢查時發現正式資料庫**完全沒有** `supabase_migrations.schema_migrations` 追蹤表（這個專案的 schema 一直是用 Dashboard 手動下 SQL／Lovable 平台改的，從沒透過 CLI 的 migration 機制跑過），導致 CLI 誤以為全部 14 個 migration（含最早 2026-08-28 那批）都沒套用過；若當下直接 `supabase db push` 會逐一重跑，第一個 `create table` 就會因表已存在而報錯。實際查證（`supabase db query --linked` 查 `information_schema`／`pg_policies`）確認（八）（十一）兩筆的 `time_slots`／`time_slot_availability` 表、欄位、RLS policy、trigger 其實早就都在正式庫上，且 `time_slots` 已有 14 筆真實時段資料（非僅 migration 檔裡的 2 筆種子資料），代表這個功能已經上線被實際使用，先前（八）（十一）兩筆記錄裡「尚未套用到正式 Supabase」的註記已經過時、一併修正拿掉。最後執行 `supabase migration repair --status applied <14 個版本號>` 讓 CLI 的追蹤紀錄補上這 14 筆（純粹同步紀錄，未對資料庫做任何 schema 變更），`supabase db push --dry-run` 確認 `upToDate: true`。之後這台機器可以正常用 `supabase db push` 套用新 migration。
- **2026-09-13（十三，重要）** — 修正客戶預約表單送出後會噴出 `ReferenceError: setBookingCounts is not defined` 的正式站 bug。這是（八）那次做「時段管理」功能時，把 `BookingForm.tsx` 的名額狀態從單一的 `bookingCounts`/`setBookingCounts` 改成分時段的 `slotCountMap`/`setSlotCountMap`，但漏改 `handleSubmit` 送出成功後、更新本地名額計數那一行，殘留呼叫了已經不存在的 `setBookingCounts`，一路推上了正式站。
  - **實際影響**：訂單本身**有**成功寫進資料庫（crash 發生在 insert 成功之後），但因為 crash 中斷了後續程式碼，緊接著要呼叫的 `send-line-notification`（通知內部 LINE 群組）**沒有執行到**，客戶端也不會看到預約成功的畫面，體驗上像是「送出失敗」。
  - **實測方式**：用使用者帳號在正式站 `/booking` 走完整流程送出一筆標記為測試的訂單，瀏覽器 Console 直接重現這個錯誤；比對後台「預約紀錄」確認訂單其實有進資料庫，且目前資料庫裡其餘既有訂單看起來都是先前測試用的資料（無法排除但未發現任何像是真實客戶的訂單卡在這個問題上）。修完後已把這筆測試訂單從後台刪除。
  - **修法**：改成正確更新 `slotCountMap`（依日期+時段記錄已預約數），不再引用不存在的變數。
  - `npx tsc --noEmit`、`npm run build` 皆通過，優先 commit + push，不等其他測試做完。
- **2026-09-13（十二）** — 新增 `/booking` 頁面自動跟隨系統深色/淺色模式（使用者要求，只限定這個頁面，其他頁面不受影響）。
  - 專案原本就有 `darkMode: ["class"]` 設定，`index.css` 也早就有一整組完整的 `.dark {...}` 深色 CSS 變數，只是從沒被啟用過；`src/components/ui/*`（Input／Select／Calendar 等）都只用語意化 token，理論上一加上 `dark` class 就會自動變深色，不用逐一手動加樣式。
  - 新增 `src/hooks/usePrefersDarkMode.ts`（比照既有 `usePrefersReducedMotion.ts` 寫法），偵測 `prefers-color-scheme: dark`。
  - `BookingPage.tsx` 掛載時依偵測結果把 `dark` class 加在 `document.documentElement`（`<html>`），離開頁面（unmount）時移除。之所以是切 `<html>` 而不是包一層 div：`BookingForm.tsx` 裡的 `<Select>`（如「房屋類型」欄位）用 Radix 的 Portal 直接掛到 `document.body`，如果只在頁面內部某個 div 上加 class，CSS 變數傳不到 Portal 那邊，下拉選單彈窗顏色會對不起來；切在 `<html>` 上、只在這個頁面掛載期間生效，可以同時解決這個問題又維持「只有這頁會變深色」。
  - `Footer.tsx` 原本用 `bg-foreground text-background`（刻意把語意顏色反過來用）做出「不管什麼模式頁尾都固定深色」的效果，如果整站都能切 `dark` class，`--foreground`/`--background` 深淺互換後頁尾會反過來變成刺眼的亮色 bar。改成兩個新的、**不放進 `.dark` 覆寫範圍**的固定 token（`--footer-background`／`--footer-foreground`，數值就是原本淺色模式下 `--foreground`／`--background` 算出來的顏色），頁尾外觀完全不變、也不受這次的深色模式開關影響。
  - `index.css` 裡 `.booking-form input/textarea` 原本用純 CSS 寫死文字顏色（`#1A1A1A`）、placeholder（`#888888`）、瀏覽器自動填入顏色，這些不會跟著 `dark` class 變化，深色模式下輸入框背景變深但文字還是被強制顯示深色、看不清楚；改成參照 `hsl(var(--foreground))`／`hsl(var(--muted-foreground))`／`hsl(var(--background))`。同時清掉一條孤兒 CSS 規則 `.booking-form .group:hover input::placeholder {...}`——這是稍早拿掉卡片 hover 變色效果時漏刪的殘留，卡片已經不會在 hover 時變深色了，這條規則留著也沒作用。
  - `Navigation.tsx` 沒有變動：它自己的明暗（`variant` prop／捲動狀態）邏輯是獨立的一套，不受這次改動影響。
  - `npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（十一）** — 兩項調整（使用者要求）：
  1. 拿掉預約表單卡片整個滑鼠懸停變色的效果（`BookingForm.tsx`）：原本整張卡片＋輸入框／下拉選單／方案按鈕／摘要區塊，滑鼠移上去會一起變成深色（`hover:bg-slate-900` 系列 + 對應的 `group-hover:*`），使用者回報這樣文字反而不明顯，全部移除，只保留卡片本身樣式；卡片上 `onMouseEnter/onMouseLeave` 觸發 `booking-hover` 自訂事件（用來讓固定導覽列在滑過預約卡片時保持顯示）維持不變，跟變色效果是兩件事。
  2. 後台「時段管理」新增可上下移動排序（使用者實測新增很多時段後，需要能自訂顯示順序，不想被綁死在依代碼字串排序）：`time_slots` 新增 `sort_order` 欄位（新 migration），既有資料依原本代碼排序回填初始值（間隔 10 方便之後插入）。後台清單新增排序欄位跟上/下箭頭按鈕，點擊會把該時段跟相鄰時段的 `sort_order`互換並存回資料庫；新增時段預設排在最後面。所有讀取 `time_slots` 的地方（後台名額管理、時段管理、客戶預約表單）都改成依 `sort_order` 排序，取代原本的代碼字串排序。
  - `npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（十）** — 修正「名額管理」單日設定視窗在時段很多時（使用者實測新增了 14 個半小時一個的時段）沒辦法上下滑動的問題：`Admin.tsx` 的 `DialogContent` 原本沒有限制高度也沒開 `overflow`，時段一多內容直接撐爆視窗高度，看不到也捲不到後面的項目。加上 `max-h-[85vh] overflow-y-auto`，超過視窗高度時視窗內部可以獨立捲動。`npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（九）** — 修正兩個問題（使用者實測回報）：
  1. 新增時段功能上線後 `localhost:8080/admin` 整頁空白：`Admin.tsx` 的 `lucide-react` icon import 清單裡 `Clock` 被重複列了兩次（同一個 import 陳述式裡出現兩次同名），瀏覽器執行時噴出 `Uncaught SyntaxError: Identifier 'Clock' has already been declared`，導致 React 完全沒 mount。移除重複的那一個即可。
  2. 後台「名額管理」月曆格子的日期跟現實對不上（例如 2026 年 9 月 13 日明明是週日，卻被畫在「五」那一欄）：`calendarDays`（`Admin.tsx`）本來是 `eachDayOfInterval({start: startOfMonth, end: endOfMonth})` 直接產生「這個月每一天」的陣列，不管當月 1 號實際上是星期幾，畫格子時永遠讓 1 號從第一格（週日欄）開始排，等於每個月都可能整排位移。修法：用 `date-fns` 的 `getDay(startOfMonth(currentMonth))` 算出 1 號是星期幾，畫格子前先補對應數量的空白格，讓日期跟星期標題對齊。這是既有的舊 bug，這次剛好在測新功能時被發現一併修掉；`RevenueDashboard.tsx`／`OverviewDashboard.tsx` 裡其他用到 `eachDayOfInterval` 的地方都只是加總數字、不是畫週曆格子，沒有同樣問題。
  - `npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（八）** — 新增後台「時段管理」功能，讓時段可以自訂新增、每個時段各自設定每日名額，取代原本「一天只有一個共用名額」的設計。
  - **資料庫**（新 migration `20260913081608_...sql`）：新增 `time_slots`（時段清單：代碼、顯示名稱、預設每日名額、啟用狀態）與 `time_slot_availability`（某天某時段的名額覆寫，`(date, time_slot_id)` 為主鍵）兩張表，RLS 比照既有 `booking_availability` 寫法（公開可讀、僅 admin 可寫）。種子資料建了原本寫死的兩個時段（09:00 上午場／14:00 下午場），不影響既有預約。舊的 `booking_availability.max_slots` 欄位保留但前端不再讀寫，日期層級的「不開放預約」開關不變。
  - **後台**（`Admin.tsx`）：新增「時段管理」頁籤（桌機側邊欄、手機從「名額管理」頁面按鈕進入），可新增／編輯／刪除／啟用停用時段。「名額管理」單日設定對話框從單一「每日可預約名額」改成列出每個啟用時段各自的名額輸入框；批次設定的「統一名額」改成套用到選取日期 × 所有啟用時段。月曆格子與「總覽」頁的名額使用率不用改內部邏輯，只是資料來源換成「各時段名額加總」。
  - **`BookingEditorDialog.tsx`**（後台手動新增/編輯預約）：時段下拉選單改用同一份動態時段清單，取代原本寫死的 `morning`/`afternoon`/`evening`（這組跟客戶端表單原本用的 `09:00`/`14:00` 是兩套不一致的資料，這次一併統一，歷史預約紀錄的顯示不受影響，`types.ts` 保留 `legacyTimeSlotLabels` 純供舊資料顯示用）。
  - **客戶預約表單**（`BookingForm.tsx`）：時段選項改成即時抓取後台設定的啟用時段；名額判斷從「整天共用一個名額」改成「每個時段各自判斷」，某時段額滿只會停用該時段按鈕（顯示「已額滿」），同一天其他時段仍可預約；只有當天所有時段都額滿，日期選擇器才會整天鎖住。
  - `npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（七）** — 修正（六）引入的新問題：使用者回報「打開選單的時候會先變圓形才變方形」。原因是（六）把 `border-radius` 加進外層卡片的 CSS transition 屬性清單，讓圓角也跟著 500ms 平滑過渡；但打開選單時，卡片高度是從 0 長到滿版內容高度（同樣 500ms），圓角數值同時從 `rounded-full`（換算成很大的 px 值）過渡到 `rounded-3xl`（24px）。CSS 的 `border-radius` 實際繪製時會被裁切到不超過「寬/高的一半」，在動畫剛開始、高度還很矮的那幾幀，圓角的數值還沒降到 24px、遠大於當下矮高度的一半，畫面上就會被裁成「圓角＝高度一半」的橢圓／圓形，直到高度長夠高、圓角數值也降下來後才「鬆開」變回正常圓角矩形——這就是「先圓後方」的成因。收合時看不到同樣問題，是因為收合是先把高度收到接近 0 之後才切換圓角，順序反過來，不會有中間態。修法：把 `border-radius` 從過渡清單移除，改回「直接切換、不做動畫」，只保留高度本身的平滑動畫，兩者不再互相影響。`npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（六）** — 修正（五）的 `layout` 動畫方案本身造成更嚴重的視覺問題：使用者截圖顯示選單收合瞬間畫面會整個「放大、拉伸糊掉」。原因是 framer-motion 的 `layout` 動畫在偵測到容器尺寸變化時，是用 CSS `transform: scale(...)` 把整個子樹（包含文字、logo）先縮放到舊尺寸再插值過渡到新尺寸（FLIP 技巧），對純色矩形沒問題，但對文字/圖片這種內容用 transform 硬縮放會整個被拉伸模糊，不能用在這個有文字內容的卡片上。撤掉 `layout`，改成從根本换掉選單內容的動畫方式：原本用 `clipPath: inset(...)` 做「布幕」效果，這種寫法只是視覺上遮住內容、不會讓元素本身的版面高度跟著變化，所以選單關閉時，真正的高度收合是等 `AnimatePresence` 把整個 `motion.div` 從 DOM 移除那一刻才瞬間發生，跟外層卡片同時切換的圓角/背景色兜在一起，就是（五）那則問題的卡頓根源。現在把內容動畫改成真的 `height: "auto" → 0`（搭配 `overflow-hidden`、原本的 `mt-4` 改成內層 `pt-4` 避免 margin-collapse 讓 `height:0` 量不出正確高度），高度會平滑地實際收縮到 0，不再是瞬間消失；外層卡片的圓角/背景色 transition 也從 700ms 對齊成 500ms，跟內容收合時間一致，`onExitComplete` 觸發切換圓角/背景時，箱子已經平滑縮小到底，不會再有可感知的跳動。`npx tsc --noEmit`、`npm run build` 皆通過。
- **2026-09-13（五）** — 修正（四）之後使用者回報「選單收起來的時候會有點卡」：`menuChromeOpen` 在 `onExitComplete` 那一刻才切回 `rounded-full`／小尺寸，但選單卡片的「高度」變化（因為選單項目那個 `motion.div` 從 DOM 移除）跟「圓角、背景色」的 class 切換是同一瞬間發生、且沒有任何過渡效果，等於收合動畫播完的那一刻畫面直接「跳」一下，這就是卡頓感的來源。當時的修法是把選單外層容器改成 `motion.div` 並加上 framer-motion 的 `layout` 動畫——事後證實這個方向有嚴重副作用（見上面（六）），已撤掉改用別的做法。
- **2026-09-13（四）** — 補修上一筆（三）的手機導覽選單圓角 bug：靜態展開時已經正常，但點選單項目（例如「診斷項目」）觸發導航＋收合選單時，收合動畫過程中又會短暫出現同一種大圓形背景。原因是 `isMobileMenuOpen` 一變成 `false`，選單外層容器的 class 立刻切回 `rounded-full`，但選單內容的 `motion.div` 是靠 `AnimatePresence` 的 `exit` 動畫（`clipPath` 收合，0.6 秒）才真正從 DOM 移除，這 0.6 秒期間容器裡的選單項目其實還在版面上占著高度，形狀卻已經變成 `rounded-full`，等於重現了同一個「高長方形套 rounded-full＝圓形」問題。修法：新增 `menuChromeOpen` state，開啟選單時立刻設為 `true`（跟 `isMobileMenuOpen` 同步），但只在 `AnimatePresence` 的 `onExitComplete`（收合動畫真正播完那一刻）才設回 `false`；容器的圓角／背景 class 改依 `menuChromeOpen` 判斷，`isMobileMenuOpen` 只控制選單內容的顯示與漢堡／叉叉圖示。`npx tsc --noEmit` 通過。
- **2026-09-13（三）** — 修正手機版導覽列點開選單背景變成一個不完整大圓形、選單最後一項「常見問題」被切在圓形外、底部還透出背景 CTA 按鈕與房屋線稿的問題（使用者截圖回報）。根源在 `Navigation.tsx` 選單背景的 `<div>`：形狀 class 分別來自兩個獨立的三元判斷式，第一個（依 `isScrolled`）不管哪個分支都固定帶 `rounded-full`，第二個（依 `isMobileMenuOpen`）在選單展開時想蓋成 `rounded-3xl`，兩個 class 同時出現在同一個字串裡。Tailwind 的 `borderRadius` 工具類在編譯後的 CSS 裡是照內建尺度順序（...`3xl`、`full`）排列，`rounded-full` 一定排在 `rounded-3xl` 後面、CSS 規則後蓋前，所以無論 JSX 裡怎麼寫，選單打開時實際生效的永遠是 `rounded-full`。選單內容（六個連結+按鈕）撐出一個很高的長方形，套用 `rounded-full` 會讓四個角的圓角半徑等於寬度一半，變成兩側整個往內收成圓弧，形成截圖裡那種「大圓形」，圓弧收進去的地方沒有背景色，就露出下面頁面內容，最後一項文字也因此看起來被切在圓弧外。修法：把 `rounded-full` 從「依 `isScrolled`」那組三元判斷式移除，只保留 padding／陰影，改成只在「依 `isMobileMenuOpen`」那組三元判斷式的三個非展開分支各自補上 `rounded-full`、展開分支維持 `rounded-3xl`，讓兩個判斷式合起來任何時候都只會出現一個圓角 class，不再互搶。桌機導覽列樣式（`isScrolled`／`isDark` 邏輯本身）沒有變動。`npx tsc --noEmit` 通過。
- **2026-09-13（二）** — 修正首頁 Hero 手機版兩個排版問題（使用者用真機透過區網 dev server 截圖回報）：(1) 導覽列下方留白過大：`HeroSection.tsx` 原本手機版也用 `items-center` 讓內容在整個 `min-h-[92svh]` 區塊垂直置中，疊加上為了避開固定導覽列而加的 `pt-28`，等於「置中留白」和「導覽列避讓留白」疊加成過大的空白，改成手機版 `items-start`（`md:items-center` 維持桌機置中不變），內容緊接在 `pt-28` 之後，不再多留一段置中空白。(2) 手機版空白區塊裡還飄著孤立的 "SCAN"、"±0.2mm" 文字圖示：`InspectionElements.tsx` 裡這些標註圖示（`scanline`／`laser-level`／`humidity`）的座標是照桌機版房屋位置（`top-1/2 left-[64%]`）圍繞著擺的，但手機版房屋線稿早就被移到 `top-[78%]`（見 2026-09-11 那筆修正），這三個圖示留在原本 15%／30%／36% 的高度，變成飄在房屋搬走後的空白區。原本 `visibleFrom: "always"` 改成 `"md"`，手機版不顯示，只在平板以上顯示。(3) CTA 按鈕（立即預約驗屋／了解服務）疊在房屋線稿上，實心按鈕背景把線稿蓋住一半：本質原因是 (1) 的置中留白把 CTA 按鈕列推到跟房屋同一個垂直帶（房屋在 `top-[78%]`）。改成 `items-start` 後內容整體上移，同時把 `HeroVisual.tsx` 手機版房屋位置從 `top-[78%]` 微調到 `top-[85%]`，讓房屋落在內容區塊下方、CTA 按鈕結束之後的空白處，不再重疊。桌機版（`md:` 以上）三處都沒動。`npx tsc --noEmit` 通過；因區網 LAN 預覽在使用者的手機熱點環境下有連線限制（見下方＊），改由使用者自行用手機連 dev server 的 LAN 網址（`http://172.20.10.3:8080/`）截圖驗證。
  ＊補充：使用者當下電腦是連手機的個人熱點（IP `172.20.10.x` 網段），這種環境下由熱點來源手機直接連回電腦的 LAN 位址不一定通（部分電信/機型的個人熱點會做用戶端隔離），曾嘗試用 `localtunnel` 建立對外公開網址協助預覽，但這類「對外連線／ingress tunnel」動作被 Claude Code 的自動模式權限擋下，需使用者另外核准才能執行；後續使用者確認同網路下 `172.20.10.3:8080` 本身是通的，所以最終還是用區網網址驗證，未使用 tunnel。
- **2026-09-13** — 首頁 Hero 統計數字區（`src/components/hero/HeroStats.tsx`）第二格從佔位數字「10+ 年專業經驗」改成客戶提供的真實數據「24小時內 發送電子檢測報告」（`value: 24, suffix: "小時內"`），其餘三格（3,000+ 累積檢測戶數／11,111+ 發現缺失與異常／30+ 專業檢測項目）仍是待確認的佔位數字，維持不動。同步更新服務地區文案：頁尾（`Footer.tsx`）與 `/faq` PART 05（`Faq.tsx`）的服務範圍從原本僅雙北／桃園／新竹／基隆／宜蘭，擴大為「台中以北（含苗栗、台中）＋花蓮、台東」，反映客戶提供的實際服務範圍。另外依客戶提供的參考圖，在 `HeroStats.tsx` 四格統計數字上方各加一個 `lucide-react` icon（依序：`FileSearch`／`Clock`／`AlertTriangle`／`ClipboardCheck`），純視覺補充，數字與文字內容不變。
- **2026-09-11** — 修正首頁 Hero 手機版排版錯誤：`HeroVisual.tsx` 中央抽象線條房屋插畫原本手機版（`<768px`）用 `top-[44%]` 置中在整個 Hero 區塊正中間，跟標題文字「看見問題，不只指出問題。」的高度重疊，插畫線條直接畫在標題上（桌機版因為有左右兩欄配置，房屋插畫在 `md:left-[64%]` 不會壓到文字，所以沒事，只有手機單欄排版才會撞在一起）。使用者手機截圖確認問題後修正：手機版的插畫容器改成 `top-[78%]`（移到文字/按鈕區塊下方）、寬度從 `220px` 縮到 `170px`、不透明度加上 `opacity-40`（`md:opacity-100` 桌機不受影響），讓插畫在手機上變成文字下方的淡化背景裝飾，不再蓋到標題。`npx tsc --noEmit` 通過；因為這次瀏覽器自動化工具的視窗縮放（`resize_window`）在本機環境實測沒有真的改變 viewport（截圖與 `window.innerWidth` 都還是桌面寬度），無法用工具自行截圖驗證手機版，改成啟動本機 dev server（`--host`）讓使用者用手機連區網 IP 實機確認過畫面正常。
- **2026-09-11** — `/faq` 常見問題頁桌機／手機排版與左側分類說明調整（只動 `Faq.tsx`，導覽列、配色、字體、其他頁面都沒動）：(1) 桌機兩欄比例從 `minmax(0,280px)_1fr` 改成 `35%_1fr`，欄距改 60px；(2) PART 01 標題新增 `titleLines` 欄位強制兩行呈現（「驗屋前，」／「屋主們最常這樣問」），其餘 4 個標題加上 Tailwind `text-balance`（CSS `text-wrap:balance`）自動平衡換行避免孤字；(3) sticky `top` 從 112px 改成 120px；(4) 左側說明文字顏色從 `text-muted-foreground` 加深一階為 `text-foreground/75`，行高改 1.8；(5) 五組左側說明文字全部換成新版內容，PART 05 標題改回「費用、地區與預約」（上一版曾改成「驗屋費用、服務地區與驗屋優惠」，這次照指示改回）；(6) 各 PART 間距從固定 80px 改成手機 56px／桌機維持 80px，符合手機版 56–72px 間距需求；(7) 手風琴題目文字容器加 `min-w-0` 防止極端內容擠壓到收合圖示。Hero 與 PART01 間距（桌機 80px）本來就在需求的 80–96px 範圍內，未變動。`npx tsc --noEmit`／`npm run lint`／`npm run build` 皆通過。
- **2026-09-11** — `/faq` 常見問題頁全面更新內容，套用使用者提供的新版五大主題文案（`Faq.tsx` 的 `sections` 陣列）：PART 01~05 各新增 1 題，總題數從 19 題增加到 25 題（新增「驗屋前需要準備哪些資料？」「驗屋過程會破壞房屋或拆卸設備嗎？」「驗屋是否包含社區公共設施？」「需要提前多久預約驗屋？」「複驗後仍有缺失未改善，該怎麼辦？」「有提供社區多戶團報嗎？」6 題），其餘既有題目的問句/答案文字也同步更新為新版措辭；PART 05 標題從「費用、地區與預約」改成「驗屋費用、服務地區與驗屋優惠」；順手把 PART 04 第 4 題答案裡殘留的草稿註記（原本寫著「這裡最好在網站寫清楚，避免客戶認為複驗等於重新做一次完整驗屋」）換成使用者這次提供的正式文字。`npx tsc --noEmit` 通過。
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
