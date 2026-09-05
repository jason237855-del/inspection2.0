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

- **2026-09-06** — 修正 `CLAUDE.md` 裡兩處過時說明：Supabase 專案 ID 改為指向 `.env`/`supabase/config.toml`（不再寫死舊值）、`predev`/`prebuild` 腳本已改用 `tsx` 執行（原本寫的 `bunx` workaround 已不適用，`npm run dev`/`npm run build` 可直接跑）。
- **2026-09-06** — 將 `網站程式總覽.md` 的內容整合進本檔並重新核對現況：確認 Locations 假資料頁面已移除、Supabase 專案 ID 已改為新專案、`predev`/`prebuild` 已改用 `tsx`；README 從 Lovable 預設模板改為專案實際說明文件，並新增本更新紀錄段落。
- **2026-09-06** — `send-line-notification` Edge Function 的 `ADMIN_URL` 從舊的 Lovable 網域改為正式 Vercel 網域 `https://inspection20.vercel.app/admin`；`supabase/.temp/`（Supabase CLI 本地暫存檔）加入 `.gitignore`。
