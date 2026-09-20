/** 服務地區頁（/area/<slug>）。cities 是 group_projects.region 判斷出的縣市名稱（見 lib/group.ts 的 cityOf）。 */
export const AREAS = [
  { slug: "taipei", name: "台北", cities: ["台北市"] },
  { slug: "new-taipei", name: "新北", cities: ["新北市"] },
  { slug: "keelung", name: "基隆", cities: ["基隆市"] },
  { slug: "taoyuan", name: "桃園", cities: ["桃園市"] },
  { slug: "hsinchu", name: "新竹", cities: ["新竹縣", "新竹市"] },
  { slug: "miaoli", name: "苗栗", cities: ["苗栗縣"] },
  { slug: "taichung", name: "台中", cities: ["台中市"] },
  { slug: "yilan", name: "宜蘭", cities: ["宜蘭縣"] },
  { slug: "hualien", name: "花蓮", cities: ["花蓮縣"] },
  { slug: "taitung", name: "台東", cities: ["台東縣"] },
] as const;

export type Area = (typeof AREAS)[number];

/** 地區頁的標題與說明；terms 例如「滿 3 戶享 9 折」（建置時的靜態標籤與前端頁面共用） */
export const areaSeo = (name: string, terms: string) => ({
  title: `${name}驗屋｜新成屋・中古屋驗屋與建案團報｜診斷室驗屋`,
  description: `診斷室驗屋提供${name}地區新成屋交屋驗收與中古屋買前檢測，涵蓋電氣、給排水、防水、土建、設備與環境六大系統；同建案多戶可團報（${terms}）。`,
});

export const areaPath = (slug: string) => `/area/${slug}`;
export const findArea = (slug?: string) => AREAS.find((a) => a.slug === slug);
