import { useMemo } from "react";

/**
 * 團報建案的預設封面圖（純 HTML／SVG 產生，無版權問題，新增建案自動有圖）。
 * 三種風格：poster＝文字海報、skyline＝大樓輪廓、region＝依縣市配色。
 * 同一個建案（seed）每次產生的樣子固定。
 */

export type CoverVariant = "poster" | "skyline" | "region";

type Props = {
  name: string;
  region: string;
  seed: string;
  variant?: CoverVariant;
  /** 長寬比的 Tailwind class，預設 aspect-[16/10] */
  aspect?: string;
  className?: string;
};

// 品牌藍灰為基調的一組低飽和深色（白字都清楚）
const PALETTE = ["#3f5a78", "#3e6b6b", "#4d5687", "#5b6b7c", "#4a6a56", "#6b5b7b", "#7a6a55", "#3a4a63"];

// 依縣市固定配色（region 風格用）
const CITY_COLOR: [RegExp, string][] = [
  [/台北|臺北/, "#3d5a80"],
  [/新北/, "#3e6d6b"],
  [/基隆/, "#4a6478"],
  [/桃園/, "#52588a"],
  [/新竹/, "#6b5d7a"],
  [/苗栗/, "#7a6a4f"],
  [/台中|臺中/, "#4f7a5f"],
  [/宜蘭/, "#5a6f7a"],
  [/花蓮|台東|臺東/, "#557a78"],
];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// 可重現的亂數（同一個 seed 每次一樣）
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const splitRegion = (region: string) => {
  const m = /^(.*?[市縣])(.*)$/.exec(region.trim());
  return m ? { city: m[1], district: m[2] } : { city: region, district: "" };
};

const nameSize = (name: string) => {
  const len = Array.from(name).length;
  if (len <= 4) return "text-4xl";
  if (len <= 6) return "text-3xl";
  if (len <= 9) return "text-2xl";
  return "text-xl";
};

/** 風格 A：文字海報 */
const Poster = ({ name, region, color }: { name: string; region: string; color: string }) => (
  <div className="relative h-full w-full overflow-hidden text-white" style={{ background: color }}>
    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
    <div className="absolute -right-2 top-16 h-20 w-20 rounded-full bg-white/[0.07]" />
    <p className="absolute left-5 top-5 text-[10px] tracking-[0.25em] text-white/70">GROUP INSPECTION</p>
    <div className="absolute inset-x-5 bottom-5">
      <p className={`font-bold leading-tight tracking-wide ${nameSize(name)}`}>{name}</p>
      <div className="mt-3 h-px w-10 bg-white/60" />
      <p className="mt-2 text-xs font-light tracking-wider text-white/80">{region}</p>
    </div>
  </div>
);

/** 風格 B：大樓輪廓 */
const Skyline = ({ name, region, seed, color }: { name: string; region: string; seed: string; color: string }) => {
  const buildings = useMemo(() => {
    const rand = rng(hash(seed));
    const count = 5 + Math.floor(rand() * 2);
    const totalW = 100;
    const w = totalW / count;
    return Array.from({ length: count }).map((_, i) => {
      const h = 28 + rand() * 46; // 建築高度（佔畫面高度的百分比）
      const cols = 2 + Math.floor(rand() * 2);
      const rows = Math.max(3, Math.floor(h / 9));
      const lit = Array.from({ length: cols * rows }).map(() => rand() > 0.68);
      return { x: i * w, w: w - 1.2, h, cols, rows, lit };
    });
  }, [seed]);

  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: `linear-gradient(180deg, ${color}cc 0%, ${color} 100%)` }}>
      <div className="absolute right-6 top-5 h-8 w-8 rounded-full bg-white/25" />
      <div className="absolute left-5 top-5">
        <p className={`font-bold leading-tight tracking-wide drop-shadow-sm ${nameSize(name)}`}>{name}</p>
        <p className="mt-1.5 text-xs font-light tracking-wider text-white/85">{region}</p>
      </div>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[62%] w-full" aria-hidden>
        {buildings.map((b, i) => {
          const y = 60 - (b.h / 100) * 60;
          const bh = (b.h / 100) * 60;
          const cw = b.w / (b.cols * 2 + 1);
          const rh = bh / (b.rows * 2 + 1);
          return (
            <g key={i}>
              <rect x={b.x} y={y} width={b.w} height={bh} fill="#0f172a" fillOpacity={0.38 + (i % 3) * 0.08} />
              {b.lit.map((on, k) => {
                const cx = k % b.cols;
                const cy = Math.floor(k / b.cols);
                return (
                  <rect
                    key={k}
                    x={b.x + cw * (1 + cx * 2)}
                    y={y + rh * (1 + cy * 2)}
                    width={cw}
                    height={rh}
                    fill={on ? "#fde68a" : "#ffffff"}
                    fillOpacity={on ? 0.9 : 0.12}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/** 風格 C：依縣市配色，背景是超大的行政區文字 */
const RegionCover = ({ name, region }: { name: string; region: string }) => {
  const { city, district } = splitRegion(region);
  const color = CITY_COLOR.find(([re]) => re.test(city))?.[1] ?? "#4a5f78";
  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: color }}>
      <p className="pointer-events-none absolute -bottom-6 -right-2 select-none whitespace-nowrap text-[112px] font-black leading-none text-white/[0.09]">
        {district || city}
      </p>
      <span className="absolute left-5 top-5 rounded-full border border-white/40 px-3 py-1 text-[11px] tracking-wider text-white/90">
        {city}
        {district ? `．${district}` : ""}
      </span>
      <p className={`absolute inset-x-5 bottom-6 font-bold leading-tight tracking-wide ${nameSize(name)}`}>{name}</p>
    </div>
  );
};

const GroupCover = ({ name, region, seed, variant = "poster", aspect = "aspect-[16/10]", className = "" }: Props) => {
  const color = PALETTE[hash(seed) % PALETTE.length];
  return (
    <div className={`${aspect} w-full ${className}`} role="img" aria-label={`${name}（${region}）`}>
      {variant === "poster" && <Poster name={name} region={region} color={color} />}
      {variant === "skyline" && <Skyline name={name} region={region} seed={seed} color={color} />}
      {variant === "region" && <RegionCover name={name} region={region} />}
    </div>
  );
};

export default GroupCover;
