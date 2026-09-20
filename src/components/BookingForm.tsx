import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import {
  CalendarDays,
  Home,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Loader2,
  Clock,
  Gift,
  Building2,
} from "lucide-react";
import { LIFF_ID, LINE_OA_URL } from "@/config/line";
import { supabase } from "@/integrations/supabase/client";
import type { TimeSlot, GroupProject } from "@/components/admin/types";
import { formatDiscount } from "@/lib/group";


const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const BASE_PRICE: Record<string, number> = { newbuild: 7777, resale: 10000 };
const REINSPECTION_PRICE = 3000;
// 團報（僅限新成屋）：基本費 $8,000、複驗加購固定 $2,500（不打成團折扣）
// !! 資料庫的計價（migration 20260920170000_group_pricing_v2.sql）有一份相同的數字，調整時兩邊都要改
const GROUP_BASE_PRICE = 8000;
const GROUP_REINSPECTION_PRICE = 2500;
// 複驗方案的官網原價，只用於畫面上的劃線價顯示
const REINSPECTION_LIST_PRICE = 5000;

const propertyLabels: Record<string, string> = { newbuild: "新成屋", resale: "中古屋" };
const houseTypeLabels: Record<string, string> = {
  elevator: "電梯大樓",
  mansion: "華廈",
  townhouse: "透天",
  other: "其他",
};
const formatNT = (n: number) => `$NT ${n.toLocaleString("en-US")}`;

interface BookingFormProps {
  className?: string;
  autoFocus?: boolean;
}

const BookingForm = ({ className = "", autoFocus = false }: BookingFormProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // 團報：從官網「建案團報」區塊帶 ?group=<id> 進來，建案資料鎖定，價格改用團報規則
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group");
  const [groupProject, setGroupProject] = useState<GroupProject | null>(null);
  const [groupCount, setGroupCount] = useState(0);

  // Step 1
  const [propertyType, setPropertyType] = useState("");
  const [reinspection, setReinspection] = useState<"none" | "add">("none");
  // 團報只做新成屋：載入建案後直接選好，不提供中古屋
  useEffect(() => {
    if (groupProject) setPropertyType("newbuild");
  }, [groupProject]);
  const [ping, setPing] = useState<string>("");

  // Step 2
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectRegion, setProjectRegion] = useState("");
  const [projectName, setProjectName] = useState("");
  const [houseType, setHouseType] = useState("");
  const [floorUnit, setFloorUnit] = useState("");

  // Step 3
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { is_blocked: boolean }>>({});
  const [slotMaxMap, setSlotMaxMap] = useState<Record<string, Record<string, number>>>({});
  const [slotCountMap, setSlotCountMap] = useState<Record<string, Record<string, number>>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  const [bookingId, setBookingId] = useState<string | null>(null);

  // 防灌水：隱藏欄位（機器人常會自動填入），以及表單掛載到送出的最短時間
  const [website, setWebsite] = useState("");
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      const today = format(startOfDay(new Date()), "yyyy-MM-dd");

      const [{ data: availability }, { data: bookings }, { data: slots }, { data: slotAvail }] = await Promise.all([
        supabase.from("booking_availability").select("date, is_blocked").gte("date", today),
        supabase
          .from("booking_requests")
          .select("preferred_date, time_slot")
          .gte("preferred_date", today)
          .in("status", ["pending", "confirmed"]),
        supabase.from("time_slots").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("time_slot_availability").select("*").gte("date", today),
      ]);

      const map: Record<string, { is_blocked: boolean }> = {};
      availability?.forEach((row) => {
        map[row.date] = { is_blocked: row.is_blocked };
      });

      const slotCounts: Record<string, Record<string, number>> = {};
      bookings?.forEach((row) => {
        const slotKey = row.time_slot || "";
        slotCounts[row.preferred_date] ??= {};
        slotCounts[row.preferred_date][slotKey] = (slotCounts[row.preferred_date][slotKey] || 0) + 1;
      });

      const slotMax: Record<string, Record<string, number>> = {};
      slotAvail?.forEach((row) => {
        slotMax[row.date] ??= {};
        slotMax[row.date][row.time_slot_id] = row.max_slots;
      });

      setAvailabilityMap(map);
      setSlotCountMap(slotCounts);
      setSlotMaxMap(slotMax);
      setTimeSlots(slots || []);
      setLoadingAvailability(false);
    };

    fetchAvailability();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    const loadGroup = async () => {
      const [{ data }, { data: countRows }] = await Promise.all([
        supabase.from("group_projects").select("*").eq("id", groupId).eq("status", "active").maybeSingle(),
        supabase.rpc("get_group_project_counts"),
      ]);
      if (!data) {
        toast.error("找不到這個團報建案，或已停止加入，已改為一般預約");
        return;
      }
      setGroupProject(data as GroupProject);
      setGroupCount(countRows?.find((r) => r.group_project_id === groupId)?.unit_count ?? 0);
      setProjectRegion(data.region);
      setProjectName(data.name);
    };
    loadGroup();
  }, [groupId]);

  const getSlotMaxForDate = (dateStr: string, slot: TimeSlot) => slotMaxMap[dateStr]?.[slot.id] ?? slot.default_max_slots;
  const getSlotCountForDate = (dateStr: string, slot: TimeSlot) => slotCountMap[dateStr]?.[slot.value] || 0;
  const isSlotFull = (dateStr: string, slot: TimeSlot) => getSlotCountForDate(dateStr, slot) >= getSlotMaxForDate(dateStr, slot);
  const isDayFull = (dateStr: string) => timeSlots.length > 0 && timeSlots.every((slot) => isSlotFull(dateStr, slot));

  useEffect(() => {
    if (!preferredDate || !timeSlot) return;
    const dateStr = format(preferredDate, "yyyy-MM-dd");
    const selectedSlot = timeSlots.find((s) => s.value === timeSlot);
    if (selectedSlot && isSlotFull(dateStr, selectedSlot)) {
      setTimeSlot("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredDate]);

  const pingNum = Math.max(0, parseInt(ping, 10) || 20);
  const reinspectionPrice = groupProject ? GROUP_REINSPECTION_PRICE : REINSPECTION_PRICE;
  const basePrice = groupProject ? GROUP_BASE_PRICE : propertyType ? BASE_PRICE[propertyType] : 0;
  const reinspectionAmount = reinspection === "add" ? reinspectionPrice : 0;
  const pingSurcharge = Math.max(0, pingNum - 20) * 400;
  const originalPrice = basePrice + reinspectionAmount + pingSurcharge;
  // 團報：加入後戶數達門檻 → 全團原價 × 折扣；未達門檻先以原價計，達標後由資料庫自動回頭調整
  const groupReached = !!groupProject && groupCount + 1 >= groupProject.min_units;
  const discountedPrice = groupProject
    ? groupReached
      ? Math.round((basePrice + pingSurcharge) * groupProject.discount_rate) + reinspectionAmount // 複驗固定，不打折
      : originalPrice
    : originalPrice - 500;
  const estimatedPrice = discountedPrice;
  const inspectionTypeValue =
    propertyType === "resale" ? "resale" : reinspection === "add" ? "newfirst_recheck" : "newfirst";
  const inspectionTypeLabel =
    propertyType === "resale"
      ? reinspection === "add"
        ? "中古屋驗屋 + 複驗方案"
        : "中古屋驗屋"
      : reinspection === "add"
        ? "新成屋初驗 + 複驗方案"
        : "新成屋初驗";

  const liffBindUrl = bookingId
    ? `https://liff.line.me/${LIFF_ID}?booking_id=${bookingId}`
    : LINE_OA_URL;


  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleStep1Continue = () => {
    if (!ping || parseInt(ping, 10) <= 0) {
      toast.error("請輸入有效的房屋坪數");
      return;
    }
    if (!propertyType) {
      toast.error("請選擇房屋類型");
      return;
    }
    goTo(2);
  };

  const handleStep2Continue = () => {
    if (!name || !phone || !email || !projectRegion || !projectName || !houseType || !floorUnit) {
      toast.error("請完整填寫聯絡與建案資料");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("請輸入有效的 Email");
      return;
    }
    goTo(3);
  };

  const handleSubmit = async () => {
    if (!preferredDate || !timeSlot) {
      toast.error("請選擇預約日期與時段");
      return;
    }

    if (website.trim() !== "" || Date.now() - mountedAtRef.current < 4000) {
      toast.error("系統偵測到異常提交，請稍後再試一次");
      return;
    }

    const dateStr = format(preferredDate, "yyyy-MM-dd");
    const avail = availabilityMap[dateStr];
    if (avail?.is_blocked) {
      toast.error("所選日期目前不開放預約，請選擇其他日期");
      return;
    }
    const selectedSlot = timeSlots.find((s) => s.value === timeSlot);
    if (selectedSlot && isSlotFull(dateStr, selectedSlot)) {
      toast.error("所選時段已額滿，請選擇其他時段");
      return;
    }

    setSubmitting(true);
    const address = `${projectRegion} ${projectName} ${floorUnit}`.trim();

    // 匿名訪客沒有 SELECT 權限，無法使用 returning=representation，
    // 因此在前端先產生 UUID，作為 LINE 綁定連結的 booking_id。
    const newId = crypto.randomUUID();

    const { error } = await supabase.from("booking_requests").insert({
      id: newId,
      preferred_date: dateStr,
      time_slot: timeSlot,
      inspection_type: inspectionTypeValue,
      property_type: propertyType,
      region: projectRegion,
      project_region: projectRegion,
      project_name: projectName,
      house_type: houseType,
      floor_unit: floorUnit,
      ping: pingNum,
      original_price: originalPrice,
      discounted_price: discountedPrice,
      price: estimatedPrice,
      group_project_id: groupProject?.id ?? null,
      needs_reinspection: reinspection === "add",
      name,
      phone,
      email,
      address,
      status: "pending",
      source: "web",
    });

    setSubmitting(false);

    if (error) {
      console.error("[booking insert] message:", error.message);
      console.error("[booking insert] details:", error.details);
      console.error("[booking insert] hint:", error.hint, "code:", error.code);
      toast.error(`預約記錄儲存失敗：${error.message}`);
      return;
    }


    setBookingId(newId);

    if (selectedSlot) {
      setSlotCountMap((prev) => {
        const day = { ...(prev[dateStr] || {}) };
        day[selectedSlot.value] = (day[selectedSlot.value] || 0) + 1;
        return { ...prev, [dateStr]: day };
      });
    }

    try {
      // 後端只收訂單編號，通知內容由資料庫的訂單資料組成
      const { error: notifyError } = await supabase.functions.invoke("send-line-notification", {
        body: { booking_id: newId },
      });
      if (notifyError) throw notifyError;
      toast.success("預約已送出，我們會盡快與您聯繫");

    } catch (e) {
      console.error("LINE 通知發送失敗", e);
      toast.warning("預約已成功送出，但 LINE 通知發送失敗，我們仍會與您聯繫");
    }

    goTo(4);
  };

  const stepLabels = ["選擇方案", "填寫資料", "選擇時段"];
  const inputClass = "rounded-md text-sm font-light";
  const selectClass = "rounded-md text-sm font-light";
  const labelClass =
    "flex items-center gap-1.5 mb-2.5 text-card-foreground text-[11px] uppercase tracking-wider font-normal";

  const OptionButton = ({
    active,
    onClick,
    title,
    desc,
    disabled,
  }: {
    active: boolean;
    onClick: () => void;
    title: string;
    desc: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "text-left rounded-xl border px-5 py-4 transition-all duration-300 w-full",
        disabled
          ? "border-border/50 opacity-50 cursor-not-allowed"
          : active
            ? "border-primary bg-primary/5 shadow-soft"
            : "border-border hover:border-primary/50",
      )}
    >
      <span className="flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">{title}</span>
        {active && !disabled && <CheckCircle className="h-4 w-4 text-primary" />}
      </span>
      <span className="mt-1 block text-xs font-light text-muted-foreground">{desc}</span>
    </button>
  );

  return (
    <div className={cn("booking-form", className)} ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView || autoFocus ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-3xl mx-auto"
      >
        <Card
          className="group p-8 lg:p-10 shadow-soft border border-border bg-card overflow-hidden"
          onMouseEnter={() => window.dispatchEvent(new CustomEvent("booking-hover", { detail: true }))}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent("booking-hover", { detail: false }))}
        >
          {/* 防灌水蜜罐欄位：一般使用者看不到也不會填，機器人常會自動填入 */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, overflow: "hidden" }}
          >
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* Step Indicator */}
          {step <= 3 && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-colors",
                        s === step
                          ? "bg-primary text-primary-foreground"
                          : s < step
                            ? "bg-primary/40 text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] uppercase tracking-wider",
                        s === step ? "text-card-foreground" : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {s < 3 && <span className="hidden sm:block h-px w-6 bg-border" />}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
              >
                {groupProject && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-1">建案團報</p>
                    <p className="text-base font-semibold text-card-foreground">
                      {groupProject.region} {groupProject.name}
                    </p>
                    <p className="mt-1 text-xs font-light text-muted-foreground">
                      同建案滿 {groupProject.min_units} 戶全團享 {formatDiscount(groupProject.discount_rate)}；團報不與 LINE 好友優惠並用。
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="ping" className={labelClass}>
                    <Home className="h-3 w-3" />
                    房屋坪數（主建物 + 附屬建物）
                  </Label>
                  <Input
                    id="ping"
                    type="number"
                    min={1}
                    value={ping}
                    onChange={(e) => setPing(e.target.value)}
                    placeholder="例如：25"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs font-light text-muted-foreground">
                    坪數以合約「主建物 + 附屬建物」總和計算
                  </p>
                </div>

                <div>
                  <Label className={labelClass}>
                    <Home className="h-3 w-3" />
                    房屋類型
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <OptionButton
                      active={propertyType === "newbuild"}
                      onClick={() => setPropertyType("newbuild")}
                      title="新成屋"
                      desc={
                        groupProject
                          ? `團報初驗方案 ${formatNT(GROUP_BASE_PRICE)} 起／20 坪以內`
                          : `初驗方案 ${formatNT(BASE_PRICE.newbuild)} 起／20 坪以內`
                      }
                    />
                    {!groupProject && (
                      <OptionButton
                        active={propertyType === "resale"}
                        onClick={() => setPropertyType("resale")}
                        title="中古屋"
                        desc={`驗屋方案 ${formatNT(BASE_PRICE.resale)} 起／20 坪以內`}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label className={labelClass}>
                    <CheckCircle className="h-3 w-3" />
                    複驗方案加購
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <OptionButton
                      active={reinspection === "none"}
                      onClick={() => setReinspection("none")}
                      title="不需要複驗"
                      desc="僅進行單次完整檢測"
                    />
                    <OptionButton
                      active={reinspection === "add"}
                      onClick={() => setReinspection("add")}
                      title="加購複驗方案"
                      desc={
                        <>
                          + {formatNT(reinspectionPrice)}
                          <span className="ml-1.5 text-muted-foreground line-through decoration-muted-foreground/60">
                            原價 {formatNT(REINSPECTION_LIST_PRICE)}
                          </span>
                          ．確認建商修繕是否完成
                        </>
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">預估費用</p>
                  {propertyType ? (
                    groupProject ? (
                      <div className="space-y-2">
                        {groupReached ? (
                          <div>
                            <p className="text-lg text-muted-foreground line-through decoration-muted-foreground/60">
                              {formatNT(originalPrice)}
                            </p>
                            <p className="text-3xl font-bold text-primary tracking-tight">
                              團報價 {formatNT(discountedPrice)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-3xl font-bold text-card-foreground tracking-tight">
                            原價 {formatNT(originalPrice)}
                          </p>
                        )}
                        <p className="text-xs font-medium text-primary">
                          {groupReached
                            ? `您加入後即成團，全團享 ${formatDiscount(groupProject.discount_rate)}`
                            : `滿 ${groupProject.min_units} 戶全團享 ${formatDiscount(groupProject.discount_rate)}（目前已 ${groupCount} 戶，您加入後 ${groupCount + 1} 戶），成團後價格會自動調整`}
                        </p>
                      </div>
                    ) : (
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <p className="text-lg text-muted-foreground line-through decoration-muted-foreground/60">
                          {formatNT(originalPrice)}
                        </p>
                        <p className="text-3xl font-bold text-[#06C755] tracking-tight">
                          優惠價 {formatNT(discountedPrice)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft animate-pulse mb-1">
                        <Gift className="h-3.5 w-3.5" />
                        🎉 預約完成加入官方 LINE 即享此優惠價！
                      </span>
                    </div>
                    )
                  ) : (
                    <p className="text-3xl font-bold text-card-foreground tracking-tight">請先選擇房屋類型</p>
                  )}
                  <p className="mt-2 text-xs font-light text-muted-foreground">
                    基本坪數 20 坪，超出部分每坪 $400 加價計算；實際費用以現場評估後之報價為準。
                    {groupProject && reinspection === "add" && `團報成團折扣不含複驗方案（複驗固定 ${formatNT(GROUP_REINSPECTION_PRICE)}）。`}
                  </p>
                </div>


                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[11px] uppercase tracking-wider font-normal"
                  onClick={handleStep1Continue}
                >
                  下一步：填寫資料
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >



                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="name" className={labelClass}>姓名</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="王小明" className={inputClass} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className={labelClass}>電話</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912-345-678" className={inputClass} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className={labelClass}>Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="projectRegion" className={labelClass}>
                      <MapPin className="h-3 w-3" />
                      建案區域
                    </Label>
                    <Input id="projectRegion" value={projectRegion} onChange={(e) => setProjectRegion(e.target.value)} placeholder="新北市泰山區" className={inputClass} readOnly={!!groupProject} />
                  </div>
                  <div>
                    <Label htmlFor="projectName" className={labelClass}>
                      <Building2 className="h-3 w-3" />
                      建案名稱
                    </Label>
                    <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="晴空樹" className={inputClass} readOnly={!!groupProject} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="houseType" className={labelClass}>建案種類</Label>
                    <Select value={houseType} onValueChange={setHouseType}>
                      <SelectTrigger id="houseType" className={selectClass}>
                        <SelectValue placeholder="選擇建案種類" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elevator">電梯大樓</SelectItem>
                        <SelectItem value="mansion">華廈</SelectItem>
                        <SelectItem value="townhouse">透天</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="floorUnit" className={labelClass}>樓層戶號</Label>
                    <Input id="floorUnit" value={floorUnit} onChange={(e) => setFloorUnit(e.target.value)} placeholder="12樓 B2戶" className={inputClass} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-md text-[11px] uppercase tracking-wider font-normal" onClick={() => goTo(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[11px] uppercase tracking-wider font-normal" onClick={handleStep2Continue}>
                    下一步：選擇時段
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className={labelClass}>
                      <CalendarDays className="h-3 w-3" />
                      預約日期
                    </Label>
                    {loadingAvailability ? (
                      <div className="rounded-md border border-border shadow-soft h-[300px] flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Calendar
                        mode="single"
                        selected={preferredDate}
                        onSelect={setPreferredDate}
                        numberOfMonths={1}
                        className="rounded-md border border-border shadow-soft text-sm pointer-events-auto"
                        disabled={(date) => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          if (date < startOfDay(new Date())) return true;
                          const avail = availabilityMap[dateStr];
                          if (avail?.is_blocked) return true;
                          return isDayFull(dateStr);
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label className={labelClass}>
                        <Clock className="h-3 w-3" />
                        預約時段
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((slot) => {
                          const dateStr = preferredDate ? format(preferredDate, "yyyy-MM-dd") : "";
                          const full = dateStr ? isSlotFull(dateStr, slot) : false;
                          return (
                            <OptionButton
                              key={slot.value}
                              active={timeSlot === slot.value}
                              onClick={() => setTimeSlot(slot.value)}
                              title={slot.value}
                              desc={full ? "已額滿" : slot.label.replace(`${slot.value} `, "")}
                              disabled={full}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">預約摘要</p>
                      {[
                        ["檢測方案", inspectionTypeLabel],
                        ["房屋類型", propertyLabels[propertyType] || "-"],
                        ["房屋坪數", `${pingNum} 坪`],
                        ["建案資訊", `${projectRegion} ${projectName}`],
                        ["建案種類", houseTypeLabels[houseType] || "-"],
                        ["樓層戶號", floorUnit || "-"],
                        ["預約時間", preferredDate ? `${format(preferredDate, "yyyy/MM/dd")} ${timeSlot || "尚未選擇"}` : "尚未選擇"],
                        ["聯絡人", `${name}／${phone}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4 text-sm">
                          <span className="text-muted-foreground font-light">{label}</span>
                          <span className="text-card-foreground text-right font-light">{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-t border-border pt-2 mt-2">
                        <span className="text-sm text-muted-foreground font-light">預估費用</span>
                        <div className="text-right">
                          {discountedPrice < originalPrice && (
                            <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/60 mr-2">{formatNT(originalPrice)}</span>
                          )}
                          <span className={cn("text-xl font-bold", groupProject ? "text-primary" : "text-[#06C755]")}>{formatNT(discountedPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs font-light text-muted-foreground">
                  送出預約即表示您同意我們依
                  <Link to="/privacy" target="_blank" className="mx-0.5 text-primary underline-offset-4 hover:underline">
                    隱私權政策
                  </Link>
                  蒐集與使用您填寫的資料，作為聯繫與安排驗屋之用。
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-md text-[11px] uppercase tracking-wider font-normal" onClick={() => goTo(2)} disabled={submitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[11px] uppercase tracking-wider font-normal" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    確認送出預約
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-center py-6"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-primary mb-5" />
                <h3 className="text-xl font-bold text-card-foreground mb-2">
                  {groupProject ? "🎉 預約成功！最後一步：加入官方 LINE 領取預約憑證" : "🎉 預約成功！最後一步：領取 $500 折抵與預約憑證"}
                </h3>
                <p className="text-sm font-light text-muted-foreground mb-6">
                  {groupProject
                    ? "加入官方 LINE 即可自動綁定本筆預約並取得電子預約憑證。團報價格以成團後為準，不與 LINE 好友優惠並用。"
                    : "加入官方 LINE 即可自動綁定本筆預約，立即現折 $500 並取得電子預約憑證。"}
                </p>

                <a
                  href={liffBindUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    // 強制同分頁導向 LIFF，確保 Safari / Chrome / LINE 內建瀏覽器都能觸發
                    e.preventDefault();
                    if (!bookingId) {
                      console.warn("[booking success] bookingId 尚未產生，導向官方 LINE");
                    }
                    window.location.assign(liffBindUrl);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] px-5 py-4 text-white text-sm font-semibold transition-colors shadow-soft cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  {groupProject ? "點我加入官方 LINE 並領取預約憑證" : "點我加入官方 LINE 現折 $500 並領取預約憑證"}
                </a>

                {bookingId && (
                  <p className="mt-3 text-xs font-light text-muted-foreground">
                    預約編號 #{bookingId.slice(0, 8).toUpperCase()}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="mt-6 rounded-md text-[11px] uppercase tracking-wider font-normal"
                  asChild
                >
                  <Link to="/">返回首頁</Link>
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default BookingForm;
