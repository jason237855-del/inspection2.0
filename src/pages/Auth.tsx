import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const checkAdmin = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
};

const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
});

const translateAuthError = (message: string): string => {
  if (message.includes("Invalid login credentials")) return "帳號或密碼錯誤，請重新輸入";
  if (message.includes("already registered")) return "此電子郵件已註冊，請直接登入";
  if (message.includes("Email not confirmed")) return "電子郵件尚未驗證，請先至信箱點擊驗證連結";
  if (message.includes("User not found")) return "找不到此帳號";
  if (message.includes("rate limit") || message.includes("too many")) return "嘗試次數過多，請稍後再試";
  return message;
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 忘記密碼
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // 防灌水（僅用於註冊，避免公開的註冊入口被機器人濫用）：隱藏欄位 + 最短填寫時間
  const [website, setWebsite] = useState("");
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // First user automatically becomes admin; otherwise require existing admin role
          await supabase.rpc("bootstrap_first_admin");
          const isAdmin = await checkAdmin(session.user.id);
          if (isAdmin) {
            navigate("/admin");
          } else {
            await supabase.auth.signOut();
            toast({
              title: "無管理員權限",
              description: "此帳戶尚未設定為管理員，請聯繫網站管理員。",
              variant: "destructive",
            });
          }
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await supabase.rpc("bootstrap_first_admin");
        const isAdmin = await checkAdmin(session.user.id);
        if (isAdmin) {
          navigate("/admin");
        } else {
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "請輸入 Email", variant: "destructive" });
      return;
    }

    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);

    if (error) {
      toast({ title: "寄送失敗", description: translateAuthError(error.message), variant: "destructive" });
      return;
    }

    setResetSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "輸入錯誤",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && (website.trim() !== "" || Date.now() - mountedAtRef.current < 4000)) {
      toast({ title: "系統偵測到異常提交，請稍後再試一次", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({
            title: "登入失敗",
            description: translateAuthError(error.message),
            variant: "destructive",
          });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) {
          toast({
            title: error.message.includes("already registered") ? "帳號已存在" : "註冊失敗",
            description: translateAuthError(error.message),
            variant: "destructive",
          });
        } else {
          toast({
            title: "請查收驗證信",
            description: "我們已寄出確認連結，請至信箱完成驗證後再登入。",
          });
        }
      }
    } catch {
      toast({
        title: "發生錯誤",
        description: "系統發生問題，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-light text-background mb-2 tracking-tight">
            {forgotMode ? "重設密碼" : isLogin ? "後臺登錄" : "創建帳戶"}
          </h1>
          <p className="text-xs text-background/60 font-light">
            {forgotMode
              ? "輸入註冊時使用的 Email，我們會寄送重設密碼連結"
              : isLogin
                ? "登錄管理後臺"
                : "註冊後臺管理帳戶"}
          </p>
        </div>

        {forgotMode ? (
          resetSent ? (
            <div className="text-center space-y-6">
              <p className="text-sm text-background/70 font-light">
                已寄出重設密碼信到 {resetEmail}，請至信箱點擊連結繼續。
              </p>
              <button
                onClick={() => {
                  setForgotMode(false);
                  setResetSent(false);
                  setResetEmail("");
                }}
                className="text-xs text-background/50 hover:text-background/80 font-light transition-colors"
              >
                返回登入
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
                  郵箱
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@homeinspection.tw"
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/30 focus-visible:ring-primary"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={sendingReset}
                className="w-full rounded-full text-[11px] uppercase tracking-wider font-normal"
              >
                {sendingReset ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    處理中...
                  </span>
                ) : (
                  "寄送重設密碼信"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-xs text-background/50 hover:text-background/80 font-light transition-colors"
              >
                返回登入
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 防灌水蜜罐欄位：一般使用者看不到也不會填，機器人常會自動填入 */}
            <div
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, overflow: "hidden" }}
            >
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
                郵箱
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@homeinspection.tw"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/30 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
                  密碼
                </Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-[11px] text-background/50 hover:text-background/80 font-light transition-colors"
                  >
                    忘記密碼？
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/30 focus-visible:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full text-[11px] uppercase tracking-wider font-normal"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  處理中...
                </span>
              ) : isLogin ? "登錄" : "創建帳戶"}
            </Button>
          </form>
        )}

        {!forgotMode && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-background/50 hover:text-background/80 font-light transition-colors"
            >
              {isLogin ? "需要帳戶？註冊" : "已有帳戶？登錄"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-background/40 hover:text-background/60 font-light transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              返回首頁
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
