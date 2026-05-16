import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/lib/queries";
import { toast } from "sonner";
import { apiError } from "@/lib/api";

interface Props {
  onSuccess: (isNewUser: boolean) => void;
}

export function GoogleAuthButton({ onSuccess }: Props) {
  const googleAuth = useGoogleAuth();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (!credentialResponse.credential) {
              toast.error("Google sign-in failed — no credential returned.");
              return;
            }
            try {
              const data = await googleAuth.mutateAsync(credentialResponse.credential);
              onSuccess(data.is_new_user);
            } catch (err) {
              toast.error(apiError(err));
            }
          }}
          onError={() => toast.error("Google sign-in failed.")}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
        />
      </div>
    </div>
  );
}
