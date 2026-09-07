import { Home, ClipboardList, CalendarDays, Settings, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark-black.png";

type NavItem = {
  value: string;
  label: string;
  icon: typeof Home;
  badge?: number;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type Props = {
  activeTab: string;
  onChange: (tab: string) => void;
  onCreate: () => void;
  pendingCount: number;
  userEmail?: string | null;
  onSignOut: () => void;
};

const AdminSidebar = ({ activeTab, onChange, onCreate, pendingCount, userEmail, onSignOut }: Props) => {
  const navGroups: NavGroup[] = [
    {
      label: "管理",
      items: [
        { value: "overview", label: "總覽", icon: Home },
        { value: "bookings", label: "預約紀錄", icon: ClipboardList, badge: pendingCount },
        { value: "availability", label: "名額管理", icon: CalendarDays },
      ],
    },
    {
      label: "帳號",
      items: [{ value: "settings", label: "管理者設定", icon: Settings }],
    },
  ];

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 border-r border-border bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <img src={logoMark} alt="診斷室驗屋" className="h-7 w-auto" width={33} height={28} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide leading-tight">診斷室驗屋</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
            後台管理
          </span>
        </div>
      </div>

      <div className="px-3">
        <Button
          onClick={onCreate}
          size="sm"
          className="w-full justify-start text-xs font-light"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          新增預約
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => onChange(item.value)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-light transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {!!item.badge && item.badge > 0 && (
                      <span
                        className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                          active
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs font-light text-foreground truncate mb-2">{userEmail || "—"}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full justify-start text-xs font-light text-destructive hover:text-destructive px-0"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          登出
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
