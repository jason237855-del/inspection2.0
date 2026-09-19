// 內部群組「新預約」通知的訊息組裝。純函式、無 Deno 相依，方便在本機直接測試。
// 內容一律來自資料庫的訂單資料，不採用客戶端傳來的任何欄位。

export type NotificationBooking = {
  name: string | null;
  phone: string | null;
  email: string | null;
  project_name: string | null;
  project_region: string | null;
  region: string;
  address: string | null;
  preferred_date: string; // YYYY-MM-DD
  time_slot: string | null;
  inspection_type: string;
  property_type: string;
  house_type: string | null;
  ping: number | null;
  price: number | null;
  original_price: number | null;
};

const propertyLabels: Record<string, string> = { newbuild: "新成屋", resale: "中古屋" };
const houseTypeLabels: Record<string, string> = {
  elevator: "電梯大樓",
  mansion: "華廈",
  townhouse: "透天",
  other: "其他",
};
const inspectionLabels: Record<string, string> = {
  newfirst: "新成屋初驗",
  newfirst_recheck: "新成屋初驗 + 複驗方案",
  resale: "中古屋驗屋",
};

const fmtNT = (n: number) => `$NT ${n.toLocaleString("en-US")}`;

const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? `${m[1]}年${m[2]}月${m[3]}日` : d;
};

export function buildAdminMessage(b: NotificationBooking, groupName: string | null, adminUrl: string) {
  const inspection = `${inspectionLabels[b.inspection_type] || b.inspection_type}${b.ping ? `（${b.ping} 坪）` : ""}`;
  const property = `${propertyLabels[b.property_type] || b.property_type}${
    b.house_type ? `／${houseTypeLabels[b.house_type] || b.house_type}` : ""
  }`;

  const rows: [string, string][] = [
    ["預約姓名", b.name || "未提供"],
    ["聯絡電話", b.phone || "未提供"],
    ["電子信箱", b.email || "未提供"],
    ["建案名稱", b.project_name || "未提供"],
    ...(groupName ? ([["團報建案", groupName]] as [string, string][]) : []),
    ["預約日期", fmtDate(b.preferred_date)],
    ["預約時段", b.time_slot || "待確認"],
    ["檢測類型", inspection],
    ["房屋類型", property],
    ["房屋地區", b.project_region || b.region || "未提供"],
    ["檢測地址", b.address || "未提供"],
    ...(b.price != null ? ([["預估費用", fmtNT(b.price)]] as [string, string][]) : []),
  ];

  return {
    type: "flex",
    altText: "🔔 收到新的驗屋預約！",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "🔔 收到新的驗屋預約！", weight: "bold", size: "lg", wrap: true },
          { type: "separator", margin: "md" },
          ...rows.map(([label, value]) => ({
            type: "box",
            layout: "baseline",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "text", text: label, size: "sm", color: "#888888", flex: 2 },
              { type: "text", text: String(value), size: "sm", wrap: true, flex: 5 },
            ],
          })),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0F172A",
            action: { type: "uri", label: "開啟後台預約詳情", uri: adminUrl },
          },
        ],
      },
    },
  };
}
