import { test, expect } from "@playwright/test";

// 公開頁面冒煙測試：能載入、沒有 JS 錯誤、手機寬度沒有橫向捲動。
// 只讀不寫，不送出任何表單（本機連的是正式資料庫）。
const pages = ["/", "/about", "/group", "/journal", "/faq", "/privacy", "/booking"];

for (const path of pages) {
  test(`頁面 ${path} 正常顯示`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("h1").first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "頁面不應該有橫向捲動").toBeLessThanOrEqual(1);

    expect(errors, "頁面不應該有 JavaScript 錯誤").toEqual([]);
  });
}
