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

- **2026-09-07** — 後台管理系統（`/admin`）新增獨立的手機版介面（<768px，沿用既有 `useIsMobile()` 斷點），桌面版完全不變：(1) 新增 `src/components/admin/MobileBottomNav.tsx`，手機版改用底部固定導覽列（總覽／預約紀錄／中間浮動＋新增／名額管理／設定）取代原本頂部分頁籤；(2) 新增 `src/components/admin/MobileBookingDetail.tsx`，手機版點一筆預約進全螢幕詳情頁（取代原本的彈出視窗 Dialog），桌面版仍是 Dialog；(3) `OverviewDashboard.tsx` 的「本月新預約」「取消率」統計卡片加上跟上個月比較的漲跌徽章（用既有 `bookings` 資料裡的 `created_at` 前端算，沒多打 API），「待確認」「已確認」「名額使用率」因為沒有歷史快照/資料，不加假的比較數字；(4) 預約紀錄手機版清單簡化成單純點擊進詳情頁的列表列（狀態改成小圓點+徽章），原本卡片上的狀態下拉/編輯/刪除按鈕移到新的全螢幕詳情頁裡；(5) 手機版搜尋框改成頂部常駐的圓角搜尋列+篩選圖示按鈕。全程沿用專案既有的 `--primary`／`--secondary`／`--destructive` 色票，沒有引入設計參考圖（Dribbble Ecomiq）的橘色配色。`npm run build`／`tsc --noEmit` 皆通過；因為 `/admin` 需要管理員登入，實際手機版視覺效果需使用者自行登入後台確認。
- **2026-09-06** — 排查 Supabase Dashboard 的 Authentication → URL Configuration：Site URL 一直被設成當初串接 Vercel 時的舊 preview 部署網址（`https://inspection20-leo-8739.vercel.app`）。手動改回 `https://inspection20.vercel.app` 後會被自動改回去，查出來是 **Vercel 專案 Settings → Integrations 裡裝的「Supabase」Marketplace 整合**在搞的鬼（跟 Supabase Dashboard 裡「Settings → Integrations → Vercel」那個管環境變數同步的整合是兩個不同東西）：這個整合的 Webhook 會監聽 Vercel 的 Deployments/Domains 事件，抓到的「預設網址」是 Vercel 專案內建的 `<專案名>-<team slug>.vercel.app`，不是後來另外加的正式自訂網域，所以每次有新部署就會把 Site URL 蓋回去。目前確認 Supabase／Vercel 兩邊都沒有能單獨關掉這個行為的開關，只能整個移除該整合（會連帶失去環境變數自動同步），評估後**先不處理**——因為 `resetPasswordForEmail`／`signUp` 的 `redirectTo` 都有寫死正式網域，且 Redirect URLs 允許清單已包含 `https://inspection20.vercel.app/*`、`/reset-password`（Supabase 比對得到就不會退回用 Site URL），實測應該不影響現有功能，頂多信件範本如果用到 `{{ .SiteURL }}` 變數顯示網址文字會顯示成怪網址。之後如果要徹底解決，要去 Vercel 專案的 Integrations 頁移除 Supabase 整合。
- **2026-09-06** — `App.tsx` 除首頁外的頁面（`/admin`、`/auth`、`/booking`、`/journal` 等）改用 `React.lazy` + `Suspense` 動態載入。原因：`npm run build` 一直跳出「chunk 超過 500KB」警告，一般訪客進站不管看哪一頁都要把整個網站（包含後台管理系統的所有元件）一次下載完，載入速度受影響。拆開後主要進入點的 JS 從 1015KB（gzip 317KB）降到 506KB（gzip 165KB），`Admin.tsx` 那包 95KB 變成只有進 `/admin` 才會下載。
- **2026-09-06** — 補上帳號自助管理：(1) 新增 `/reset-password` 頁面 + `/auth` 的「忘記密碼」連結，走 Supabase `resetPasswordForEmail`；(2) `/auth` 的「註冊」入口原本因為 `adminExists` 判斷、只有網站還沒有任何 admin 時才會顯示，導致已經有 admin 之後新使用者完全無法自行建立帳號（上次朋友登入不了就是卡在這裡）——移除該限制讓註冊入口一直存在，並在註冊流程加上跟預約表單同樣的蜜罐欄位+提交時間檢查，避免公開的註冊入口被機器人濫用。註冊完成後仍需要現有管理員在後台「AdminSettings」用既有的「新增管理員」功能（`add_admin_by_email` RPC）指派角色才能登入後台，這部分功能本來就存在、不用另外開發。另外把 signUp 的 `emailRedirectTo` 從 `/admin` 改成 `/auth`，確認信連結會導回登入頁而不是先跳一次 `/admin` 再被踢出來。**待辦**：Supabase Dashboard 的 Authentication → URL Configuration 要記得把 `https://inspection20.vercel.app/reset-password` 加進允許的 Redirect URLs，不然重設密碼信的連結會導向失敗。
- **2026-09-06** — `BookingForm.tsx` 加入基本防灌水機制：隱藏蜜罐欄位（機器人常會自動填入，真人看不到也不會填）+ 表單掛載後未滿 4 秒即送出視為異常。原因：`booking_requests` 的 RLS 允許任何人未登入直接 insert，且每筆都會觸發 LINE 推播給管理員群組，沒有防護容易被自動化機器人灌爆。此為純前端防護，可擋掉大部分通用機器人，但無法防止有心人直接呼叫 Supabase API；更強的防護（如 Cloudflare Turnstile）之後視需要再加。
- **2026-09-06** — 修正 `CLAUDE.md` 裡兩處過時說明：Supabase 專案 ID 改為指向 `.env`/`supabase/config.toml`（不再寫死舊值）、`predev`/`prebuild` 腳本已改用 `tsx` 執行（原本寫的 `bunx` workaround 已不適用，`npm run dev`/`npm run build` 可直接跑）。
- **2026-09-06** — 將 `網站程式總覽.md` 的內容整合進本檔並重新核對現況：確認 Locations 假資料頁面已移除、Supabase 專案 ID 已改為新專案、`predev`/`prebuild` 已改用 `tsx`；README 從 Lovable 預設模板改為專案實際說明文件，並新增本更新紀錄段落。
- **2026-09-06** — `send-line-notification` Edge Function 的 `ADMIN_URL` 從舊的 Lovable 網域改為正式 Vercel 網域 `https://inspection20.vercel.app/admin`；`supabase/.temp/`（Supabase CLI 本地暫存檔）加入 `.gitignore`。
