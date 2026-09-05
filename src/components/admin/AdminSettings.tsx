import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserPlus, Trash2, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AdminRow = {
  user_id: string;
  email: string;
  created_at: string;
};

const AdminSettings = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_admins");
    if (error) {
      toast.error("無法載入管理員列表");
    } else {
      setAdmins(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;

    setAdding(true);
    const { error } = await supabase.rpc("add_admin_by_email", { _email: email });
    setAdding(false);

    if (error) {
      if (error.message.includes("user_not_found")) {
        toast.error("找不到此帳號", {
          description: "該 email 尚未註冊，請對方先至登入頁註冊帳號後再指派。",
        });
      } else {
        toast.error("新增管理員失敗");
      }
      return;
    }

    toast.success("已新增管理員", { description: email });
    setNewEmail("");
    fetchAdmins();
  };

  const handleRemoveAdmin = async (admin: AdminRow) => {
    if (!window.confirm(`確定要移除 ${admin.email} 的管理員權限嗎？`)) return;

    setRemovingId(admin.user_id);
    const { error } = await supabase.rpc("remove_admin", { _user_id: admin.user_id });
    setRemovingId(null);

    if (error) {
      toast.error(error.message.includes("cannot_remove_self") ? "無法移除自己的管理員權限" : "移除失敗");
      return;
    }

    toast.success("已移除管理員", { description: admin.email });
    fetchAdmins();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("密碼至少需要 6 個字元");
      return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);

    if (error) {
      toast.error("密碼更新失敗");
      return;
    }

    toast.success("密碼已更新");
    setNewPassword("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 管理員列表 */}
      <Card className="p-6 border border-border shadow-soft">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-light">管理員列表</h3>
        </div>
        <p className="text-xs text-muted-foreground font-light mb-5">
          擁有管理員權限的帳號可以存取後台所有功能
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border mb-6">
            {admins.map((admin) => (
              <div key={admin.user_id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-light truncate">
                    {admin.email}
                    {admin.user_id === user?.id && (
                      <span className="text-xs text-primary ml-2">（目前登入）</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    加入於 {format(new Date(admin.created_at), "yyyy/MM/dd")}
                  </p>
                </div>
                {admin.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAdmin(admin)}
                    disabled={removingId === admin.user_id}
                    className="text-xs font-light text-destructive hover:text-destructive shrink-0"
                  >
                    {removingId === admin.user_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    移除
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="space-y-3 pt-4 border-t border-border">
          <Label htmlFor="newAdminEmail" className="text-xs text-muted-foreground font-light">
            新增管理員（輸入已註冊帳號的 email）
          </Label>
          <div className="flex gap-2">
            <Input
              id="newAdminEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="partner@example.com"
              className="text-sm font-light"
              required
            />
            <Button type="submit" size="sm" disabled={adding} className="shrink-0 text-xs font-light">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
              指派
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground font-light">
            對方需先在登入頁完成註冊，才能被指派為管理員。
          </p>
        </form>
      </Card>

      {/* 帳戶資訊與修改密碼 */}
      <div className="space-y-6">
        <Card className="p-6 border border-border shadow-soft">
          <h3 className="text-sm font-light mb-4">目前帳戶</h3>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-light">登入 email</p>
            <p className="text-sm font-light">{user?.email || "—"}</p>
          </div>
        </Card>

        <Card className="p-6 border border-border shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-light">修改密碼</h3>
          </div>
          <p className="text-xs text-muted-foreground font-light mb-5">
            更新目前登入帳號的密碼
          </p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground font-light">
                新密碼（至少 6 個字元）
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="text-sm font-light"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={changingPw} className="text-xs font-light">
              {changingPw && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              更新密碼
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
