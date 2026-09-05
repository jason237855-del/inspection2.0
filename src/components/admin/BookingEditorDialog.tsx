import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BookingRequest,
  inspectionOptions,
  propertyOptions,
  regionOptions,
  statusOptions,
  timeSlotOptions,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingRequest | null; // null = create mode
  onSaved: (booking: BookingRequest, mode: "create" | "update") => void;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  preferred_date: string;
  time_slot: string;
  inspection_type: string;
  property_type: string;
  region: string;
  project_name: string;
  address: string;
  notes: string;
  status: string;
};

const emptyForm = (): FormState => ({
  name: "",
  phone: "",
  email: "",
  preferred_date: format(new Date(), "yyyy-MM-dd"),
  time_slot: "morning",
  inspection_type: "newfirst",
  property_type: "apartment",
  region: "taipei",
  project_name: "",
  address: "",
  notes: "",
  status: "pending",
});

const BookingEditorDialog = ({ open, onOpenChange, booking, onSaved }: Props) => {
  const isEdit = !!booking;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (booking) {
      setForm({
        name: booking.name || "",
        phone: booking.phone || "",
        email: booking.email || "",
        preferred_date: booking.preferred_date,
        time_slot: booking.time_slot || "",
        inspection_type: booking.inspection_type,
        property_type: booking.property_type,
        region: booking.region,
        project_name: booking.project_name || "",
        address: booking.address || "",
        notes: booking.notes || "",
        status: booking.status,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, booking]);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("請填寫客戶姓名");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("請填寫聯絡電話");
      return;
    }
    if (!form.preferred_date) {
      toast.error("請選擇預約日期");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      preferred_date: form.preferred_date,
      time_slot: form.time_slot || null,
      inspection_type: form.inspection_type,
      property_type: form.property_type,
      region: form.region,
      project_name: form.project_name.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    if (isEdit && booking) {
      const { data, error } = await supabase
        .from("booking_requests")
        .update(payload)
        .eq("id", booking.id)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error("更新失敗", { description: error.message });
        return;
      }
      toast.success("預約已更新");
      onSaved(data as BookingRequest, "update");
      onOpenChange(false);
    } else {
      const { data, error } = await supabase
        .from("booking_requests")
        .insert({ ...payload, source: "manual" })
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error("新增失敗", { description: error.message });
        return;
      }
      toast.success("已新增預約");
      onSaved(data as BookingRequest, "create");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto booking-form">
        <DialogHeader>
          <DialogTitle className="font-light">{isEdit ? "編輯預約" : "新增預約"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? "修改客戶資料、預約時段、地址與備註" : "手動建立一筆預約並寫入資料庫"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">客戶姓名 *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="王小明"
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">聯絡電話 *</Label>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0912-345-678"
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">預約日期 *</Label>
            <Input
              type="date"
              value={form.preferred_date}
              onChange={(e) => set("preferred_date", e.target.value)}
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">預約時段</Label>
            <Select value={form.time_slot} onValueChange={(v) => set("time_slot", v)}>
              <SelectTrigger className="text-sm font-light">
                <SelectValue placeholder="選擇時段" />
              </SelectTrigger>
              <SelectContent>
                {timeSlotOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">檢測項目</Label>
            <Select value={form.inspection_type} onValueChange={(v) => set("inspection_type", v)}>
              <SelectTrigger className="text-sm font-light">
                <SelectValue placeholder="選擇檢測類型" />
              </SelectTrigger>
              <SelectContent>
                {inspectionOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">房屋類型</Label>
            <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}>
              <SelectTrigger className="text-sm font-light">
                <SelectValue placeholder="選擇房屋類型" />
              </SelectTrigger>
              <SelectContent>
                {propertyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">房屋地區</Label>
            <Select value={form.region} onValueChange={(v) => set("region", v)}>
              <SelectTrigger className="text-sm font-light">
                <SelectValue placeholder="選擇房屋地區" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">訂單狀態</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="text-sm font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">建案名稱</Label>
            <Input
              value={form.project_name}
              onChange={(e) => set("project_name", e.target.value)}
              placeholder="例如：世界之翼"
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">房屋地址</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="台北市中山區…"
              className="text-sm font-light"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">備註</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="記錄聯繫狀況或特殊需求…"
              className="text-sm font-light min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-light"
          >
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="text-xs font-light">
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {isEdit ? "儲存變更" : "建立預約"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingEditorDialog;
