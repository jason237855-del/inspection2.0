import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfYear,
  endOfYear,
  subYears,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, Receipt, ListOrdered, ClipboardList } from "lucide-react";
import { TrendBadge } from "./OverviewDashboard";
import { statusLabels, statusColors, inspectionLabels, propertyLabels, regionLabels } from "./types";
import type { BookingRequest } from "./types";

type Period = "week" | "month" | "year";

type Props = {
  bookings: BookingRequest[];
  onOpenBooking: (booking: BookingRequest) => void;
};

const formatCurrency = (n: number) => `NT$ ${Math.round(n).toLocaleString("en-US")}`;

const periodLabels: Record<Period, string> = { week: "週", month: "月", year: "年" };
const compareLabels: Record<Period, string> = { week: "較上週", month: "較上月", year: "較去年" };

const SEGMENT_SHADES = [
  "bg-primary",
  "bg-primary/75",
  "bg-primary/55",
  "bg-primary/40",
  "bg-primary/28",
  "bg-primary/18",
];

const SegmentedRevenueBar = ({ items }: { items: { label: string; amount: number }[] }) => {
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const sorted = [...items].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-3">
      <div className="h-3 rounded-full bg-muted overflow-hidden flex">
        {total > 0 ? (
          sorted.map((item, i) =>
            item.amount > 0 ? (
              <div
                key={item.label}
                className={SEGMENT_SHADES[i % SEGMENT_SHADES.length]}
                style={{ width: `${(item.amount / total) * 100}%` }}
                title={`${item.label}：${formatCurrency(item.amount)}`}
              />
            ) : null
          )
        ) : (
          <div className="w-full bg-muted" />
        )}
      </div>
      <div className="space-y-1.5">
        {sorted.map((item, i) => {
          const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-light">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEGMENT_SHADES[i % SEGMENT_SHADES.length]}`} />
                {item.label}
              </span>
              <span className="text-muted-foreground font-light">
                {formatCurrency(item.amount)} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RevenueDashboard = ({ bookings, onOpenBooking }: Props) => {
  const [period, setPeriod] = useState<Period>("month");
  const now = new Date();

  const { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd } = useMemo(() => {
    if (period === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        periodStart: start,
        periodEnd: end,
        prevPeriodStart: subWeeks(start, 1),
        prevPeriodEnd: subWeeks(end, 1),
      };
    }
    if (period === "year") {
      const start = startOfYear(now);
      const end = endOfYear(now);
      return {
        periodStart: start,
        periodEnd: end,
        prevPeriodStart: subYears(start, 1),
        prevPeriodEnd: subYears(end, 1),
      };
    }
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return {
      periodStart: start,
      periodEnd: end,
      prevPeriodStart: startOfMonth(subMonths(now, 1)),
      prevPeriodEnd: endOfMonth(subMonths(now, 1)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const revenueEligible = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "completed"),
    [bookings]
  );

  const inRange = (b: BookingRequest, start: Date, end: Date) => {
    const created = format(new Date(b.created_at), "yyyy-MM-dd");
    return created >= format(start, "yyyy-MM-dd") && created <= format(end, "yyyy-MM-dd");
  };

  const periodEligible = useMemo(
    () => revenueEligible.filter((b) => inRange(b, periodStart, periodEnd)),
    [revenueEligible, periodStart, periodEnd]
  );

  const prevPeriodEligible = useMemo(
    () => revenueEligible.filter((b) => inRange(b, prevPeriodStart, prevPeriodEnd)),
    [revenueEligible, prevPeriodStart, prevPeriodEnd]
  );

  const metrics = useMemo(() => {
    const amountOf = (b: BookingRequest) => b.price ?? 0;
    const periodRevenue = periodEligible.reduce((sum, b) => sum + amountOf(b), 0);
    const prevPeriodRevenue = prevPeriodEligible.reduce((sum, b) => sum + amountOf(b), 0);
    const trend =
      prevPeriodRevenue > 0 ? Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100) : null;
    const periodCount = periodEligible.length;
    const avgOrderValue = periodCount > 0 ? periodRevenue / periodCount : 0;

    return { periodRevenue, prevPeriodRevenue, trend, periodCount, avgOrderValue };
  }, [periodEligible, prevPeriodEligible]);

  const trend = useMemo(() => {
    const amountInRange = (start: Date, end: Date) =>
      revenueEligible.filter((b) => inRange(b, start, end)).reduce((sum, b) => sum + (b.price ?? 0), 0);

    let buckets: { key: string; label: string; amount: number }[];
    let sparseLabels = false;

    if (period === "week") {
      const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
      buckets = days.map((d) => ({
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "EEEEE", { locale: zhTW }),
        amount: amountInRange(d, d),
      }));
    } else if (period === "year") {
      const months = Array.from({ length: 12 }, (_, i) => new Date(periodStart.getFullYear(), i, 1));
      buckets = months.map((m) => ({
        key: format(m, "yyyy-MM"),
        label: format(m, "M月"),
        amount: amountInRange(startOfMonth(m), endOfMonth(m)),
      }));
    } else {
      const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
      buckets = days.map((d) => ({
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "d"),
        amount: amountInRange(d, d),
      }));
      sparseLabels = true;
    }

    const max = Math.max(1, ...buckets.map((b) => b.amount));
    return { buckets, max, sparseLabels };
  }, [revenueEligible, period, periodStart, periodEnd]);

  const distributions = useMemo(() => {
    const by = (key: "inspection_type" | "property_type" | "region", labels: Record<string, string>) =>
      Object.entries(labels).map(([value, label]) => ({
        label,
        amount: periodEligible.filter((b) => b[key] === value).reduce((sum, b) => sum + (b.price ?? 0), 0),
      }));
    return {
      inspection: by("inspection_type", inspectionLabels),
      property: by("property_type", propertyLabels),
      region: by("region", regionLabels),
    };
  }, [periodEligible]);

  const details = useMemo(
    () => [...periodEligible].sort((a, b) => b.preferred_date.localeCompare(a.preferred_date)),
    [periodEligible]
  );

  const trendTicks = trend.sparseLabels
    ? [0, Math.floor((trend.buckets.length - 1) / 2), trend.buckets.length - 1]
    : trend.buckets.map((_, i) => i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light">營收狀況</h2>
        <div className="inline-flex rounded-full border border-border p-0.5 gap-0.5">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-light transition-colors ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 關鍵指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-light">{formatCurrency(metrics.periodRevenue)}</p>
            <TrendBadge value={metrics.trend} compareLabel={compareLabels[period]} />
          </div>
          <p className="text-xs text-muted-foreground font-light">本{periodLabels[period]}營收</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <History className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-light mb-1">{formatCurrency(metrics.prevPeriodRevenue)}</p>
          <p className="text-xs text-muted-foreground font-light">上{periodLabels[period]}營收</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-light mb-1">{formatCurrency(metrics.avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground font-light">期間平均客單價</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <ListOrdered className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-light mb-1">{metrics.periodCount}</p>
          <p className="text-xs text-muted-foreground font-light">期間訂單數（已確認＋已完成）</p>
        </Card>
      </div>

      {/* 趨勢圖 */}
      <Card className="p-6 border border-border shadow-soft">
        <h3 className="text-sm font-light mb-1">本{periodLabels[period]}營收趨勢</h3>
        <p className="text-xs text-muted-foreground font-light mb-6">依訂單建立時間統計已確認＋已完成訂單的金額</p>
        <div className="flex items-end gap-2 h-32">
          {trend.buckets.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div
                className="w-full bg-primary/60 group-hover:bg-primary rounded-t-sm transition-colors min-h-[2px]"
                style={{ height: `${(d.amount / trend.max) * 100}%` }}
                title={`${d.label}：${formatCurrency(d.amount)}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-light mt-2">
          {trend.sparseLabels
            ? trendTicks.map((i) => <span key={i}>{trend.buckets[i]?.label}</span>)
            : trend.buckets.map((d) => (
                <span key={d.key} className="flex-1 text-center">
                  {d.label}
                </span>
              ))}
        </div>
      </Card>

      {/* 分布統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">檢測類型營收分布</h3>
          <SegmentedRevenueBar items={distributions.inspection} />
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">房屋類型營收分布</h3>
          <SegmentedRevenueBar items={distributions.property} />
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">地區營收分布</h3>
          <SegmentedRevenueBar items={distributions.region} />
        </Card>
      </div>

      {/* 營收明細 */}
      <Card className="p-6 border border-border shadow-soft">
        <h3 className="text-sm font-light mb-1">營收明細</h3>
        <p className="text-xs text-muted-foreground font-light mb-4">
          本{periodLabels[period]}已確認或已完成的訂單，共 {details.length} 筆
        </p>
        {details.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light py-8 text-center">
            本{periodLabels[period]}沒有已確認或已完成的預約
          </p>
        ) : (
          <div className="divide-y divide-border">
            {details.map((b) => (
              <button
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-accent/30 -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-light truncate">{b.name || "未留姓名"}</p>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">
                      {format(parseISO(b.preferred_date), "yyyy/MM/dd")} ·{" "}
                      {inspectionLabels[b.inspection_type] || b.inspection_type}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-light">{b.price != null ? formatCurrency(b.price) : "—"}</p>
                  <Badge variant="outline" className={`text-[10px] font-light mt-1 ${statusColors[b.status]}`}>
                    {statusLabels[b.status] || b.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RevenueDashboard;
