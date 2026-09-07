import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ClipboardList, Home, MapPin, FileText, User, Phone, Mail, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusLabels,
  statusColors,
  statusOptions,
  inspectionLabels,
  propertyLabels,
  regionLabels,
} from "./types";
import type { BookingRequest } from "./types";

type Props = {
  booking: BookingRequest;
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onEdit: (booking: BookingRequest) => void;
  onDelete: (booking: BookingRequest) => void;
};

const MobileBookingDetail = ({ booking, onBack, onUpdateStatus, onSaveNotes, onEdit, onDelete }: Props) => {
  const [notes, setNotes] = useState(booking.notes || "");

  useEffect(() => {
    setNotes(booking.notes || "");
  }, [booking.id, booking.notes]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-light text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          返回
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-light">{booking.name || "未留姓名"}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] font-light shrink-0 ${statusColors[booking.status]}`}>
          {statusLabels[booking.status] || booking.status}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-28">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground mb-1">
            #{booking.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground font-light">
            {format(parseISO(booking.preferred_date), "yyyy年MM月dd日")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardList className="h-3 w-3" />
              檢測類型
            </div>
            <p className="text-sm font-light text-foreground">
              {inspectionLabels[booking.inspection_type] || booking.inspection_type}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Home className="h-3 w-3" />
              房屋類型
            </div>
            <p className="text-sm font-light text-foreground">
              {propertyLabels[booking.property_type] || booking.property_type}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              地區
            </div>
            <p className="text-sm font-light text-foreground">{regionLabels[booking.region] || booking.region}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              建案名稱
            </div>
            <p className="text-sm font-light text-foreground">{booking.project_name || "—"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            聯繫資訊
          </div>
          <div className="space-y-2 text-sm font-light text-foreground">
            <p>{booking.name || "—"}</p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {booking.phone || "—"}
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {booking.email || "—"}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {booking.address || "—"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">預約狀態</Label>
          <Select value={booking.status} onValueChange={(value) => onUpdateStatus(booking.id, value)}>
            <SelectTrigger className="text-sm font-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">內部備註</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="記錄聯繫狀況或特殊需求..."
            className="text-sm font-light min-h-[100px]"
          />
        </div>
      </div>

      <div
        className="border-t border-border bg-background px-4 py-3 space-y-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs font-light" onClick={() => onEdit(booking)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            編輯
          </Button>
          <Button size="sm" className="flex-1 text-xs font-light" onClick={() => onSaveNotes(booking.id, notes)}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            儲存備註
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-light text-destructive hover:text-destructive"
          onClick={() => onDelete(booking)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          刪除訂單
        </Button>
      </div>
    </div>
  );
};

export default MobileBookingDetail;
