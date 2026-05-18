import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/lib/queries";
import { apiError } from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    try {
      await reset.mutateAsync({ token, new_password: password });
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!token) {
    return (
      <div className="container-edge py-24 text-center">
        <p className="text-muted-foreground">Invalid or missing reset link.</p>
      </div>
    );
  }

  return (
    <div className="container-edge py-16 md:py-24 grid grid-cols-12 gap-x-6">
      <aside className="col-span-12 md:col-span-5">
        <div className="editorial-index">— New password</div>
        <h1 className="font-display text-display-md mt-4 leading-[1.02] text-balance">
          Reset your <span className="italic-display">password.</span>
        </h1>
        <p className="mt-6 text-muted-foreground max-w-sm">
          Choose a new password for your account. You'll be signed out of all devices.
        </p>
      </aside>

      <form
        onSubmit={onSubmit}
        className="col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-0 space-y-8"
      >
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">New password</Label>
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            id="password"
            type={showPwd ? "text" : "password"}
            autoFocus
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat the password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={reset.isPending}
        >
          {reset.isPending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
