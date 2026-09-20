import { Link } from "react-router-dom";
import { Building2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import GroupCoverImage from "./GroupCoverImage";
import { formatDiscount, groupPath } from "@/lib/group";
import type { GroupProject } from "@/components/admin/types";

type Props = { project: GroupProject; count: number };

const GroupProjectCard = ({ project: p, count }: Props) => {
  const reached = count >= p.min_units;
  const remaining = Math.max(0, p.min_units - count);
  const progress = Math.min(100, (count / p.min_units) * 100);

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <Link to={groupPath(p.slug)} aria-label={`查看 ${p.name} 建案頁面`} tabIndex={-1}>
        <GroupCoverImage project={p} />
      </Link>
      <div className="flex flex-1 flex-col p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground leading-tight">
            <Link to={groupPath(p.slug)} className="hover:text-primary transition-colors">
              {p.name}
            </Link>
          </h3>
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
      <Link
        to={groupPath(p.slug)}
        className="mt-3 text-center text-xs text-muted-foreground font-light hover:text-primary transition-colors"
      >
        查看建案頁面與分享連結
      </Link>
      </div>
    </div>
  );
};

export default GroupProjectCard;
