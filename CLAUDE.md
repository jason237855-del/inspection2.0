# CLAUDE.md

## Project

診斷室驗屋網站（Inspection2.0）。Vite + React 18 + TypeScript，UI 用 shadcn-ui（Radix UI）+ Tailwind CSS，後端 Supabase（DB / Auth / Edge Functions，專案 ID 見本機 `supabase/config.toml` 或 `.env` 的 `VITE_SUPABASE_PROJECT_ID`，2026-09-06 起為 `gzewuphhnxzyhiwnhjpm`）。原以 Lovable 平台建置與協作編輯，現已改為本機 + GitHub + Vercel 部署（正式網址 https://inspection20.vercel.app）。詳細架構、頁面、資料表、LINE 整合說明已整合進 `README.md`（原始的 `網站程式總覽.md` 是 RTF 格式、用 `.md` 副檔名存的，需用 `textutil -convert txt -stdout 網站程式總覽.md` 或類似工具轉出可讀文字，不能直接當純文字讀；內容已併入 README，僅供追溯歷史用）。

GitHub: https://github.com/jason237855-del/inspection2.0（`main` 分支，2026-09-05 完成初次 commit + push）

## 更新紀錄規則

**每次對這個專案做了實質更新（功能異動、設定變更、部署調整、資料庫 migration 等），都要在 `README.md` 的「更新紀錄」段落新增一筆記錄**（日期 + 做了什麼 + 為什麼），新記錄放最上面（新到舊）。單純的探索、閱讀、回答問題不算，不用記。commit 前記得一併把這筆更新寫進 README。

## Local dev environment

這台機器原本沒有 Node.js / npm / bun / Homebrew / gh CLI，皆為本次工作階段另外安裝：
- Node.js 透過 nvm 安裝（`~/.nvm`，目前 Node v24.20.0 / npm 11.19.0）。新開的 shell 需要先 `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"` 才抓得到 node/npm
- GitHub CLI (`gh`) 安裝在 `~/.local/bin/gh`（該目錄已在 PATH 中），已用 `gh auth login` 登入帳號 `jason237855-del`，並執行過 `gh auth setup-git` 設定 git 憑證
- 專案的 `npm run dev` / `npm run build` 內建的 `predev`/`prebuild` 腳本（`scripts/generate-sitemap.ts`）原本寫死用 `bunx` 執行，這台機器沒裝 bun 會直接失敗；已改成 `tsx scripts/generate-sitemap.ts`（`tsx` 已加入 `devDependencies`），`npm run dev` / `npm run build` 現在可直接跑，不用再繞過 hook
- Supabase CLI 透過 `npx supabase`（未全域安裝，`npx` 首次用會自動抓套件）使用，2026-09-14 已 `supabase login`（帳號 jason237855@gmail.com）並 `supabase link --project-ref gzewuphhnxzyhiwnhjpm`。**`supabase login` 的瀏覽器授權流程需要真正的互動式終端機（TTY）**，不能透過 Claude Code 的 `!` 前綴或 Bash 工具執行——會直接報 `non-TTY environments` 錯誤；要重新登入時請使用者另開 Terminal.app／iTerm 手動跑。這個專案的正式資料庫 schema 原本都是用 Supabase Dashboard 手動下 SQL／Lovable 平台改的，從沒透過 CLI 的 migration 機制套用過，所以 remote 一開始沒有 `supabase_migrations.schema_migrations` 追蹤表；已用 `supabase migration repair --status applied <全部版本號>` 補齊追蹤紀錄（純同步紀錄、未變更 schema），現在 `supabase db push` 可以正常用來套用新 migration 了，不用再擔心誤判成要重跑舊 migration

## 2026-09-05 所做的清理與設定

- 移除 Lovable 初始範本殘留的「露營地/民宿」假資料頁面：`src/pages/Locations.tsx`、`src/pages/LocationDetail.tsx`、`src/data/locations.ts`、`src/data/bookings.ts`，並同步移除 `src/App.tsx` 裡對應的 `/locations`、`/location/:id` 路由，以及 `scripts/generate-sitemap.ts` 與 `public/sitemap.xml` 裡的 `/locations` 條目
- `.env` 加入 `.gitignore`（原本沒被排除），改附 `.env.example` 放空值佔位；`.env` 裡的 Supabase publishable key / LIFF ID 屬設計上可公開的前端金鑰，非敏感值，但仍不進版控，維持乾淨習慣
- 專案原本不是 git repo，本次 `git init` 建立，並用 `jason237855@gmail.com` / `jason237855-del` 設定**本地**（非 global）git 身分做 commit
