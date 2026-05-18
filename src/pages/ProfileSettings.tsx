import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, ShieldX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadIdProof,
  useMe,
  useMyVerification,
  useUpdateMe,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { UserType } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  username: z.string().min(3).max(50),
  phone: z.string().optional(),
  location: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not"]).optional(),
  user_type: z.enum(["1", "2", "3"]),
});

const typeLabel: Record<number, string> = {
  [UserType.backer]: "Backer",
  [UserType.creator]: "Creator",
  [UserType.both]: "Creator & Backer",
  [UserType.admin]: "Admin",
};

export default function ProfileSettings() {
  const me = useMe();
  const update = useUpdateMe();

  const form = useForm({
    resolver: zodResolver(schema),
    values: me.data
      ? {
          username: me.data.username,
          phone: me.data.phone ?? "",
          location: me.data.location ?? "",
          gender: (me.data.gender ?? undefined) as
            | "male"
            | "female"
            | "other"
            | "prefer_not"
            | undefined,
          user_type: String(me.data.user_type) as "1" | "2" | "3",
        }
      : undefined,
  });

  if (me.isLoading || !me.data) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-2xl space-y-8">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-24" />
      </div>
    );
  }

  const user = me.data;

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await update.mutateAsync({
        username: values.username,
        phone: values.phone || null,
        location: values.location || null,
        gender: values.gender ?? null,
        user_type: Number(values.user_type),
      } as never);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-12 md:py-20 max-w-3xl">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink transition-colors mb-10"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to profile
      </Link>

      <div className="mb-10">
        <div className="editorial-index">— Account</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Account <span className="italic-display">settings.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Left — form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" className="mt-1" {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className="mt-1" {...form.register("phone")} />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" className="mt-1" placeholder="City, Country" {...form.register("location")} />
          </div>

          <div>
            <Label>Gender</Label>
            <Select
              value={form.watch("gender") ?? ""}
              onValueChange={(v) =>
                form.setValue("gender", v as "male" | "female" | "other" | "prefer_not")
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Prefer not to say" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Account type</Label>
            <Select
              value={form.watch("user_type")}
              onValueChange={(v) => form.setValue("user_type", v as "1" | "2" | "3")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Backer — I back projects</SelectItem>
                <SelectItem value="2">Creator — I create campaigns</SelectItem>
                <SelectItem value="3">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>

        {/* Right — read-only info + verification */}
        <div className="space-y-8 border-t md:border-t-0 md:border-l border-line pt-8 md:pt-0 md:pl-8">
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Email</dt>
              <dd>{user.email}</dd>
              <dd className="text-xs text-muted-foreground mt-0.5">Contact support to change your email.</dd>
            </div>

            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Role</dt>
              <dd>{typeLabel[user.user_type] ?? "Member"}</dd>
            </div>

            {user.has_google && (
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Connected with</dt>
                <dd className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </dd>
              </div>
            )}

            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Joined</dt>
              <dd className="tnum">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <div className="border-t border-line pt-6">
            <VerificationSection />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationSection() {
  const verification = useMyVerification();
  const idInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  async function handleIdUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await uploadIdProof(Array.from(files));
      await qc.invalidateQueries({ queryKey: ["verification", "me"] });
      toast.success("ID uploaded. We'll review it shortly.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  const v = verification.data;
  const status = v?.status;

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Identity verification
      </div>

      {!v && !verification.isLoading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a government-issued ID to get verified. Unlocks posting ideas, collabs, and campaigns.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => idInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload ID proof"}
          </Button>
        </div>
      )}

      {status === "pending" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          Under review — we'll notify you once approved.
        </div>
      )}

      {status === "approved" && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <ShieldCheck className="h-4 w-4" />
          Verified
        </div>
      )}

      {status === "rejected" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <ShieldX className="h-4 w-4" />
            Rejected
          </div>
          {v?.admin_note && (
            <p className="text-sm text-muted-foreground border-l-2 border-line pl-3">{v.admin_note}</p>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => idInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Resubmit ID proof"}
          </Button>
        </div>
      )}

      <input
        ref={idInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleIdUpload(e.target.files)}
      />
    </div>
  );
}
