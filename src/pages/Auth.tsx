import { useState, useEffect } from "react";
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
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data, error }) => {
      if (error) {
        console.error("admin_exists error:", error);
        setAdminExists(false);
      } else {
        setAdminExists(!!data);
      }
    });
  }, []);

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
            emailRedirectTo: `${window.location.origin}/admin`,
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
            {isLogin ? "後臺登錄" : "創建帳戶"}
          </h1>
          <p className="text-xs text-background/60 font-light">
            {isLogin
              ? "登錄管理後臺"
              : "註冊後臺管理帳戶"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="password" className="text-[11px] uppercase tracking-wider font-normal text-background/70">
              密碼
            </Label>
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

        {adminExists !== null && (
          <div className="mt-6 flex flex-col items-center gap-4">
            {!adminExists && (
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-background/50 hover:text-background/80 font-light transition-colors"
              >
                {isLogin ? "需要帳戶？註冊" : "已有帳戶？登錄"}
              </button>
            )}
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
