import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfDay,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Footer from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import OverviewDashboard from "@/components/admin/OverviewDashboard";
import AdminSettings from "@/components/admin/AdminSettings";
import BookingEditorDialog from "@/components/admin/BookingEditorDialog";
import MobileBottomNav from "@/components/admin/MobileBottomNav";
import MobileBookingDetail from "@/components/admin/MobileBookingDetail";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  statusLabels,
  statusColors,
  statusOptions,
  inspectionLabels,
  inspectionOptions,
  propertyLabels,
  propertyOptions,
  regionLabels,
  regionOptions,
  timeSlotLabels,
} from "@/components/admin/types";
import type { BookingRequest, Availability } from "@/components/admin/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Search,
  Download,
  RotateCcw,
  X,
  Filter,
  Bell,
  BellOff,
  MapPin,
  Home,
  ClipboardList,
  Phone,
  Mail,
  User,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Ban,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;


const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inspectionFilter, setInspectionFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("pending_first");

  const [currentPage, setCurrentPage] = useState(1);
  const [detailBooking, setDetailBooking] = useState<BookingRequest | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookingRequest | null>(null);

  const [newBookingAlert, setNewBookingAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifyOn, setNotifyOn] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("admin-notify") === "on"
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [isAdmin, adminLoading, navigate]);

  const playChime = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.62);
      osc.onended = () => ctx.close();
    } catch {
      /* audio unavailable — ignore */
    }
  };

  const toggleNotifications = async () => {
    if (notifyOn) {
      setNotifyOn(false);
      localStorage.setItem("admin-notify", "off");
      toast.info("已關閉新預約通知");
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setNotifyOn(true);
    localStorage.setItem("admin-notify", "on");
    playChime();
    toast.success("已開啟新預約通知", { description: "有新預約時會即時提示並響鈴" });
  };

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("booking-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "booking_requests" },
        (payload) => {
          const newBooking = payload.new as BookingRequest;
          setBookings((prev) => [newBooking, ...prev]);
          setBookingCounts((prev) => ({
            ...prev,
            [newBooking.preferred_date]: (prev[newBooking.preferred_date] || 0) + 1,
          }));
          setNewBookingAlert(true);
          setUnreadCount((c) => c + 1);
          const desc = `${newBooking.name || "新客戶"} 預約了 ${format(
            parseISO(newBooking.preferred_date),
            "yyyy/MM/dd"
          )}`;
          toast.info("收到新預約", {
            description: desc,
            action: {
              label: "查看",
              onClick: () => {
                setActiveTab("bookings");
                setUnreadCount(0);
              },
            },
          });
          if (notifyOn) {
            playChime();
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("診斷室驗屋｜收到新預約", { body: desc, tag: newBooking.id });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "booking_requests" },
        (payload) => {
          const updated = payload.new as BookingRequest;
          setBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "booking_requests" },
        (payload) => {
          const removed = payload.old as { id?: string };
          if (!removed?.id) return;
          setBookings((prev) => prev.filter((b) => b.id !== removed.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, notifyOn]);

  const fetchData = async () => {
    setLoadingData(true);
    const today = format(new Date(), "yyyy-MM-dd");

    const [{ data: bookingsData }, { data: availabilityData }, { data: countsData }] = await Promise.all([
      supabase.from("booking_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_availability").select("*").gte("date", today),
      supabase
        .from("booking_requests")
        .select("preferred_date")
        .gte("preferred_date", today)
        .in("status", ["pending", "confirmed"]),
    ]);

    const availMap: Record<string, Availability> = {};
    availabilityData?.forEach((row) => {
      availMap[row.date] = row;
    });

    const counts: Record<string, number> = {};
    countsData?.forEach((row) => {
      counts[row.preferred_date] = (counts[row.preferred_date] || 0) + 1;
    });

    setBookings(bookingsData || []);
    setAvailability(availMap);
    setBookingCounts(counts);
    setLoadingData(false);
    setNewBookingAlert(false);
    setUnreadCount(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const updateBookingStatus = async (id: string, status: string) => {
    if (status === "cancelled") {
      const target = bookings.find((b) => b.id === id);
      if (target && target.status !== "cancelled") {
        const ok = window.confirm(
          `確定要取消 ${target.name || "此客戶"} ${format(parseISO(target.preferred_date), "yyyy/MM/dd")} 的預約嗎？`
        );
        if (!ok) return;
      }
    }
    const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error("更新狀態失敗");
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    if (detailBooking?.id === id) {
      setDetailBooking((prev) => (prev ? { ...prev, status } : null));
    }
    toast.success("狀態已更新");
  };

  const openCreate = () => {
    setEditingBooking(null);
    setEditorOpen(true);
  };

  const openEdit = (booking: BookingRequest) => {
    setEditingBooking(booking);
    setEditorOpen(true);
  };

  const handleSaved = (saved: BookingRequest, mode: "create" | "update") => {
    if (mode === "create") {
      setBookings((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)]);
    } else {
      setBookings((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
      if (detailBooking?.id === saved.id) setDetailBooking(saved);
    }
  };

  const deleteBooking = async (booking: BookingRequest) => {
    const { error } = await supabase.from("booking_requests").delete().eq("id", booking.id);
    if (error) {
      toast.error("刪除失敗", { description: error.message });
      return;
    }
    setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    if (detailBooking?.id === booking.id) setDetailBooking(null);
    setDeleteTarget(null);
    toast.success("訂單已刪除");
  };

  const updateBookingNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from("booking_requests").update({ notes }).eq("id", id);
    if (error) {
      toast.error("儲存備註失敗");
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, notes } : b)));
    if (detailBooking?.id === id) {
      setDetailBooking((prev) => (prev ? { ...prev, notes } : null));
    }
    toast.success("備註已儲存");
  };

  const saveAvailability = async (dateStr: string, updates: Partial<Availability>) => {
    const existing = availability[dateStr];
    const payload = {
      date: dateStr,
      max_slots: existing?.max_slots ?? 3,
      is_blocked: existing?.is_blocked ?? false,
      reason: existing?.reason ?? null,
      ...updates,
    };

    const { error } = await supabase.from("booking_availability").upsert(payload);
    if (error) {
      toast.error("儲存失敗");
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      [dateStr]: { ...payload, reason: payload.reason || null },
    }));
    toast.success("日期設定已儲存");
  };

  const saveBatchAvailability = async (dates: string[], updates: Partial<Availability>) => {
    const payloads = dates.map((dateStr) => {
      const existing = availability[dateStr];
      return {
        date: dateStr,
        max_slots: existing?.max_slots ?? 3,
        is_blocked: existing?.is_blocked ?? false,
        reason: existing?.reason ?? null,
        ...updates,
      };
    });

    const { error } = await supabase.from("booking_availability").upsert(payloads);
    if (error) {
      toast.error("批次儲存失敗");
      return;
    }

    setAvailability((prev) => {
      const next = { ...prev };
      payloads.forEach((p) => {
        next[p.date] = { ...p, reason: p.reason || null };
      });
      return next;
    });

    setSelectedDates([]);
    toast.success(`已更新 ${dates.length} 個日期`);
  };

  const blockWeekends = async () => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
    const weekends = days
      .filter((d) => d.getDay() === 0 || d.getDay() === 6)
      .map((d) => format(d, "yyyy-MM-dd"));

    if (weekends.length === 0) return;

    await saveBatchAvailability(weekends, { is_blocked: true, reason: "週末休息" });
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(q) ||
          (b.phone || "").toLowerCase().includes(q) ||
          (b.project_name || "").toLowerCase().includes(q) ||
          (b.address || "").toLowerCase().includes(q) ||
          (b.email || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (inspectionFilter !== "all") {
      result = result.filter((b) => b.inspection_type === inspectionFilter);
    }
    if (propertyFilter !== "all") {
      result = result.filter((b) => b.property_type === propertyFilter);
    }
    if (regionFilter !== "all") {
      result = result.filter((b) => b.region === regionFilter);
    }
    if (dateFrom) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      result = result.filter((b) => b.preferred_date >= fromStr);
    }
    if (dateTo) {
      const toStr = format(dateTo, "yyyy-MM-dd");
      result = result.filter((b) => b.preferred_date <= toStr);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "pending_first": {
          const rank = (s: string) => (s === "pending" ? 0 : s === "confirmed" ? 1 : 2);
          const diff = rank(a.status) - rank(b.status);
          if (diff !== 0) return diff;
          return b.created_at.localeCompare(a.created_at);
        }
        case "preferred_date_asc":
          return a.preferred_date.localeCompare(b.preferred_date);
        case "preferred_date_desc":
          return b.preferred_date.localeCompare(a.preferred_date);
        case "created_at_asc":
          return a.created_at.localeCompare(b.created_at);
        case "created_at_desc":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });

    return result;
  }, [bookings, searchQuery, statusFilter, inspectionFilter, propertyFilter, regionFilter, dateFrom, dateTo, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, inspectionFilter, propertyFilter, regionFilter, dateFrom, dateTo, sortBy]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const exportCSV = () => {
    const headers = [
      "預約編號",
      "建立時間",
      "期望日期",
      "檢測類型",
      "房屋類型",
      "地區",
      "建案名稱",
      "姓名",
      "電話",
      "電子郵件",
      "地址",
      "狀態",
      "備註",
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      format(new Date(b.created_at), "yyyy/MM/dd HH:mm"),
      format(parseISO(b.preferred_date), "yyyy/MM/dd"),
      inspectionLabels[b.inspection_type] || b.inspection_type,
      propertyLabels[b.property_type] || b.property_type,
      regionLabels[b.region] || b.region,
      b.project_name || "",
      b.name || "",
      b.phone || "",
      b.email || "",
      b.address || "",
      statusLabels[b.status] || b.status,
      b.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `預約紀錄_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV 匯出成功");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setInspectionFilter("all");
    setPropertyFilter("all");
    setRegionFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortBy("pending_first");
  };

  const openDetail = (booking: BookingRequest) => {
    setDetailBooking(booking);
    setDetailNotes(booking.notes || "");
  };

  if (adminLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar
        activeTab={activeTab}
        onChange={setActiveTab}
        onCreate={openCreate}
        pendingCount={stats.pending}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 min-w-0">
      <main className="pt-10 pb-24 md:pb-10 md:pt-8">
        <div className="w-full px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1400px] mx-auto md:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center justify-end gap-3 mb-6">
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {newBookingAlert && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Bell className="h-3 w-3" />
                        新預約
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  variant={notifyOn ? "secondary" : "ghost"}
                  size="sm"
                  onClick={toggleNotifications}
                  aria-pressed={notifyOn}
                  className="relative text-[11px] tracking-wider font-normal"
                >
                  {notifyOn ? <Bell className="mr-2 h-3 w-3" /> : <BellOff className="mr-2 h-3 w-3" />}
                  {notifyOn ? "通知已開啟" : "開啟預約通知"}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-[11px] uppercase tracking-wider font-normal text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 h-3 w-3" />
                  登出
                </Button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-light mb-3 tracking-tight">後台管理</h1>
            <p className="text-sm text-muted-foreground font-light">管理預約名額與檢視預約紀錄</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <Card className="p-6 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-light mb-1">{stats.total}</p>
              <p className="text-xs text-muted-foreground font-light">總預約數</p>
            </Card>

            <Card className="p-6 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-light mb-1">{stats.pending}</p>
              <p className="text-xs text-muted-foreground font-light">待確認</p>
            </Card>

            <Card className="p-6 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <p className="text-2xl font-light mb-1">{stats.confirmed}</p>
              <p className="text-xs text-muted-foreground font-light">已確認</p>
            </Card>

            <Card className="p-6 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-light mb-1">{stats.cancelled}</p>
              <p className="text-xs text-muted-foreground font-light">已取消</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="mt-0">
                <OverviewDashboard
                  bookings={bookings}
                  availability={availability}
                  bookingCounts={bookingCounts}
                  onOpenBooking={(b) => {
                    setActiveTab("bookings");
                    openDetail(b);
                  }}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <AdminSettings />
              </TabsContent>


              <TabsContent value="availability" className="mt-0 space-y-6">
                <Card className="border border-border shadow-soft p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-lg font-light">{format(currentMonth, "yyyy年 MMMM", { locale: zhTW })}</h2>
                    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:pb-0">
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCurrentMonth(new Date())}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        今天
                      </Button>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1 hidden md:block" />
                      <Button variant="outline" size="sm" className="shrink-0" onClick={blockWeekends}>
                        關閉本週末
                      </Button>
                      <div className="flex items-center gap-2 ml-1 shrink-0">
                        <Switch id="batchMode" checked={batchMode} onCheckedChange={setBatchMode} />
                        <Label htmlFor="batchMode" className="text-xs font-light cursor-pointer">
                          批次選取
                        </Label>
                      </div>
                    </div>
                  </div>

                  {batchMode && selectedDates.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg border border-border bg-accent/30 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        已選取 {selectedDates.length} 天
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveBatchAvailability(selectedDates, { is_blocked: true, reason: "批次關閉" })}
                      >
                        設為不開放
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveBatchAvailability(selectedDates, { is_blocked: false })}
                      >
                        恢復開放
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            統一名額
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48">
                          <div className="space-y-2">
                            <Label className="text-xs font-light">每日名額</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              defaultValue={3}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = parseInt((e.target as HTMLInputElement).value) || 3;
                                  saveBatchAvailability(selectedDates, { max_slots: value });
                                }
                              }}
                              className="text-sm font-light"
                            />
                            <p className="text-[10px] text-muted-foreground">按 Enter 套用</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDates([])}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        清除
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                    {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                      <div key={d} className="text-xs text-muted-foreground font-light py-2">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const avail = availability[dateStr];
                      const count = bookingCounts[dateStr] || 0;
                      const maxSlots = avail?.max_slots ?? 3;
                      const isBlocked = avail?.is_blocked ?? false;
                      const isFull = !isBlocked && count >= maxSlots;
                      const isPast = day < startOfDay(new Date());
                      const isSelected = selectedDates.includes(dateStr);

                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            if (batchMode && !isPast) {
                              toggleDateSelection(dateStr);
                            } else if (!isPast) {
                              setSelectedDate(day);
                            }
                          }}
                          disabled={isPast && !batchMode}
                          className={`aspect-square rounded-lg border p-2 text-left transition-colors text-xs relative ${
                            isSelected
                              ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary"
                              : ""
                          } ${
                            isPast
                              ? "bg-muted/30 border-border text-muted-foreground/50 cursor-not-allowed"
                              : isBlocked
                              ? "bg-destructive/10 border-destructive/20 text-destructive"
                              : isFull
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-card border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-light mb-1">{format(day, "d")}</div>
                          {!isPast && !isBlocked && (
                            <div className="text-[10px] opacity-80">
                              {count}/{maxSlots}
                            </div>
                          )}
                          {!isPast && isBlocked && <div className="text-[10px] opacity-80">關閉</div>}
                          {batchMode && !isPast && (
                            <div className="absolute top-1.5 right-1.5">
                              <div
                                className={`w-2.5 h-2.5 rounded-full border ${
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                }`}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-card border border-border" />
                      <span>可預約</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
                      <span>已額滿</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20" />
                      <span>不開放</span>
                    </div>
                  </div>
                </Card>

                <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-light">
                        {selectedDate && format(selectedDate, "yyyy年MM月dd日")} 設定
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        調整該日期的開放狀態與可預約名額
                      </DialogDescription>
                    </DialogHeader>
                    {selectedDate && (
                      <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="isBlocked" className="text-sm font-light">
                            不開放預約
                          </Label>
                          <Switch
                            id="isBlocked"
                            checked={availability[format(selectedDate, "yyyy-MM-dd")]?.is_blocked ?? false}
                            onCheckedChange={(checked) =>
                              saveAvailability(format(selectedDate, "yyyy-MM-dd"), { is_blocked: checked })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxSlots" className="text-sm font-light">
                            每日可預約名額
                          </Label>
                          <Input
                            id="maxSlots"
                            type="number"
                            min={1}
                            max={20}
                            value={availability[format(selectedDate, "yyyy-MM-dd")]?.max_slots ?? 3}
                            onChange={(e) =>
                              saveAvailability(format(selectedDate, "yyyy-MM-dd"), {
                                max_slots: parseInt(e.target.value) || 3,
                              })
                            }
                            className="text-sm font-light"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reason" className="text-sm font-light">
                            備註（選填）
                          </Label>
                          <Input
                            id="reason"
                            value={availability[format(selectedDate, "yyyy-MM-dd")]?.reason ?? ""}
                            onChange={(e) =>
                              saveAvailability(format(selectedDate, "yyyy-MM-dd"), { reason: e.target.value })
                            }
                            placeholder="例如：國定假日、內部會議"
                            className="text-sm font-light"
                          />
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="bookings" className="mt-0 space-y-6">
                <Card className="border border-border shadow-soft p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-lg font-light">預約訂單管理</h2>
                      <p className="text-xs text-muted-foreground font-light mt-1">
                        共 {filteredBookings.length} 筆訂單，可新增、編輯、變更狀態與刪除
                      </p>
                    </div>
                    <Button size="sm" onClick={openCreate} className="text-xs font-light">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      新增預約
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-4 md:hidden">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="姓名、電話、建案、地址"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm font-light rounded-full"
                      />
                    </div>
                    <Button
                      variant={filtersOpen ? "secondary" : "outline"}
                      size="icon"
                      className="shrink-0 rounded-full"
                      onClick={() => setFiltersOpen((v) => !v)}
                      aria-label="篩選"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={`${filtersOpen ? "flex" : "hidden"} md:flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6`}>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      <div className="hidden md:block xl:col-span-2 space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
                          搜尋
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="姓名、電話、建案、地址"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-sm font-light"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
                          狀態
                        </Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="text-sm font-light">
                            <SelectValue placeholder="全部狀態" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部狀態</SelectItem>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
                          檢測類型
                        </Label>
                        <Select value={inspectionFilter} onValueChange={setInspectionFilter}>
                          <SelectTrigger className="text-sm font-light">
                            <SelectValue placeholder="全部類型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部類型</SelectItem>
                            {inspectionOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
                          房屋類型
                        </Label>
                        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                          <SelectTrigger className="text-sm font-light">
                            <SelectValue placeholder="全部" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            {propertyOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground">
                          地區
                        </Label>
                        <Select value={regionFilter} onValueChange={setRegionFilter}>
                          <SelectTrigger className="text-sm font-light">
                            <SelectValue placeholder="全部地區" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部地區</SelectItem>
                            {regionOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        清除
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        匯出 CSV
                      </Button>
                    </div>
                  </div>

                  <div className={`${filtersOpen ? "flex" : "hidden"} md:flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4`}>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        <span>共 {filteredBookings.length} 筆</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>日期區間</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs font-light">
                              {dateFrom ? format(dateFrom, "yyyy/MM/dd") : "開始"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <span>至</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs font-light">
                              {dateTo ? format(dateTo, "yyyy/MM/dd") : "結束"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        {(dateFrom || dateTo) && (
                          <button
                            onClick={() => {
                              setDateFrom(undefined);
                              setDateTo(undefined);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            清除日期
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground font-light">排序</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-44 text-xs font-light">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_first">待確認優先</SelectItem>
                          <SelectItem value="created_at_desc">建立時間：新到舊</SelectItem>
                          <SelectItem value="created_at_asc">建立時間：舊到新</SelectItem>
                          <SelectItem value="preferred_date_desc">期望日期：新到舊</SelectItem>
                          <SelectItem value="preferred_date_asc">期望日期：舊到新</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="border border-border shadow-soft overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">預約單號</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">客戶 / 電話</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">預約日期時段</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">檢測項目</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">房屋地址</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">LINE</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap">狀態</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-normal whitespace-nowrap text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedBookings.map((booking) => (
                            <TableRow
                              key={booking.id}
                              className="border-border cursor-pointer hover:bg-accent/30"
                              onClick={() => openDetail(booking)}
                            >
                              <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                #{booking.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell className="text-sm font-light whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p>{booking.name || "—"}</p>
                                  <p className="text-xs text-muted-foreground">{booking.phone || "—"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-light whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p>{format(parseISO(booking.preferred_date), "yyyy/MM/dd")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.time_slot ? timeSlotLabels[booking.time_slot] || booking.time_slot : "未指定時段"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-light whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p>{inspectionLabels[booking.inspection_type] || booking.inspection_type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {propertyLabels[booking.property_type] || booking.property_type} ·{" "}
                                    {regionLabels[booking.region] || booking.region}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-light max-w-[220px]">
                                <div className="space-y-0.5">
                                  <p className="truncate">{booking.address || "—"}</p>
                                  {booking.project_name && (
                                    <p className="text-xs text-muted-foreground truncate">{booking.project_name}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {booking.line_user_id ? (
                                  <Badge variant="outline" className="text-[10px] font-light bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    已綁定
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] font-light text-muted-foreground">
                                    未綁定
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={booking.status}
                                  onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                                  className={`text-xs font-light border rounded px-2 py-1 bg-transparent ${statusColors[booking.status]}`}
                                >
                                  {statusOptions.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(booking)}
                                    className="text-xs font-light"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    編輯
                                  </Button>
                                  {booking.status !== "cancelled" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                      className="text-xs font-light"
                                    >
                                      <Ban className="h-3.5 w-3.5 mr-1" />
                                      取消
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(booking)}
                                    className="text-xs font-light text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>

                      </Table>
                    </div>

                    {paginatedBookings.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground font-light">目前沒有符合條件的預約紀錄</p>
                      </div>
                    )}
                  </Card>

                  {/* 手機版清單 */}
                  <div className="md:hidden space-y-2">
                    {paginatedBookings.length === 0 && (
                      <Card className="border border-border shadow-soft p-8 text-center">
                        <p className="text-sm text-muted-foreground font-light">目前沒有符合條件的預約紀錄</p>
                      </Card>
                    )}
                    {paginatedBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => openDetail(booking)}
                        className="w-full text-left rounded-xl border border-border bg-card shadow-soft p-4 active:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              booking.status === "pending"
                                ? "bg-primary"
                                : booking.status === "confirmed"
                                ? "bg-secondary"
                                : booking.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-destructive"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-light truncate">{booking.name || "未留姓名"}</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-light shrink-0 ${statusColors[booking.status]}`}
                              >
                                {statusLabels[booking.status] || booking.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-light mt-0.5 truncate">
                              {inspectionLabels[booking.inspection_type] || booking.inspection_type} ·{" "}
                              {format(parseISO(booking.preferred_date), "yyyy/MM/dd")}
                            </p>
                            <p className="text-xs text-muted-foreground font-light mt-0.5 truncate">
                              {regionLabels[booking.region] || booking.region}
                              {booking.project_name ? ` · ${booking.project_name}` : ""}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-muted-foreground font-light">
                        第 {currentPage} / {totalPages} 頁
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <div className="md:hidden">
        <Footer />
      </div>
      </div>

      <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} onCreate={openCreate} />

      {isMobile && detailBooking && (
        <MobileBookingDetail
          booking={detailBooking}
          onBack={() => setDetailBooking(null)}
          onUpdateStatus={updateBookingStatus}
          onSaveNotes={updateBookingNotes}
          onEdit={openEdit}
          onDelete={(b) => setDeleteTarget(b)}
        />
      )}

      <Dialog open={!isMobile && !!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-light">預約詳情</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {detailBooking && format(parseISO(detailBooking.preferred_date), "yyyy年MM月dd日")}
            </DialogDescription>
          </DialogHeader>

          {detailBooking && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardList className="h-3 w-3" />
                    檢測類型
                  </div>
                  <p className="text-sm font-light text-foreground">
                    {inspectionLabels[detailBooking.inspection_type] || detailBooking.inspection_type}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Home className="h-3 w-3" />
                    房屋類型
                  </div>
                  <p className="text-sm font-light text-foreground">
                    {propertyLabels[detailBooking.property_type] || detailBooking.property_type}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    地區
                  </div>
                  <p className="text-sm font-light text-foreground">
                    {regionLabels[detailBooking.region] || detailBooking.region}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    建案名稱
                  </div>
                  <p className="text-sm font-light text-foreground">{detailBooking.project_name || "—"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  聯繫資訊
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-light text-foreground">
                  <p>{detailBooking.name || "—"}</p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {detailBooking.phone || "—"}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {detailBooking.email || "—"}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {detailBooking.address || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailStatus" className="text-xs text-muted-foreground">
                  預約狀態
                </Label>
                <Select
                  value={detailBooking.status}
                  onValueChange={(value) => updateBookingStatus(detailBooking.id, value)}
                >
                  <SelectTrigger id="detailStatus" className="text-sm font-light">
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
                <Label htmlFor="detailNotes" className="text-xs text-muted-foreground">
                  內部備註
                </Label>
                <Textarea
                  id="detailNotes"
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="記錄聯繫狀況或特殊需求..."
                  className="text-sm font-light min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => detailBooking && setDeleteTarget(detailBooking)}
              className="text-xs font-light text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              刪除訂單
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => detailBooking && openEdit(detailBooking)}
                className="text-xs font-light"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                編輯
              </Button>
              <Button
                size="sm"
                onClick={() => detailBooking && updateBookingNotes(detailBooking.id, detailNotes)}
                className="text-xs font-light"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                儲存備註
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookingEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        booking={editingBooking}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-light">確定要刪除這筆訂單？</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {deleteTarget && (
                <>
                  訂單 #{deleteTarget.id.slice(0, 8).toUpperCase()}（
                  {deleteTarget.name || "未留姓名"} ·{" "}
                  {format(parseISO(deleteTarget.preferred_date), "yyyy/MM/dd")}）將永久從資料庫移除，此操作無法復原。若只是客戶取消，建議改用「取消預約」。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-light">返回</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs font-light bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteBooking(deleteTarget)}
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
};

export default Admin;
