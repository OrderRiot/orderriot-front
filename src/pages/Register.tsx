import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ga } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogin, useRegister } from "@/lib/queries";
import { apiError } from "@/lib/api";
import { UserType } from "@/lib/types";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(50, "Max 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ or -"),
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
  user_type: z.enum(["backer", "creator", "both"]),
  location: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const userTypeMap = {
  backer: UserType.backer,
  creator: UserType.creator,
  both: UserType.both,
};

export default function Register() {
  const navigate = useNavigate();
  const reg = useRegister();
  const login = useLogin();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { user_type: "both" },
  });

  async function onSubmit(values: Values) {
    try {
      await reg.mutateAsync({
        ...values,
        user_type: userTypeMap[values.user_type],
      });
      // Auto-login after register
      await login.mutateAsync({ email: values.email, password: values.password });
      ga.signUp("email");
      toast.success("You're in. Welcome to OrderRiot.");
      navigate("/discover", { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-16 md:py-24 grid grid-cols-12 gap-x-6">
      <aside className="col-span-12 md:col-span-5">
        <div className="editorial-index">— Join</div>
        <h1 className="font-display text-display-md mt-4 leading-[1.02] text-balance">
          Make an <span className="italic-display">account.</span>
          <br />
          Make a thing.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-sm leading-relaxed">
          One account lets you back what you love and launch what you want to
          see in the world.
        </p>
        <div className="mt-10 hidden md:block">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Already here?
          </div>
          <Link to="/login" className="italic-display text-3xl mt-2 inline-block link-quiet">
            Sign in →
          </Link>
        </div>
      </aside>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-0 space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoFocus autoComplete="username" {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="text-destructive text-xs mt-2 italic">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-xs mt-2 italic">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-destructive text-xs mt-2 italic">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City, Country"
            {...form.register("location")}
          />
        </div>

        <div>
          <Label>I am a…</Label>
          <Select
            value={form.watch("user_type")}
            onValueChange={(v) => form.setValue("user_type", v as Values["user_type"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backer">Backer · I want to fund things</SelectItem>
              <SelectItem value="creator">Creator · I want to launch things</SelectItem>
              <SelectItem value="both">Both · honestly, both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          By creating an account you agree to our terms and privacy policy.
          We won't sell your data. We won't email you garbage.
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={reg.isPending || login.isPending}
        >
          {reg.isPending || login.isPending ? "Creating account…" : "Create account"}
        </Button>

        <GoogleAuthButton
          onSuccess={(isNewUser) => {
            if (isNewUser) ga.signUp("google"); else ga.login("google");
            toast.success(isNewUser ? "Account created. Welcome to OrderRiot." : "Welcome back.");
            navigate(isNewUser ? "/profile" : "/discover", { replace: true });
          }}
        />

        <div className="md:hidden text-center text-sm pt-4">
          Already here?{" "}
          <Link to="/login" className="italic-display text-lg link-quiet">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
