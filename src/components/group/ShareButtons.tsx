import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = { url: string };

/** 分享團報建案連結：LINE（社區群組最常用）與複製連結 */
const ShareButtons = ({ url }: Props) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("已複製連結，可貼到社區群組邀請鄰居一起報名");
    } catch {
      toast.error("複製失敗，請手動複製網址列的連結");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="outline" className="rounded-full">
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Share2 className="h-4 w-4 mr-1.5" />
          分享到 LINE
        </a>
      </Button>
      <Button variant="outline" className="rounded-full" onClick={copy}>
        <Link2 className="h-4 w-4 mr-1.5" />
        複製連結
      </Button>
    </div>
  );
};

export default ShareButtons;
