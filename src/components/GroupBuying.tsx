import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import type { GroupProject } from "@/components/admin/types";

export const formatDiscount = (rate: number) => `${Number((rate * 10).toFixed(1))} 折`;

const GroupBuying = () => {
  const reduced = usePrefersReducedMotion();
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [proposeOpen, setProposeOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [region, setRegion] = useState("");
  const [proposerName, setProposerName] = useState("");
  const [proposerPhone, setProposerPhone] = useState("");
  const [website, setWebsite] = useState(""); // 防灌水：機器人常會自動填入的隱藏欄位
  const [submitting, setSubmitting] = useState(false);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    const load = async () => {
      const [{ data, error }, { data: countRows }] = await Promise.all([
        supabase
          .from("group_projects")
          .select("*")
          .eq("status", "active")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.rpc("get_group_project_counts"),
      ]);
      if (error) {
        console.error("[group_projects load]", error.message);
        setLoadFailed(true);
      } else {
        setProjects((data || []) as GroupProject[]);
        const map: Record<string, number> = {};
        countRows?.forEach((r) => {
          map[r.group_project_id] = r.unit_count;
        });
        setCounts(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePropose = async () => {
    if (!projectName.trim() || !region.trim() || !proposerName.trim() || !proposerPhone.trim()) {
      toast.error("請完整填寫建案與聯絡資料");
      return;
    }
    if (website.trim() !== "" || Date.now() - mountedAtRef.current < 4000) {
      toast.error("系統偵測到異常提交，請稍後再試一次");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("group_projects").insert({
      name: projectName.trim(),
      region: region.trim(),
      proposer_name: proposerName.trim(),
      proposer_phone: proposerPhone.trim(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      console.error("[group_projects propose]", error.message);
      toast.error(`送出失敗：${error.message}`);
      return;
    }
    toast.success("已收到您的建案，審核上架後我們會與您聯繫");
    setProposeOpen(false);
    setProjectName("");
    setRegion("");
    setProposerName("");
    setProposerPhone("");
  };

  // 資料表尚未建立或讀取失敗時，不顯示整個區塊，避免首頁出現壞掉的內容
  if (loadFailed) return null;

  return (
    <section id="group-buying" className="py-24 lg:py-32 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.2 : 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-4 block font-medium">
            Group Inspection
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-foreground tracking-tight">建案團報</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            同建案 3 戶以上一起報名，全團享 9 折優惠。每戶各自預約時段，加入後再選日期即可。
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground font-light py-6">
            目前沒有開放中的團報建案，歡迎提出您的建案。
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {projects.map((p) => {
              const count = counts[p.id] || 0;
              const reached = count >= p.min_units;
              const remaining = Math.max(0, p.min_units - count);
              const progress = Math.min(100, (count / p.min_units) * 100);
              return (
                <div
                  key={p.id}
                  className="rounded-3xl border border-border bg-card p-7 shadow-soft flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground leading-tight">{p.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-light">
                        <MapPin className="h-3 w-3" />
                        {p.region}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between text-xs font-light text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      已報名 {count} 戶
                    </span>
                    <span>
                      滿 {p.min_units} 戶享 {formatDiscount(p.discount_rate)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-medium text-primary">
                    {reached ? `已成團，全團享 ${formatDiscount(p.discount_rate)}` : `再 ${remaining} 戶即成團`}
                  </p>

                  <Button asChild className="mt-6 rounded-full text-[11px] uppercase tracking-wider font-normal">
                    <Link to={`/booking?group=${p.id}`}>加入團報</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground font-light mb-4">找不到您的建案？</p>
          <Button variant="outline" onClick={() => setProposeOpen(true)} className="rounded-full">
            <Plus className="h-4 w-4 mr-1.5" />
            提出新建案團報
          </Button>
        </div>
      </div>

      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>提出新建案團報</DialogTitle>
            <DialogDescription>
              送出後由我們審核，上架後就能開放同建案住戶加入，並會與您聯繫。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gp-name">建案名稱</Label>
              <Input id="gp-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="晴空樹" />
            </div>
            <div>
              <Label htmlFor="gp-region">建案區域</Label>
              <Input id="gp-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="新北市泰山區" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gp-proposer">您的姓名</Label>
                <Input id="gp-proposer" value={proposerName} onChange={(e) => setProposerName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="gp-phone">聯絡電話</Label>
                <Input id="gp-phone" value={proposerPhone} onChange={(e) => setProposerPhone(e.target.value)} />
              </div>
            </div>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePropose} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              送出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default GroupBuying;
