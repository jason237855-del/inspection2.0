# CLAUDE.md

## Project

診斷室驗屋網站（Inspection2.0）。Vite + React 18 + TypeScript，UI 用 shadcn-ui（Radix UI）+ Tailwind CSS，後端 Supabase（DB / Auth / Edge Functions，專案 ID `pylfgxudfrttqaxfipaj`）。原以 Lovable 平台建置與協作編輯。詳細架構、頁面、資料表、LINE 整合說明見 `網站程式總覽.md`（RTF 格式，用 `.md` 副檔名存的，需用 `textutil -convert txt -stdout 網站程式總覽.md` 或類似工具轉出可讀文字，不能直接當純文字讀）。

GitHub: https://github.com/jason237855-del/inspection2.0（`main` 分支，2026-09-05 完成初次 commit + push）

## Local dev environment

這台機器原本沒有 Node.js / npm / bun / Homebrew / gh CLI，皆為本次工作階段另外安裝：
- Node.js 透過 nvm 安裝（`~/.nvm`，目前 Node v24.20.0 / npm 11.19.0）。新開的 shell 需要先 `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"` 才抓得到 node/npm
- GitHub CLI (`gh`) 安裝在 `~/.local/bin/gh`（該目錄已在 PATH 中），已用 `gh auth login` 登入帳號 `jason237855-del`，並執行過 `gh auth setup-git` 設定 git 憑證
- 專案的 `npm run dev` / `npm run build` 內建的 `predev`/`prebuild` 腳本（`scripts/generate-sitemap.ts`）寫死用 `bunx` 執行，但這台機器沒裝 bun，會直接失敗。目前的 workaround 是繞過該 hook，直接用 `npx vite` 啟動開發伺服器。若要讓 `npm run dev` 正常運作，需另外安裝 bun，或把 `package.json` 裡的 `predev`/`prebuild` 改成 `npx tsx scripts/generate-sitemap.ts`

## 2026-09-05 所做的清理與設定

- 移除 Lovable 初始範本殘留的「露營地/民宿」假資料頁面：`src/pages/Locations.tsx`、`src/pages/LocationDetail.tsx`、`src/data/locations.ts`、`src/data/bookings.ts`，並同步移除 `src/App.tsx` 裡對應的 `/locations`、`/location/:id` 路由，以及 `scripts/generate-sitemap.ts` 與 `public/sitemap.xml` 裡的 `/locations` 條目
- `.env` 加入 `.gitignore`（原本沒被排除），改附 `.env.example` 放空值佔位；`.env` 裡的 Supabase publishable key / LIFF ID 屬設計上可公開的前端金鑰，非敏感值，但仍不進版控，維持乾淨習慣
- 專案原本不是 git repo，本次 `git init` 建立，並用 `jason237855@gmail.com` / `jason237855-del` 設定**本地**（非 global）git 身分做 commit
