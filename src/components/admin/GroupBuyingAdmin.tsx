import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, Users, Link2 } from "lucide-react";
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

type Props = {
  bookings: BookingRequest[];
  onBookingsChanged: () => void;
};

const GroupBuyingAdmin = ({ bookings, onBookingsChanged }: Props) => {
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroupProject | null>(null);
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formMinUnits, setFormMinUnits] = useState("3");
  const [formDiscount, setFormDiscount] = useState("9"); // 以「折」為單位輸入，9 = 9 折
  const [saving, setSaving] = useState(false);

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
    setFormMinUnits("3");
    setFormDiscount("9");
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
    const { error } = await supabase.from("group_projects").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      toast.error(`刪除失敗：${error.message}`);
      return;
    }
    toast.success("已刪除團報建案");
    fetchProjects();
    onBookingsChanged();
  };

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
          <TableCell className="text-right whitespace-nowrap">
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
          </TableCell>
        </TableRow>
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
      {pendingProjects.length > 0 && (
        <Card className="border border-amber-500/30 shadow-soft p-4 md:p-6">
          <h2 className="text-lg font-light mb-1">客戶提出的新建案（{pendingProjects.length}）</h2>
          <p className="text-xs text-muted-foreground mb-4">核准後才會出現在官網「建案團報」區塊。</p>
          <Table>
            {tableHead}
            <TableBody>{renderRows(pendingProjects)}</TableBody>
          </Table>
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
          <Table>
            {tableHead}
            <TableBody>{renderRows(otherProjects)}</TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
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
