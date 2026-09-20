import { CalendarDays, Users, BadgePercent } from "lucide-react";

const steps = [
  { icon: Users, title: "選擇建案", desc: "選擇所購買的建案，按「加入團報」，資訊將生成預約表單。" },
  { icon: CalendarDays, title: "自選時段", desc: "每戶屋主皆可自由選擇時間；優先保留已完成訂金支付之名額。" },
  { icon: BadgePercent, title: "團體優惠", desc: "社區達到成團戶數，所有屋主皆享團報優惠。" },
];

const notes = [
  "團報折扣不與「LINE 好友折價」並用，團報訂單依成團戶數計價。",
  "尚未成團時先以原價計，無需重新預約。",
  "已取消的訂單，不計入成團戶數。",
];

/** 團報流程與須知（團報專區與各建案頁面共用） */
const GroupHowItWorks = () => (
  <div className="space-y-10">
    <div className="grid gap-5 md:grid-cols-3">
      {steps.map((s, i) => (
        <div key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <s.icon className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <h3 className="mb-2 text-base font-semibold text-card-foreground">{s.title}</h3>
          <p className="text-sm font-light leading-relaxed text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </div>
    <ul className="mx-auto max-w-2xl space-y-2 text-sm font-light text-muted-foreground">
      {notes.map((n) => (
        <li key={n} className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>{n}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default GroupHowItWorks;
