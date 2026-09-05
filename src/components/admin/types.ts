export type BookingRequest = {
  id: string;
  preferred_date: string;
  time_slot?: string | null;
  inspection_type: string;
  property_type: string;
  region: string;
  project_name: string | null;
  project_region?: string | null;
  house_type?: string | null;
  floor_unit?: string | null;
  ping?: number | null;
  original_price?: number | null;
  discounted_price?: number | null;
  price?: number | null;
  needs_reinspection?: boolean;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  source: string;
  created_at: string;
  line_user_id?: string | null;
  line_display_name?: string | null;
};

export type Availability = {
  date: string;
  max_slots: number;
  is_blocked: boolean;
  reason: string | null;
};

export const statusLabels: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
};

export const statusColors: Record<string, string> = {
  pending: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-secondary/10 text-secondary border-secondary/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export const statusOptions = [
  { value: "pending", label: "待確認" },
  { value: "confirmed", label: "已確認" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

export const inspectionLabels: Record<string, string> = {
  newfirst: "新成屋初驗",
  newrecheck: "新成屋複驗",
  resale: "中古屋驗屋",
};

export const inspectionOptions = [
  { value: "newfirst", label: "新成屋初驗" },
  { value: "newrecheck", label: "新成屋複驗" },
  { value: "resale", label: "中古屋驗屋" },
];

export const propertyLabels: Record<string, string> = {
  townhouse: "透天",
  apartment: "華夏",
};

export const propertyOptions = [
  { value: "townhouse", label: "透天" },
  { value: "apartment", label: "華夏" },
];

export const regionLabels: Record<string, string> = {
  taipei: "台北",
  newtaipei: "新北",
  taoyuan: "桃園",
  hsinchu: "新竹",
  keelung: "基隆",
  yilan: "宜蘭",
};

export const regionOptions = [
  { value: "taipei", label: "台北" },
  { value: "newtaipei", label: "新北" },
  { value: "taoyuan", label: "桃園" },
  { value: "hsinchu", label: "新竹" },
  { value: "keelung", label: "基隆" },
  { value: "yilan", label: "宜蘭" },
];

export const timeSlotOptions = [
  { value: "morning", label: "上午 09:00–12:00" },
  { value: "afternoon", label: "下午 13:00–17:00" },
  { value: "evening", label: "傍晚 17:00–19:00" },
];

export const timeSlotLabels: Record<string, string> = {
  morning: "上午 09:00–12:00",
  afternoon: "下午 13:00–17:00",
  evening: "傍晚 17:00–19:00",
};
