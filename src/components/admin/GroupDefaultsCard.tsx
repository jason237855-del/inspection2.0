import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useGroupSettings } from "@/hooks/useGroupSettings";
import { termsText } from "@/lib/group";
import type { GroupProject } from "./types";

type Props = { projects: GroupProject[]; onProjectsChanged: () => void };

/** 團報預設條件：官網上的「滿 N 戶享 X 折」、新增建案的預設值、客戶提案的條件都以這裡為準 */
const GroupDefaultsCard = ({ projects, onProjectsChanged }: Props) => {
  const settings = useGroupSettings();
  const queryClient = useQueryClient();
  const [minUnits, setMinUnits] = useState(String(settings.default_min_units));
  const [discount, setDiscount] = useState(String(Math.round(settings.default_discount_rate * 100) / 10));
  const [applyAll, setApplyAll] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMinUnits(String(settings.default_min_units));
    setDiscount(String(Math.round(settings.default_discount_rate * 100) / 10));
  }, [settings.default_min_units, settings.default_discount_rate]);

  const differing = projects.filter(
    (p) =>
      p.status !== "closed" &&
      (p.min_units !== settings.default_min_units || Math.abs(Number(p.discount_rate) - settings.default_discount_rate) > 0.0005),
  ).length;

  const handleSave = async () => {
    const m = parseInt(minUnits, 10);
    const d = parseFloat(discount);
    if (!Number.isInteger(m) || m < 2) {
      toast.error("成團戶數至少 2 戶");
      return;
    }
    if (!(d > 0 && d <= 10)) {
      toast.error("折數請輸入 0～10 之間，例如 9 代表 9 折");
      return;
    }
    const rate = Math.round(d * 100) / 1000;
    if (applyAll && !window.confirm(`確定要把所有現有建案改成「${termsText({ default_min_units: m, default_discount_rate: rate })}」嗎？已報名訂單的價格會依新條件重新計算。`)) {
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("group_settings")
      .update({ default_min_units: m, default_discount_rate: rate })
      .eq("id", true);
    if (error) {
      setSaving(false);
      toast.error(`儲存失敗：${error.message}`);
      return;
    }
    if (applyAll) {
      const { error: e2 } = await supabase
        .from("group_projects")
        .update({ min_units: m, discount_rate: rate })
        .not("id", "is", null);
      if (e2) {
        setSaving(false);
        toast.error(`預設條件已儲存，但套用到現有建案失敗：${e2.message}`);
        await queryClient.invalidateQueries({ queryKey: ["group-settings"] });
        return;
      }
      onProjectsChanged();
      setApplyAll(false);
    }
    await queryClient.invalidateQueries({ queryKey: ["group-settings"] });
    setSaving(false);
    toast.success(applyAll ? "已儲存並套用到所有現有建案" : "預設條件已儲存");
  };

  const dirty =
    minUnits !== String(settings.default_min_units) ||
    Math.abs(parseFloat(discount) / 10 - settings.default_discount_rate) > 0.0005;

  return (
    <Card className="border border-border shadow-soft p-4 md:p-6">
      <h2 className="text-lg font-light">預設條件</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        目前：{termsText(settings)}。官網首頁、團報專區的說明文字、新增建案的預設值都會跟著這裡變；客戶提出的新建案也一律使用這組條件。
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="gd-min">成團戶數（戶）</Label>
          <Input id="gd-min" type="number" min={2} className="w-32" value={minUnits} onChange={(e) => setMinUnits(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gd-discount">折數（9 = 9 折）</Label>
          <Input id="gd-discount" type="number" step="0.1" min={0.1} max={10} className="w-32" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        <Button onClick={handleSave} disabled={saving || (!dirty && !applyAll)}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
      </div>
      <div className="mt-4 flex items-start gap-2">
        <Checkbox id="gd-apply" checked={applyAll} onCheckedChange={(v) => setApplyAll(v === true)} className="mt-0.5" />
        <Label htmlFor="gd-apply" className="text-xs font-normal leading-relaxed text-muted-foreground">
          同時套用到所有現有建案（已報名訂單的價格會重新計算）。不勾的話，只影響之後新增的建案。
          {differing > 0 && `目前有 ${differing} 個建案的條件與預設不同。`}
        </Label>
      </div>
    </Card>
  );
};

export default GroupDefaultsCard;
