import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ga } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/queries";
import { apiError } from "@/lib/api";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const schema = z.object({
  email: z.string().email("Enter a real email"),
  password: z.string().min(6, "At least 6 characters"),
});
type Values = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const login = useLogin();
  const [showPwd, setShowPwd] = useState(false);
  const redirectTo = location.state?.from ?? "/discover";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    try {
      await login.mutateAsync(values);
      ga.login("email");
      toast.success("Welcome back.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-16 md:py-24 grid grid-cols-12 gap-x-6">
      {/* Left — editorial caption */}
      <aside className="col-span-12 md:col-span-5">
        <div className="editorial-index">— Returning</div>
        <h1 className="font-display text-display-md mt-4 leading-[1.02] text-balance">
          Sign in. <span className="italic-display">Pick up</span> where you left off.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-sm">
          Your pledges, your campaigns, your conversations — all in one place.
        </p>

        <Separator />

        <div className="mt-10 hidden md:block">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            New to OrderRiot?
          </div>
          <Link
            to="/register"
            className="font-display italic text-3xl mt-2 inline-flex items-center gap-2 link-quiet"
          >
            Create an account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* Right — the form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-0"
      >
        <div className="space-y-8">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-2 italic">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-4">
                <Link
                  to="/forgot-password"
                  className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
                >
                  Forgot?
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-2 italic">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || login.isPending}
          >
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>

          <GoogleAuthButton
            onSuccess={(isNewUser) => {
              if (isNewUser) ga.signUp("google"); else ga.login("google");
              toast.success(isNewUser ? "Welcome to OrderRiot." : "Welcome back.");
              navigate(isNewUser ? "/profile" : redirectTo, { replace: true });
            }}
          />

          <div className="md:hidden text-center text-sm pt-4">
            New here?{" "}
            <Link to="/register" className="italic-display text-lg link-quiet">
              Create an account
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

function Separator() {
  return <div className="my-10 h-px bg-line w-12" />;
}
