import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, TrendingUp, Receipt, ListOrdered } from "lucide-react";
import { TrendBadge } from "./OverviewDashboard";
import { statusLabels, statusColors, inspectionLabels, propertyLabels, regionLabels } from "./types";
import type { BookingRequest } from "./types";

type Props = {
  bookings: BookingRequest[];
};

const formatCurrency = (n: number) => `NT$ ${Math.round(n).toLocaleString("en-US")}`;

const RevenueBar = ({ label, amount, total }: { label: string; amount: number; total: number }) => {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-light">{label}</span>
        <span className="text-muted-foreground font-light">
          {formatCurrency(amount)} · {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const RevenueDashboard = ({ bookings }: Props) => {
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const revenueEligible = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "completed"),
    [bookings]
  );

  const metrics = useMemo(() => {
    const amountOf = (b: BookingRequest) => b.price ?? 0;

    const thisMonth = revenueEligible.filter((b) => {
      const created = format(new Date(b.created_at), "yyyy-MM-dd");
      return created >= monthStart && created <= monthEnd;
    });
    const prevMonth = revenueEligible.filter((b) => {
      const created = format(new Date(b.created_at), "yyyy-MM-dd");
      return created >= prevMonthStart && created <= prevMonthEnd;
    });

    const monthRevenue = thisMonth.reduce((sum, b) => sum + amountOf(b), 0);
    const prevMonthRevenue = prevMonth.reduce((sum, b) => sum + amountOf(b), 0);
    const monthRevenueTrend =
      prevMonthRevenue > 0 ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : null;

    const totalRevenue = revenueEligible.reduce((sum, b) => sum + amountOf(b), 0);
    const eligibleCount = revenueEligible.length;
    const avgOrderValue = eligibleCount > 0 ? totalRevenue / eligibleCount : 0;

    return { monthRevenue, monthRevenueTrend, totalRevenue, eligibleCount, avgOrderValue };
  }, [revenueEligible, monthStart, monthEnd, prevMonthStart, prevMonthEnd]);

  const trend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => subMonths(startOfMonth(now), 11 - i));
    const counts = months.map((m) => {
      const mStart = format(startOfMonth(m), "yyyy-MM-dd");
      const mEnd = format(endOfMonth(m), "yyyy-MM-dd");
      const amount = revenueEligible
        .filter((b) => {
          const created = format(new Date(b.created_at), "yyyy-MM-dd");
          return created >= mStart && created <= mEnd;
        })
        .reduce((sum, b) => sum + (b.price ?? 0), 0);
      return { key: mStart, label: format(m, "M月"), amount };
    });
    const max = Math.max(1, ...counts.map((c) => c.amount));
    return { counts, max };
  }, [revenueEligible, now]);

  const distributions = useMemo(() => {
    const total = metrics.totalRevenue;
    const by = (key: "inspection_type" | "property_type" | "region", labels: Record<string, string>) =>
      Object.entries(labels).map(([value, label]) => ({
        label,
        amount: revenueEligible.filter((b) => b[key] === value).reduce((sum, b) => sum + (b.price ?? 0), 0),
        total,
      }));
    return {
      inspection: by("inspection_type", inspectionLabels),
      property: by("property_type", propertyLabels),
      region: by("region", regionLabels),
    };
  }, [revenueEligible, metrics.totalRevenue]);

  const details = useMemo(
    () => [...revenueEligible].sort((a, b) => b.preferred_date.localeCompare(a.preferred_date)),
    [revenueEligible]
  );

  return (
    <div className="space-y-6">
      {/* 關鍵指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-light">{formatCurrency(metrics.monthRevenue)}</p>
            <TrendBadge value={metrics.monthRevenueTrend} />
          </div>
          <p className="text-xs text-muted-foreground font-light">本月營收</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <TrendingUp className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-light mb-1">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground font-light">累計營收</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-light mb-1">{formatCurrency(metrics.avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground font-light">平均客單價</p>
        </Card>
        <Card className="p-5 border border-border shadow-soft">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <ListOrdered className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-light mb-1">{metrics.eligibleCount}</p>
          <p className="text-xs text-muted-foreground font-light">已計入訂單數（已確認＋已完成）</p>
        </Card>
      </div>

      {/* 趨勢圖 */}
      <Card className="p-6 border border-border shadow-soft">
        <h3 className="text-sm font-light mb-1">近 12 個月營收趨勢</h3>
        <p className="text-xs text-muted-foreground font-light mb-6">依訂單建立時間統計已確認＋已完成訂單的金額</p>
        <div className="flex items-end gap-2 h-32">
          {trend.counts.map((d) => (
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
          {trend.counts.map((d) => (
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
          {distributions.inspection.map((d) => (
            <RevenueBar key={d.label} {...d} />
          ))}
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">房屋類型營收分布</h3>
          {distributions.property.map((d) => (
            <RevenueBar key={d.label} {...d} />
          ))}
        </Card>
        <Card className="p-6 border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-light">地區營收分布</h3>
          {distributions.region.map((d) => (
            <RevenueBar key={d.label} {...d} />
          ))}
        </Card>
      </div>

      {/* 營收明細 */}
      <Card className="border border-border shadow-soft p-4 md:p-6">
        <h3 className="text-sm font-light mb-1">營收明細</h3>
        <p className="text-xs text-muted-foreground font-light mb-4">
          僅列出狀態為「已確認」或「已完成」的訂單，共 {details.length} 筆
        </p>
        {details.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light py-8 text-center">
            目前沒有已確認或已完成的預約
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">客戶</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">預約日期</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">檢測項目</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">狀態</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((b) => (
                  <TableRow key={b.id} className="border-border">
                    <TableCell className="text-sm font-light whitespace-nowrap">{b.name || "—"}</TableCell>
                    <TableCell className="text-sm font-light whitespace-nowrap">
                      {format(parseISO(b.preferred_date), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell className="text-sm font-light whitespace-nowrap">
                      {inspectionLabels[b.inspection_type] || b.inspection_type}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={`text-[10px] font-light ${statusColors[b.status]}`}>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-light whitespace-nowrap text-right">
                      {b.price != null ? formatCurrency(b.price) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RevenueDashboard;
