import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, Users, Link2, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, type BookingRequest, type GroupProject } from "./types";
import { groupPath, groupUrl } from "@/lib/group";
import GroupCoverImage from "@/components/group/GroupCoverImage";
import GroupDefaultsCard from "./GroupDefaultsCard";
import { useGroupSettings } from "@/hooks/useGroupSettings";

const groupStatusLabels: Record<GroupProject["status"], string> = {
  pending: "待審核",
  active: "開放加入",
  closed: "已關閉",
};

const groupStatusColors: Record<GroupProject["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const formatNT = (n: number | null | undefined) => (n == null ? "-" : `$NT ${n.toLocaleString("en-US")}`);
const formatDiscount = (rate: number) => `${Number((rate * 10).toFixed(1))} 折`;

const COVER_BUCKET = "group-covers";
const MAX_COVER_WIDTH = 1600;

/** 縮成最寬 1600px 的 JPEG（超過 2 MB 會自動降品質），避免上傳過大拖慢網站 */
async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_COVER_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法處理圖片");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (quality: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("圖片轉檔失敗"))), "image/jpeg", quality)
    );
  let blob = await toBlob(0.82);
  if (blob.size > 2 * 1024 * 1024) blob = await toBlob(0.65);
  return blob;
}

/** 從公開網址取出儲存空間內的檔案路徑（用來刪除舊照片） */
const coverPathFromUrl = (url: string | null) => {
  if (!url) return null;
  const marker = `/object/public/${COVER_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
};

type Props = {
  bookings: BookingRequest[];
  onBookingsChanged: () => void;
};

const GroupBuyingAdmin = ({ bookings, onBookingsChanged }: Props) => {
  const groupDefaults = useGroupSettings();
  const defaultDiscountInput = String(Math.round(groupDefaults.default_discount_rate * 100) / 10);
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroupProject | null>(null);
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formMinUnits, setFormMinUnits] = useState("3");
  const [formDiscount, setFormDiscount] = useState("9"); // 以「折」為單位輸入，9 = 9 折
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);

  const [membersOf, setMembersOf] = useState<GroupProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupProject | null>(null);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("group_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`讀取團報建案失敗：${error.message}`);
    } else {
      setProjects((data || []) as GroupProject[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const membersByProject = useMemo(() => {
    const map: Record<string, BookingRequest[]> = {};
    bookings.forEach((b) => {
      if (!b.group_project_id) return;
      (map[b.group_project_id] ??= []).push(b);
    });
    return map;
  }, [bookings]);

  const copyPageLink = async (p: GroupProject) => {
    try {
      await navigator.clipboard.writeText(groupUrl(p.slug));
      toast.success(`已複製「${p.name}」的頁面連結，可貼到社區群組`);
    } catch {
      toast.error("複製失敗，請手動複製");
    }
  };

  const activeCount = (id: string) => (membersByProject[id] || []).filter((b) => b.status !== "cancelled").length;

  const pendingProjects = projects.filter((p) => p.status === "pending");
  const otherProjects = projects.filter((p) => p.status !== "pending");

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormRegion("");
    setFormMinUnits(String(groupDefaults.default_min_units));
    setFormDiscount(defaultDiscountInput);
    setDialogOpen(true);
  };

  const openEdit = (p: GroupProject) => {
    setEditing(p);
    setFormName(p.name);
    setFormRegion(p.region);
    setFormMinUnits(String(p.min_units));
    setFormDiscount(String(Number((p.discount_rate * 10).toFixed(1))));
    setDialogOpen(true);
  };

  const handleCoverFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("請選擇 JPG、PNG 或 WebP 圖片");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("圖片太大（超過 20 MB），請先縮小再上傳");
      return;
    }
    setCoverBusy(true);
    try {
      const blob = await resizeToJpeg(file);
      const path = `${editing.id}/${Date.now()}.jpg`;
      const { error: upError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (upError) throw upError;
      const url = supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
      const { error: dbError } = await supabase.from("group_projects").update({ cover_image_url: url }).eq("id", editing.id);
      if (dbError) {
        await supabase.storage.from(COVER_BUCKET).remove([path]);
        throw dbError;
      }
      const oldPath = coverPathFromUrl(editing.cover_image_url);
      if (oldPath) await supabase.storage.from(COVER_BUCKET).remove([oldPath]);
      setEditing({ ...editing, cover_image_url: url });
      toast.success("封面照片已更新");
      fetchProjects();
    } catch (e) {
      toast.error(`上傳失敗：${e instanceof Error ? e.message : "未知錯誤"}`);
    } finally {
      setCoverBusy(false);
    }
  };

  const removeCover = async () => {
    if (!editing?.cover_image_url) return;
    setCoverBusy(true);
    const { error } = await supabase.from("group_projects").update({ cover_image_url: null }).eq("id", editing.id);
    if (error) {
      setCoverBusy(false);
      toast.error(`移除失敗：${error.message}`);
      return;
    }
    const oldPath = coverPathFromUrl(editing.cover_image_url);
    if (oldPath) await supabase.storage.from(COVER_BUCKET).remove([oldPath]);
    setEditing({ ...editing, cover_image_url: null });
    setCoverBusy(false);
    toast.success("已移除照片，改用自動產生的設計圖");
    fetchProjects();
  };

  const handleSave = async () => {
    const minUnits = parseInt(formMinUnits, 10);
    const discount = parseFloat(formDiscount);
    if (!formName.trim() || !formRegion.trim()) {
      toast.error("請填寫建案名稱與區域");
      return;
    }
    if (!Number.isInteger(minUnits) || minUnits < 2) {
      toast.error("成團門檻至少 2 戶");
      return;
    }
    if (!(discount > 0 && discount <= 10)) {
      toast.error("折數請輸入 0～10 之間，例如 9 代表 9 折");
      return;
    }
    setSaving(true);
    const payload = {
      name: formName.trim(),
      region: formRegion.trim(),
      min_units: minUnits,
      discount_rate: Number((discount / 10).toFixed(3)),
    };
    const { error } = editing
      ? await supabase.from("group_projects").update(payload).eq("id", editing.id)
      : await supabase.from("group_projects").insert({ ...payload, status: "active" });
    setSaving(false);
    if (error) {
      toast.error(`儲存失敗：${error.message}`);
      return;
    }
    toast.success(editing ? "已更新團報建案" : "已新增團報建案");
    setDialogOpen(false);
    await fetchProjects();
    // 修改成團門檻或折扣時，資料庫會自動重算該團訂單價格
    if (editing) onBookingsChanged();
  };

  const setStatus = async (p: GroupProject, status: GroupProject["status"]) => {
    const { error } = await supabase.from("group_projects").update({ status }).eq("id", p.id);
    if (error) {
      toast.error(`更新失敗：${error.message}`);
      return;
    }
    toast.success(`「${p.name}」已${status === "active" ? "開放加入" : "關閉"}`);
    fetchProjects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const coverPath = coverPathFromUrl(deleteTarget.cover_image_url);
    const { error } = await supabase.from("group_projects").delete().eq("id", deleteTarget.id);
    if (!error && coverPath) await supabase.storage.from(COVER_BUCKET).remove([coverPath]);
    setDeleteTarget(null);
    if (error) {
      toast.error(`刪除失敗：${error.message}`);
      return;
    }
    toast.success("已刪除團報建案");
    fetchProjects();
    onBookingsChanged();
  };

  const renderActions = (p: GroupProject) => (
    <>
            {p.status === "pending" && (
        <Button size="sm" className="mr-1" onClick={() => setStatus(p, "active")}>
          <Check className="h-3.5 w-3.5 mr-1" />
          核准上架
        </Button>
      )}
      {p.status === "active" && (
        <Button variant="outline" size="sm" className="mr-1" onClick={() => setStatus(p, "closed")}>
          關閉
        </Button>
      )}
      {p.status === "closed" && (
        <Button variant="outline" size="sm" className="mr-1" onClick={() => setStatus(p, "active")}>
          重新開放
        </Button>
      )}
      {p.status === "active" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="複製建案頁面連結"
          onClick={() => copyPageLink(p)}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive"
        onClick={() => setDeleteTarget(p)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </>
  );

  const renderRows = (list: GroupProject[]) =>
    list.map((p) => {
      const count = activeCount(p.id);
      const reached = count >= p.min_units;
      return (
        <TableRow key={p.id}>
          <TableCell className="text-sm font-light">
            <div>{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.region}</div>
            {p.status === "active" && (
              <div className="text-[11px] text-muted-foreground/70 mt-0.5 break-all">{decodeURIComponent(groupPath(p.slug))}</div>
            )}
            {p.status === "pending" && (p.proposer_name || p.proposer_phone) && (
              <div className="text-xs text-muted-foreground mt-0.5">
                提出人：{p.proposer_name || "-"}／{p.proposer_phone || "-"}
              </div>
            )}
          </TableCell>
          <TableCell>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${groupStatusColors[p.status]}`}
            >
              {groupStatusLabels[p.status]}
            </span>
          </TableCell>
          <TableCell className="text-sm font-light">
            <button
              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              onClick={() => setMembersOf(p)}
            >
              <Users className="h-3.5 w-3.5" />
              {count} 戶
            </button>
            {p.status !== "pending" && (
              <span className={`ml-2 text-xs ${reached ? "text-emerald-600" : "text-muted-foreground"}`}>
                {reached ? "已成團" : `差 ${p.min_units - count} 戶`}
              </span>
            )}
          </TableCell>
          <TableCell className="text-sm font-light text-muted-foreground">
            滿 {p.min_units} 戶 {formatDiscount(p.discount_rate)}
          </TableCell>
          <TableCell className="text-right whitespace-nowrap">{renderActions(p)}</TableCell>
        </TableRow>
      );
    });

  const renderCards = (list: GroupProject[]) =>
    list.map((p) => {
      const count = activeCount(p.id);
      const reached = count >= p.min_units;
      return (
        <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground font-light mt-0.5">{p.region}</p>
              {p.status === "active" && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 break-all">{decodeURIComponent(groupPath(p.slug))}</p>
              )}
              {p.status === "pending" && (p.proposer_name || p.proposer_phone) && (
                <p className="text-xs text-muted-foreground font-light mt-0.5">
                  提出人：{p.proposer_name || "-"}／{p.proposer_phone || "-"}
                </p>
              )}
            </div>
            <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${groupStatusColors[p.status]}`}>
              {groupStatusLabels[p.status]}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-light text-muted-foreground">
            <button className="inline-flex items-center gap-1 underline-offset-2 hover:underline" onClick={() => setMembersOf(p)}>
              <Users className="h-3.5 w-3.5" />
              {count} 戶
              {p.status !== "pending" && (
                <span className={`ml-1.5 ${reached ? "text-emerald-600" : ""}`}>
                  {reached ? "已成團" : `差 ${p.min_units - count} 戶`}
                </span>
              )}
            </button>
            <span>
              滿 {p.min_units} 戶 {formatDiscount(p.discount_rate)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">{renderActions(p)}</div>
        </div>
      );
    });

  const tableHead = (
    <TableHeader>
      <TableRow>
        <TableHead className="text-[11px] uppercase tracking-wider font-normal">建案</TableHead>
        <TableHead className="text-[11px] uppercase tracking-wider font-normal">狀態</TableHead>
        <TableHead className="text-[11px] uppercase tracking-wider font-normal">已報名</TableHead>
        <TableHead className="text-[11px] uppercase tracking-wider font-normal">優惠條件</TableHead>
        <TableHead className="text-[11px] uppercase tracking-wider font-normal text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
  );

  const members = membersOf ? membersByProject[membersOf.id] || [] : [];

  return (
    <div className="space-y-6">
      <GroupDefaultsCard projects={projects} onProjectsChanged={fetchProjects} />

      {pendingProjects.length > 0 && (
        <Card className="border border-amber-500/30 shadow-soft p-4 md:p-6">
          <h2 className="text-lg font-light mb-1">客戶提出的新建案（{pendingProjects.length}）</h2>
          <p className="text-xs text-muted-foreground mb-4">核准後才會出現在官網「建案團報」區塊。</p>
          <div className="hidden md:block">
            <Table>
              {tableHead}
              <TableBody>{renderRows(pendingProjects)}</TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">{renderCards(pendingProjects)}</div>
        </Card>
      )}

      <Card className="border border-border shadow-soft p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-light">團報管理</h2>
            <p className="text-xs text-muted-foreground mt-1">
              管理官網「建案團報」的建案。團內未取消的戶數達門檻後，全團訂單價格會自動改為折扣價（團報不與 LINE 好友折扣並用）。
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            新增建案
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">載入中…</p>
        ) : otherProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">尚未建立任何團報建案</p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                {tableHead}
                <TableBody>{renderRows(otherProjects)}</TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">{renderCards(otherProjects)}</div>
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "編輯團報建案" : "新增團報建案"}</DialogTitle>
            <DialogDescription>
              {editing ? "修改成團門檻或折扣後，該團現有訂單的價格會自動重算。" : "新增後會直接開放客戶加入。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="g-name">建案名稱</Label>
              <Input id="g-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="g-region">建案區域</Label>
              <Input id="g-region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} placeholder="新北市泰山區" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="g-min">成團門檻（戶）</Label>
                <Input id="g-min" type="number" min={2} value={formMinUnits} onChange={(e) => setFormMinUnits(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="g-discount">折數（9 = 9 折）</Label>
                <Input id="g-discount" type="number" step="0.1" min={0.1} max={10} value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>封面照片（選填）</Label>
              {editing ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <GroupCoverImage project={editing} aspect="aspect-[16/8]" />
                  </div>
                  <p className="text-xs font-light text-muted-foreground">
                    沒有上傳照片時，會自動使用大樓輪廓的設計圖。請確認你擁有這張照片的使用權，不要直接使用建商或網路上的照片。
                    上傳後會自動縮小（最寬 1600px）。
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" disabled={coverBusy}>
                      <label className="cursor-pointer">
                        {coverBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
                        {editing.cover_image_url ? "更換照片" : "上傳照片"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={coverBusy}
                          onChange={(e) => {
                            handleCoverFile(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </Button>
                    {editing.cover_image_url && (
                      <Button variant="ghost" size="sm" disabled={coverBusy} onClick={removeCover}>
                        移除照片
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs font-light text-muted-foreground">
                  建立建案後，再按「編輯」就能上傳封面照片；沒上傳時會自動產生設計圖。
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!membersOf} onOpenChange={(open) => !open && setMembersOf(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {membersOf?.name} 團報成員（{members.filter((b) => b.status !== "cancelled").length} 戶）
            </DialogTitle>
            <DialogDescription>已取消的訂單不計入戶數，也不會套用團報價格。</DialogDescription>
          </DialogHeader>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">目前沒有人加入</p>
          ) : (
            <>
              <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-normal">聯絡人</TableHead>
                  <TableHead className="text-[11px] font-normal">樓層戶號</TableHead>
                  <TableHead className="text-[11px] font-normal">預約日期</TableHead>
                  <TableHead className="text-[11px] font-normal">狀態</TableHead>
                  <TableHead className="text-[11px] font-normal text-right">費用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-light">
                      {b.name}
                      <div className="text-xs text-muted-foreground">{b.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm font-light">{b.floor_unit || "-"}</TableCell>
                    <TableCell className="text-sm font-light">
                      {b.preferred_date}
                      {b.time_slot ? ` ${b.time_slot}` : ""}
                    </TableCell>
                    <TableCell className="text-sm font-light">{statusLabels[b.status] || b.status}</TableCell>
                    <TableCell className="text-sm font-light text-right">
                      {b.original_price != null && b.price != null && b.price < b.original_price && (
                        <span className="mr-1.5 text-xs text-muted-foreground line-through">
                          {formatNT(b.original_price)}
                        </span>
                      )}
                      {formatNT(b.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            <div className="md:hidden space-y-2">
              {members.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span>{b.name}</span>
                    <span className="text-xs text-muted-foreground font-light">{statusLabels[b.status] || b.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-light">{b.phone}</p>
                  <p className="text-xs text-muted-foreground font-light">
                    {b.floor_unit || "-"} ・ {b.preferred_date}
                    {b.time_slot ? ` ${b.time_slot}` : ""}
                  </p>
                  <p className="text-xs text-right">
                    {b.original_price != null && b.price != null && b.price < b.original_price && (
                      <span className="mr-1.5 text-muted-foreground line-through">{formatNT(b.original_price)}</span>
                    )}
                    {formatNT(b.price)}
                  </p>
                </div>
              ))}
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除「{deleteTarget?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              只會刪除建案本身，已加入的預約訂單會保留（變成一般訂單，價格維持目前金額）。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupBuyingAdmin;
