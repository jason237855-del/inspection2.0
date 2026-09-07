import { Home, ClipboardList, CalendarDays, Settings, Plus } from "lucide-react";

type Props = {
  activeTab: string;
  onChange: (tab: string) => void;
  onCreate: () => void;
};

const items = [
  { value: "overview", label: "總覽", icon: Home },
  { value: "bookings", label: "預約紀錄", icon: ClipboardList },
] as const;

const itemsRight = [
  { value: "availability", label: "名額管理", icon: CalendarDays },
  { value: "settings", label: "設定", icon: Settings },
] as const;

const MobileBottomNav = ({ activeTab, onChange, onCreate }: Props) => {
  const renderItem = (item: (typeof items)[number]) => {
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
    </nav>
  );
};

export default MobileBottomNav;
