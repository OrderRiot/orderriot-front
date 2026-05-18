import { useGoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/lib/queries";
import { toast } from "sonner";
import { apiError } from "@/lib/api";

interface Props {
  onSuccess: (isNewUser: boolean) => void;
}

export function GoogleAuthButton({ onSuccess }: Props) {
  const googleAuth = useGoogleAuth();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await googleAuth.mutateAsync({ access_token: tokenResponse.access_token });
        onSuccess(data.is_new_user);
      } catch (err) {
        toast.error(apiError(err));
      }
    },
    onError: () => toast.error("Google sign-in failed."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button
        type="button"
        disabled={googleAuth.isPending}
        onClick={() => login()}
        className="w-full flex items-center justify-center gap-3 border border-line px-4 py-3 text-sm font-medium text-ink hover:border-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleAuth.isPending ? "Signing in…" : "Continue with Google"}
      </button>
    </div>
  );
}
