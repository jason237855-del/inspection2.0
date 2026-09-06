import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [checkingLink, setCheckingLink] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // 重設密碼信的連結會讓 supabase-js 自動解析 URL 並建立一個臨時 session，
    // 這裡等它處理完再確認是否真的有一個有效的 session 可以拿來改密碼。
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidLink(true);
        setCheckingLink(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidLink(true);
      }
      setCheckingLink(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "密碼太短", description: "密碼至少需要 6 個字元", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "兩次輸入的密碼不一致", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: "密碼更新失敗", description: error.message, variant: "destructive" });
      return;
    }

    setDone(true);
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-normal tracking-wide text-background">
              診斷室驗屋 / Home Inspection & Diagnostics
            </span>
          </div>
          <h1 className="text-2xl font-light text-background mb-2 tracking-tight">重設密碼</h1>
        </div>

        {checkingLink ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-background/60" />
          </div>
        ) : done ? (
          <div className="text-center space-y-6">
            <p className="text-sm text-background/70 font-light">
              密碼已更新，請用新密碼重新登入。
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full rounded-full text-[11px] uppercase tracking-wider font-normal"
            >
              前往登入
            </Button>
          </div>
        ) : !validLink ? (
          <div className="text-center space-y-6">
            <p className="text-sm text-background/70 font-light">
              這個連結無效或已過期，請重新申請一次忘記密碼。
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="text-xs text-background/40 hover:text-background/60 font-light transition-colors flex items-center gap-1 justify-center mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              返回登入頁
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
                新密碼
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/30 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
                確認新密碼
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再輸入一次"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/30 focus-visible:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full text-[11px] uppercase tracking-wider font-normal"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  處理中...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5" />
                  更新密碼
                </span>
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
