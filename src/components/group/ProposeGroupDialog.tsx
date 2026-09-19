import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

/** 客戶提出新建案團報（寫入「待審核」，由後台核准後才會公開） */
const ProposeGroupDialog = ({ open, onOpenChange }: Props) => {
  const [projectName, setProjectName] = useState("");
  const [region, setRegion] = useState("");
  const [proposerName, setProposerName] = useState("");
  const [proposerPhone, setProposerPhone] = useState("");
  const [website, setWebsite] = useState(""); // 防灌水：機器人常會自動填入的隱藏欄位
  const [submitting, setSubmitting] = useState(false);
  const mountedAtRef = useRef(Date.now());

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
    onOpenChange(false);
    setProjectName("");
    setRegion("");
    setProposerName("");
    setProposerPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>提出新建案團報</DialogTitle>
          <DialogDescription>送出後由我們審核，上架後就能開放同建案住戶加入，並會與您聯繫。</DialogDescription>
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
  );
};

export default ProposeGroupDialog;
