import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useActiveGroupProjects } from "@/hooks/useGroupProjects";
import GroupProjectCard from "@/components/group/GroupProjectCard";
import ProposeGroupDialog from "@/components/group/ProposeGroupDialog";

/** 首頁的「建案團報」區塊；完整內容在 /group 團報專區與 /group/<建案> 各建案頁面 */
const GroupBuying = () => {
  const reduced = usePrefersReducedMotion();
  const { projects, counts, loading, failed } = useActiveGroupProjects();
  const [proposeOpen, setProposeOpen] = useState(false);

  // 資料表尚未建立或讀取失敗時，不顯示整個區塊，避免首頁出現壞掉的內容
  if (failed) return null;

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
            {projects.map((p) => (
              <GroupProjectCard key={p.id} project={p} count={counts[p.id] || 0} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground font-light">找不到您的建案？</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => setProposeOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-1.5" />
              提出新建案團報
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/group">團報專區與流程說明 →</Link>
            </Button>
          </div>
        </div>
      </div>

      <ProposeGroupDialog open={proposeOpen} onOpenChange={setProposeOpen} />
    </section>
  );
};

export default GroupBuying;
