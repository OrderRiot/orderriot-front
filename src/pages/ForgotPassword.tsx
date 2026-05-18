import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/lib/queries";
import { apiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await forgot.mutateAsync(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-16 md:py-24 grid grid-cols-12 gap-x-6">
      <aside className="col-span-12 md:col-span-5">
        <div className="editorial-index">— Account recovery</div>
        <h1 className="font-display text-display-md mt-4 leading-[1.02] text-balance">
          Forgot your <span className="italic-display">password?</span>
        </h1>
        <p className="mt-6 text-muted-foreground max-w-sm">
          Enter the email you registered with and we'll send you a reset link.
        </p>
        <div className="mt-10">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-ink underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </aside>

      <div className="col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-0">
        {sent ? (
          <div className="border border-line p-8">
            <div className="font-display text-xl mb-3">Check your inbox.</div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If <span className="text-ink font-medium">{email}</span> is registered, a reset link
              is on its way. It expires in 1 hour.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, or{" "}
              <button
                onClick={() => setSent(false)}
                className="underline underline-offset-4 hover:text-ink"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-8">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={forgot.isPending}
            >
              {forgot.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
