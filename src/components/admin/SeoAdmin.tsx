import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSeoOverrides } from "@/hooks/useSeoOverrides";
import { SEO_PAGES, SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from "@/config/seoPages";

type Page = (typeof SEO_PAGES)[number];

const SeoRow = ({ page }: { page: Page }) => {
  const overrides = useSeoOverrides();
  const queryClient = useQueryClient();
  const override = overrides[page.path];
  const [title, setTitle] = useState(override?.title ?? page.title);
  const [description, setDescription] = useState(override?.description ?? page.description);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(override?.title ?? page.title);
    setDescription(override?.description ?? page.description);
  }, [override?.title, override?.description, page.title, page.description]);

  const dirty = title !== (override?.title ?? page.title) || description !== (override?.description ?? page.description);
  const customized = Boolean(override);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["page-seo"] });

  const save = async () => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      toast.error("標題與說明都要填");
      return;
    }
    setBusy(true);
    // 與預設完全相同就不必存覆寫，直接刪掉這一列
    const same = t === page.title && d === page.description;
    const { error } = same
      ? await supabase.from("page_seo").delete().eq("path", page.path)
      : await supabase.from("page_seo").upsert({ path: page.path, title: t, description: d });
    setBusy(false);
    if (error) {
      toast.error(`儲存失敗：${error.message}`);
      return;
    }
    await refresh();
    toast.success(`「${page.label}」的 SEO 已儲存`);
  };

  const reset = async () => {
    setBusy(true);
    const { error } = await supabase.from("page_seo").delete().eq("path", page.path);
    setBusy(false);
    if (error) {
      toast.error(`還原失敗：${error.message}`);
      return;
    }
    await refresh();
    toast.success(`「${page.label}」已恢復預設`);
  };

  return (
    <Card className="border border-border shadow-soft p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-medium">
          {page.label} <span className="ml-1 text-xs font-light text-muted-foreground">{page.path}</span>
        </h3>
        <span className="text-xs text-muted-foreground">{customized ? "已自訂" : "使用預設"}</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`seo-title-${page.path}`}>標題（顯示在 Google 搜尋結果與瀏覽器分頁）</Label>
        <Input id={`seo-title-${page.path}`} value={title} maxLength={SEO_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} />
        <p className="text-right text-[11px] text-muted-foreground">
          {title.length} / {SEO_TITLE_MAX}（Google 通常只顯示約 30 個中文字）
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`seo-desc-${page.path}`}>說明（顯示在搜尋結果標題下方）</Label>
        <Textarea
          id={`seo-desc-${page.path}`}
          rows={3}
          value={description}
          maxLength={SEO_DESCRIPTION_MAX}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {description.length} / {SEO_DESCRIPTION_MAX}（建議 80 字左右）
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          {busy ? "處理中…" : "儲存"}
        </Button>
        {customized && (
          <Button size="sm" variant="outline" onClick={reset} disabled={busy}>
            恢復預設
          </Button>
        )}
      </div>
    </Card>
  );
};

/** 後台「SEO 設定」：各主要頁面的搜尋結果標題與說明 */
const SeoAdmin = () => (
  <div className="space-y-6">
    <Card className="border border-border shadow-soft p-4 md:p-6">
      <h2 className="text-lg font-light">SEO 設定</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        設定各頁在 Google 搜尋結果裡的標題與說明。儲存後網站會立即使用新內容，Google 重新收錄需要幾天到幾週。
        LINE／Facebook 的分享預覽讀的是網站最初的固定內容，不會因這裡的修改而改變（建案團報頁面除外）。
      </p>
    </Card>
    {SEO_PAGES.map((p) => (
      <SeoRow key={p.path} page={p} />
    ))}
  </div>
);

export default SeoAdmin;
