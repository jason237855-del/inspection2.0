import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, subMonths, parseISO, startOfDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle2, XCircle, Percent, ArrowUp, ArrowDown } from "lucide-react";
import type { BookingRequest, Availability } from "./types";

const statusLabels: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
};

const statusColors: Record<string, string> = {
  pending: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-secondary/10 text-secondary border-secondary/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const inspectionLabels: Record<string, string> = {
  newfirst: "新成屋初驗",
  newrecheck: "新成屋複驗",
  resale: "中古屋驗屋",
};

const propertyLabels: Record<string, string> = {
  townhouse: "透天",
  apartment: "華夏",
};

const regionLabels: Record<string, string> = {
  taipei: "台北",
  newtaipei: "新北",
  taoyuan: "桃園",
  hsinchu: "新竹",
  keelung: "基隆",
  yilan: "宜蘭",
};

type Props = {
  bookings: BookingRequest[];
  availability: Record<string, Availability>;
  bookingCounts: Record<string, number>;
  onOpenBooking: (booking: BookingRequest) => void;
};

const DistributionBar = ({ label, count, total }: { label: string; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-light">{label}</span>
        <span className="text-muted-foreground font-light">
          {count} 筆 · {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const TrendBadge = ({
  value,
  suffix = "%",
  invert = false,
}: {
  value: number | null;
  suffix?: string;
  invert?: boolean;
}) => {
  if (value === null) return null;
  if (value === 0) {
    return <span className="text-[10px] font-light text-muted-foreground">與上月持平</span>;
  }
  const up = value > 0;
  const isGood = invert ? !up : up;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-light ${
        isGood ? "text-emerald-600" : "text-destructive"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {Math.abs(value)}
      {suffix} 較上月
    </span>
  );
};

const OverviewDashboard = ({ bookings, availability, bookingCounts, onOpenBooking }: Props) => {
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const metrics = useMemo(() => {
    const thisMonth = bookings.filter((b) => {
      const created = format(new Date(b.created_at), "yyyy-MM-dd");
      return created >= monthStart && created <= monthEnd;
    });
    const prevMonth = bookings.filter((b) => {
      const created = format(new Date(b.created_at), "yyyy-MM-dd");
      return created >= prevMonthStart && created <= prevMonthEnd;
    });
    const active = bookings.filter((b) => b.status !== "cancelled");
    const cancelled = bookings.length - active.length;
    const cancelRate = bookings.length > 0 ? Math.round((cancelled / bookings.length) * 100) : 0;

    const prevCancelled = prevMonth.filter((b) => b.status === "cancelled").length;
    const prevCancelRate = prevMonth.length > 0 ? Math.round((prevCancelled / prevMonth.length) * 100) : null;

    const monthNewTrend =
      prevMonth.length > 0 ? Math.round(((thisMonth.length - prevMonth.length) / prevMonth.length) * 100) : null;
    const cancelRateTrend = prevCancelRate !== null ? cancelRate - prevCancelRate : null;

    // Slot usage: today → end of month
    const days = eachDayOfInterval({ start: startOfDay(now), end: endOfMonth(now) });
    let capacity = 0;
    let used = 0;
    days.forEach((d) => {
      const ds = format(d, "yyyy-MM-dd");
      const avail = availability[ds];
      if (avail?.is_blocked) return;
      capacity += avail?.max_slots ?? 3;
      used += Math.min(bookingCounts[ds] || 0, avail?.max_slots ?? 3);
    });
    const usageRate = capacity > 0 ? Math.round((used / capacity) * 100) : 0;

    return {
      monthNew: thisMonth.length,
      monthNewTrend,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelRate,
      cancelRateTrend,
      used,
      capacity,
      usageRate,
    };
  }, [bookings, availability, bookingCounts, monthStart, monthEnd, prevMonthStart, prevMonthEnd]);

  const trend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(startOfDay(now), 29), end: startOfDay(now) });
    const counts = days.map((d) => {
      const ds = format(d, "yyyy-MM-dd");
      return {
        date: ds,
        label: format(d, "M/d"),
        count: bookings.filter((b) => format(new Date(b.created_at), "yyyy-MM-dd") === ds).length,
      };
    });
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [bookings]);

  const distributions = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "cancelled");
    const total = active.length;
    const by = (key: "inspection_type" | "property_type" | "region", labels: Record<string, string>) =>
      Object.entries(labels).map(([value, label]) => ({
        label,
        count: active.filter((b) => b[key] === value).length,
        total,
      }));
    return {
      inspection: by("inspection_type", inspectionLabels),
      property: by("property_type", propertyLabels),
      region: by("region", regionLabels),
    };
  }, [bookings]);

  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 關鍵指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-light">{metrics.monthNew}</p>
            <TrendBadge value={metrics.monthNewTrend} />
          </div>
          <p className="text-xs text-muted-foreground font-light">本月新預約</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-light mb-1">{metrics.pending}</p>
          <p className="text-xs text-muted-foreground font-light">待確認</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-light mb-1">{metrics.confirmed}</p>
          <p className="text-xs text-muted-foreground font-light">已確認</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-light">{metrics.cancelRate}%</p>
            <TrendBadge value={metrics.cancelRateTrend} suffix="pt" invert />
          </div>
          <p className="text-xs text-muted-foreground font-light">取消率</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft col-span-2 lg:col-span-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-light mb-1">{metrics.usageRate}%</p>
          <p className="text-xs text-muted-foreground font-light">
            本月名額使用率（{metrics.used}/{metrics.capacity}）
          </p>
        </Card>
      </div>

      {/* 趨勢圖 */}
      <Card className="p-6 border border-border shadow-soft">
        <h3 className="text-sm font-light mb-1">近 30 天預約趨勢</h3>
        <p className="text-xs text-muted-foreground font-light mb-6">每日新增的預約數量</p>
        <div className="flex items-end gap-[3px] h-32">
          {trend.counts.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div
                className="w-full bg-primary/60 group-hover:bg-primary rounded-t-sm transition-colors min-h-[2px]"
                style={{ height: `${(d.count / trend.max) * 100}%` }}
                title={`${d.label}：${d.count} 筆`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-light mt-2">
          <span>{trend.counts[0]?.label}</span>
          <span>{trend.counts[14]?.label}</span>
          <span>{trend.counts[29]?.label}</span>
        </div>
      </Card>

      {/* 分布統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">檢測類型分布</h3>
          {distributions.inspection.map((d) => (
            <DistributionBar key={d.label} {...d} />
          ))}
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">房屋類型分布</h3>
          {distributions.property.map((d) => (
            <DistributionBar key={d.label} {...d} />
          ))}
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">地區分布</h3>
          {distributions.region.map((d) => (
            <DistributionBar key={d.label} {...d} />
          ))}
        </Card>
      </div>

      {/* 近期動態 */}
      <Card className="p-6 border border-border shadow-soft">
        <h3 className="text-sm font-light mb-4">近期預約</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light py-6 text-center">尚無預約紀錄</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((b) => (
              <button
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-accent/30 -mx-2 px-2 rounded transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-light truncate">
                    {b.name || "未留姓名"}
                    <span className="text-muted-foreground ml-2">
                      {inspectionLabels[b.inspection_type] || b.inspection_type}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    {format(parseISO(b.preferred_date), "yyyy/MM/dd")} · {regionLabels[b.region] || b.region}
                    {b.project_name ? ` · ${b.project_name}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] font-light shrink-0 ${statusColors[b.status]}`}>
                  {statusLabels[b.status] || b.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OverviewDashboard;
