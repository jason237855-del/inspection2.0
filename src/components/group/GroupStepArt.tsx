import { Building2, CalendarDays } from "lucide-react";
import logoWhite from "@/assets/logo-mark-white.png";

/** 三步驟的示意圖（純 HTML／CSS 畫成，與網站風格一致；文字為示意用的範例，不是真實資料） */

const Caption = ({ dark = false }: { dark?: boolean }) => (
  <span
    className={`absolute bottom-2.5 right-3 text-[10px] tracking-wider ${
      dark ? "text-white/40" : "text-foreground/40"
    }`}
  >
    示意畫面
  </span>
);

/** 步驟 1：選擇建案 → 按「加入團報」 */
export const StepArtProject = () => (
  <div className="relative flex h-full items-center justify-center bg-primary/5 p-6">
    <div className="w-full max-w-[260px] rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-card-foreground">你的建案名稱</p>
          <p className="text-[11px] font-light text-muted-foreground">所在縣市區域</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 rounded-full bg-primary" />
      </div>
      <p className="mt-2 text-[11px] font-light text-muted-foreground">已報名 2 戶．再 1 戶即成團</p>
      <div className="mt-4 rounded-full bg-primary py-2 text-center text-xs text-primary-foreground ring-4 ring-primary/20">
        加入團報
      </div>
    </div>
    <Caption />
  </div>
);

/** 步驟 2：自選日期與時段 */
export const StepArtSlots = () => {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  const slots = ["09:00", "10:30", "14:00"];
  return (
    <div className="relative flex h-full items-center justify-center bg-primary/20 p-6">
      <div className="w-full max-w-[260px] rounded-2xl bg-card p-4 shadow-soft">
        <p className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
          選擇日期與時段
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => (
            <div
              key={d}
              className={`rounded-md py-1.5 text-[11px] ${
                i === 2 ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {slots.map((s, i) => (
            <div
              key={s}
              className={`rounded-lg border py-1.5 text-center text-[11px] ${
                i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
      <Caption />
    </div>
  );
};

/** 步驟 3：成團後的通知卡 */
export const StepArtDiscount = () => (
  <div className="relative flex h-full items-center justify-center bg-foreground p-6">
    <div className="relative w-full max-w-[260px]">
      {/* 疊在後面的兩張卡，做出通知堆疊的層次感 */}
      <div className="absolute inset-x-4 -bottom-2 h-full rounded-2xl bg-white/5" />
      <div className="absolute inset-x-2 -bottom-1 h-full rounded-2xl bg-white/10" />
      <div className="relative rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="flex items-center gap-1.5">
            <img src={logoWhite} alt="" className="h-3.5 w-auto" />
            診斷室驗屋
          </span>
          <span>剛剛</span>
        </div>
        <p className="mt-3 text-sm font-medium text-white">團報已成團</p>
        <p className="mt-1 text-xs font-light leading-relaxed text-white/75">同社區已達成團戶數，全團享團報優惠。</p>
      </div>
    </div>
    <Caption dark />
  </div>
);
