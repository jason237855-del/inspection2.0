import { useState } from "react";
import { Home, ClipboardList, CalendarDays, Plus, Clock, Users, TrendingUp, Settings, MoreHorizontal, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Props = {
  activeTab: string;
  onChange: (tab: string) => void;
  onCreate: () => void;
};

const items = [
  { value: "overview", label: "總覽", icon: Home },
  { value: "bookings", label: "預約紀錄", icon: ClipboardList },
] as const;

const itemsRight = [{ value: "availability", label: "名額管理", icon: CalendarDays }] as const;

// 底部列放不下所有分頁，其餘收進「更多」（與桌機側邊欄的項目一致）
const moreItems = [
  { value: "timeslots", label: "時段管理", icon: Clock },
  { value: "group", label: "團報管理", icon: Users },
  { value: "revenue", label: "營收狀況", icon: TrendingUp },
  { value: "seo", label: "SEO 設定", icon: Search },
  { value: "settings", label: "管理者設定", icon: Settings },
] as const;

const MobileBottomNav = ({ activeTab, onChange, onCreate }: Props) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((m) => m.value === activeTab);

  const renderItem = (item: { value: string; label: string; icon: typeof Home }) => {
    const Icon = item.icon;
    const active = activeTab === item.value;
    return (
      <button
        key={item.value}
        onClick={() => onChange(item.value)}
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-light transition-colors ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
        {item.label}
      </button>
    );
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map(renderItem)}

        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={onCreate}
            aria-label="新增預約"
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {itemsRight.map(renderItem)}

        <button
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-light transition-colors ${
            moreActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.25 : 1.75} />
          更多
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle className="font-light">更多功能</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    onChange(item.value);
                    setMoreOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/40"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
