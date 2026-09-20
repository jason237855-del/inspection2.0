import GroupCover from "./GroupCover";
import type { GroupProject } from "@/components/admin/types";

type Props = {
  project: Pick<GroupProject, "name" | "region" | "slug" | "cover_image_url">;
  /** 長寬比的 Tailwind class，預設 aspect-[16/10] */
  aspect?: string;
  className?: string;
};

/**
 * 團報建案的封面：有後台上傳的照片就用照片，否則自動產生「大樓輪廓」設計圖卡。
 * 新增建案不用上傳任何東西就有圖。
 */
const GroupCoverImage = ({ project, aspect = "aspect-[16/10]", className = "" }: Props) => {
  if (project.cover_image_url) {
    return (
      <img
        src={project.cover_image_url}
        alt={`${project.name}（${project.region}）`}
        loading="lazy"
        decoding="async"
        className={`${aspect} w-full object-cover ${className}`}
      />
    );
  }
  return (
    <GroupCover
      name={project.name}
      region={project.region}
      seed={project.slug}
      variant="skyline"
      aspect={aspect}
      className={className}
    />
  );
};

export default GroupCoverImage;
