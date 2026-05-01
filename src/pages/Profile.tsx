import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  uploadAvatar,
  useMe,
  useUpdateMe,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { initials } from "@/lib/utils";
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

export default function Profile() {
  const me = useMe();
  const update = useUpdateMe();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      <div className="container-edge py-32 text-center text-muted-foreground tracking-[0.18em] text-xs uppercase">
        Loading profile…
      </div>
    );
  }

  const user = me.data;

  async function onAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await update.mutateAsync({
        username: values.username,
        phone: values.phone || null,
        location: values.location || null,
        gender: values.gender ?? null,
        user_type: Number(values.user_type),
      } as never);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-12 md:py-20">
      <div className="grid grid-cols-12 gap-y-12">
        {/* HEADER */}
        <div className="col-span-12">
          <div className="editorial-index">— Account</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            <span className="italic-display">Hello,</span> {user.username}.
          </h1>
        </div>

        {/* SIDE — avatar + summary */}
        <aside className="col-span-12 md:col-span-4">
          <div className="border-t border-line pt-8">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group block"
              aria-label="Change avatar"
            >
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
                <AvatarFallback className="text-2xl">{initials(user.username)}</AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 bg-ink/60 text-paper grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="h-5 w-5" />
              </span>
              {uploading && (
                <span className="absolute inset-0 grid place-items-center bg-paper/80 text-xs uppercase tracking-[0.18em] rounded-full">
                  Uploading…
                </span>
              )}
            </button>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileRef}
              onChange={onAvatar}
            />

            <dl className="mt-8 space-y-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Role
                </dt>
                <dd className="mt-1">{typeLabel[user.user_type] ?? "Member"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Verified
                </dt>
                <dd className="mt-1">{user.isverified ? "Yes" : "Not yet"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Joined
                </dt>
                <dd className="mt-1 tnum">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>

            <div className="mt-10 pt-8 border-t border-line space-y-4">
              <Link
                to="/profile/campaigns"
                className="flex items-center justify-between text-sm group"
              >
                <span>My campaigns</span>
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </Link>
              <Link
                to="/profile/contributions"
                className="flex items-center justify-between text-sm group"
              >
                <span>Backed projects</span>
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </Link>
              <Link
                to={`/users/${user.user_id}`}
                className="flex items-center justify-between text-sm group"
              >
                <span>Public profile</span>
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </aside>

        {/* FORM */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="col-span-12 md:col-span-7 md:col-start-6 border-t border-line pt-8 space-y-8"
        >
          <div>
            <div className="editorial-index">— Profile</div>
            <h2 className="font-display text-3xl mt-2">Edit details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register("username")} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={form.watch("gender") ?? ""}
                onValueChange={(v) =>
                  form.setValue("gender", v as "male" | "female" | "other" | "prefer_not")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Account type</Label>
              <Select
                value={form.watch("user_type")}
                onValueChange={(v) =>
                  form.setValue("user_type", v as "1" | "2" | "3")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Backer</SelectItem>
                  <SelectItem value="2">Creator</SelectItem>
                  <SelectItem value="3">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
