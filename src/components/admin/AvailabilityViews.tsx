import { differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, isSameMonth, isToday, parseISO, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  inspectionLabels,
  statusColors,
  statusLabels,
  type Availability,
  type BookingRequest,
  type TimeSlot,
} from "./types";

// ───────────────────────── 年檢視：12 個月概覽 ─────────────────────────

type YearViewProps = {
  year: number;
  bookings: BookingRequest[];
  availability: Record<string, Availability>;
  bookingCounts: Record<string, number>;
  defaultDailyCapacity: number;
  onPickMonth: (month: Date) => void;
};

export const AvailabilityYearView = ({
  year,
  bookings,
  availability,
  bookingCounts,
  defaultDailyCapacity,
  onPickMonth,
}: YearViewProps) => {
  const today = startOfDay(new Date());

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, m) => {
        const monthStart = new Date(year, m, 1);
        const prefix = format(monthStart, "yyyy-MM");
        const isCurrent = isSameMonth(monthStart, today);
        const isPastMonth = endOfMonth(monthStart) < today;

        // 預約數用完整的預約紀錄計算（後台名額資料只載入「今天起」，過去月份沒有名額資料）
        const bookingTotal = bookings.filter(
          (b) => b.preferred_date.startsWith(prefix) && b.status !== "cancelled"
        ).length;

        let blockedDays = 0;
        let fullDays = 0;
        eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) }).forEach((day) => {
          if (day < today) return;
          const dateStr = format(day, "yyyy-MM-dd");
          const avail = availability[dateStr];
          if (avail?.is_blocked) {
            blockedDays += 1;
          } else if ((bookingCounts[dateStr] || 0) >= (avail?.max_slots ?? defaultDailyCapacity)) {
            if (defaultDailyCapacity > 0 || avail) fullDays += 1;
          }
        });

        return (
          <button
            key={m}
            onClick={() => onPickMonth(monthStart)}
            className={`rounded-xl border p-4 text-left transition-colors hover:border-primary/50 ${
              isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"
            } ${isPastMonth ? "opacity-70" : ""}`}
          >
            <p className="flex items-center gap-2 text-base font-light">
              {m + 1} 月
              {isCurrent && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-normal text-primary-foreground">
                  本月
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-muted-foreground font-light">
              預約 <span className="text-foreground text-sm">{bookingTotal}</span> 筆
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[20px]">
              {fullDays > 0 && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  額滿 {fullDays} 天
                </span>
              )}
              {blockedDays > 0 && (
                <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                  不開放 {blockedDays} 天
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ───────────────────────── 日檢視：單日各時段名額與預約 ─────────────────────────

type DayViewProps = {
  date: Date;
  availability: Record<string, Availability>;
  activeTimeSlots: TimeSlot[];
  timeSlotLabelByValue: Record<string, string>;
  bookings: BookingRequest[];
  getSlotMax: (dateStr: string, slot: TimeSlot) => number;
  saveAvailability: (dateStr: string, updates: Partial<Availability>) => void | Promise<void>;
  saveSlotAvailability: (dateStr: string, slotId: string, maxSlots: number) => void | Promise<void>;
  onOpenBooking: (booking: BookingRequest) => void;
};

export const AvailabilityDayView = ({
  date,
  availability,
  activeTimeSlots,
  timeSlotLabelByValue,
  bookings,
  getSlotMax,
  saveAvailability,
  saveSlotAvailability,
  onOpenBooking,
}: DayViewProps) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const isPast = startOfDay(date) < startOfDay(new Date());
  const avail = availability[dateStr];
  const isBlocked = avail?.is_blocked ?? false;

  const dayBookings = bookings.filter((b) => b.preferred_date === dateStr);
  const counted = dayBookings.filter((b) => b.status !== "cancelled");
  const countBySlot = (value: string) => counted.filter((b) => b.time_slot === value).length;
  const knownSlotValues = new Set(activeTimeSlots.map((s) => s.value));
  const otherSlotCount = counted.filter((b) => !b.time_slot || !knownSlotValues.has(b.time_slot)).length;

  return (
    <div className="space-y-8">
      {!isToday(date) && (
        <p className="text-xs font-light text-muted-foreground">
          {(() => {
            const diff = differenceInCalendarDays(date, new Date());
            return `${Math.abs(diff)} 天${diff > 0 ? "後" : "前"}`;
          })()}
        </p>
      )}

      {isPast && (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground font-light">
          這是過去的日期，只能檢視，不能修改名額；後台也只保存「今天起」的名額設定。
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dayBlocked" className="text-sm font-light">
              不開放預約
            </Label>
            <Switch
              id="dayBlocked"
              checked={isBlocked}
              disabled={isPast}
              onCheckedChange={(checked) => saveAvailability(dateStr, { is_blocked: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayReason" className="text-sm font-light">
              備註（選填）
            </Label>
            <Input
              id="dayReason"
              value={avail?.reason ?? ""}
              disabled={isPast}
              onChange={(e) => saveAvailability(dateStr, { reason: e.target.value })}
              placeholder="例如：國定假日、內部會議"
              className="text-sm font-light"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-light">各時段名額</Label>
          {activeTimeSlots.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚未設定任何時段，請先到「時段管理」新增。</p>
          ) : (
            <div className="space-y-2">
              {activeTimeSlots.map((slot) => {
                const max = getSlotMax(dateStr, slot);
                const used = countBySlot(slot.value);
                const full = !isBlocked && max > 0 && used >= max;
                return (
                  <div key={slot.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-light">{slot.label}</p>
                      <p className={`text-xs font-light ${full ? "text-primary" : "text-muted-foreground"}`}>
                        已預約 {used} 筆{full ? "（已額滿）" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-light">名額</span>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={max}
                        disabled={isPast}
                        onChange={(e) => saveSlotAvailability(dateStr, slot.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-sm font-light"
                      />
                    </div>
                  </div>
                );
              })}
              {otherSlotCount > 0 && (
                <p className="text-xs text-muted-foreground font-light">另有 {otherSlotCount} 筆使用已停用或舊的時段</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-light">
          當天預約（{dayBookings.length} 筆{dayBookings.length !== counted.length ? `，含 ${dayBookings.length - counted.length} 筆已取消` : ""}）
        </h3>
        {dayBookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground font-light">這天沒有預約</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {dayBookings.map((b) => (
              <button
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-light">
                    {b.name || "未留姓名"}
                    <span className="ml-2 text-muted-foreground">
                      {inspectionLabels[b.inspection_type] || b.inspection_type}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground font-light">
                    {b.time_slot ? timeSlotLabelByValue[b.time_slot] || b.time_slot : "未選時段"}
                    {b.project_name ? ` · ${b.project_name}` : ""}
                    {b.created_at ? ` · 建立於 ${format(parseISO(b.created_at), "MM/dd")}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] font-light ${statusColors[b.status]}`}>
                  {statusLabels[b.status] || b.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

