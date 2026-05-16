import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, ExternalLink, Plus, Pencil, Trash2, ShieldCheck, ShieldX, Upload, X } from "lucide-react";
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
  uploadIdProof,
  uploadPortfolioMedia,
  deletePortfolioMedia,
  useMe,
  useMyVerification,
  useUpdateMe,
  useMyPortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { initials } from "@/lib/utils";
import { UserType } from "@/lib/types";
import type { UserPortfolioItem } from "@/lib/types";
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
              {user.has_google && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Connected with
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5">
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
              <div className="col-span-2">
                <VerificationSection />
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

      {/* PORTFOLIO */}
      <div className="col-span-12 border-t border-line pt-10">
        <PortfolioSection />
      </div>
    </div>
  );
}

// ── Portfolio management ─────────────────────────────────────────

function PortfolioSection() {
  const portfolio = useMyPortfolio();
  const createItem = useCreatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<UserPortfolioItem | null>(null);
  const qc = useQueryClient();

  async function handleDelete(itemId: number) {
    try {
      await deleteItem.mutateAsync(itemId);
      toast.success("Item removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="editorial-index">— Showcase</div>
          <h2 className="font-display text-3xl mt-2">Portfolio</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Showcase your work, projects, and skills. Visible publicly on your profile.
          </p>
        </div>
        {!showForm && !editingItem && (
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        )}
      </div>

      {(showForm || editingItem) && (
        <PortfolioItemForm
          existing={editingItem ?? undefined}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSaved={(item) => {
            qc.invalidateQueries({ queryKey: ["portfolio", "me"] });
            if (!editingItem) {
              // After creating, we can immediately open the newly created item for media upload
              setShowForm(false);
              setEditingItem(item);
            } else {
              setEditingItem(null);
            }
          }}
        />
      )}

      {portfolio.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!portfolio.isLoading && portfolio.data?.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground italic">
          No portfolio items yet. Add your first one above.
        </p>
      )}

      {portfolio.data && portfolio.data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {portfolio.data.map((item) => (
            <div key={item.id} className="border border-line flex flex-col">
              {item.media_urls && item.media_urls.length > 0 && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={item.media_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="font-semibold text-sm">{item.title}</div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t, i) => (
                      <span key={i} className="text-[10px] border border-line px-1.5 py-0.5 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => { setShowForm(false); setEditingItem(item); }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteItem.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioItemForm({
  existing,
  onClose,
  onSaved,
}: {
  existing?: UserPortfolioItem;
  onClose: () => void;
  onSaved: (item: UserPortfolioItem) => void;
}) {
  const createItem = useCreatePortfolioItem();
  const updateItem = useUpdatePortfolioItem(existing?.id ?? 0);
  const qc = useQueryClient();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [link, setLink] = useState(existing?.link ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [uploading, setUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>(existing?.media_urls ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!title.trim()) return;
    try {
      let item: UserPortfolioItem;
      if (existing) {
        item = await updateItem.mutateAsync({
          title: title.trim(),
          description: description || null,
          link: link || null,
          tags: tags.length ? tags : null,
        });
      } else {
        item = await createItem.mutateAsync({
          title: title.trim(),
          description: description || null,
          link: link || null,
          tags: tags.length ? tags : null,
        });
      }
      onSaved(item);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleMediaUpload(files: FileList | null) {
    if (!files || !existing) return;
    setUploading(true);
    try {
      const all = await uploadPortfolioMedia(existing.id, Array.from(files));
      setMediaUrls(all);
      qc.invalidateQueries({ queryKey: ["portfolio", "me"] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleMediaDelete(url: string) {
    if (!existing) return;
    try {
      await deletePortfolioMedia(existing.id, url);
      setMediaUrls((prev) => prev.filter((u) => u !== url));
      qc.invalidateQueries({ queryKey: ["portfolio", "me"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="border border-line p-6 mb-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {existing ? "Edit portfolio item" : "New portfolio item"}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <Label>Title <span className="text-destructive">*</span></Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Brand identity for Sunrise Co."
          className="mt-1"
        />
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          className="mt-1 w-full border border-line px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-24"
          placeholder="What was this project? What did you do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <Label>Link</Label>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://yourwork.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="e.g. Branding, Design…"
            className="flex-1 max-w-xs"
          />
          <Button size="sm" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 border border-ink bg-ink text-paper px-2 py-0.5 text-xs">
                {t}
                <button onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media — only available after item is created */}
      {existing && (
        <div>
          <Label>Media</Label>
          <p className="text-xs text-muted-foreground mb-2">Up to 8 images. First one is the cover.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {mediaUrls.map((url) => (
              <div key={url} className="relative group">
                <img src={url} alt="" className="h-20 w-20 object-cover border border-line" />
                <button
                  className="absolute top-0.5 right-0.5 bg-paper/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleMediaDelete(url)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {mediaUrls.length < 8 && (
              <button
                className="h-20 w-20 border border-dashed border-line flex items-center justify-center text-muted-foreground hover:border-ink hover:text-ink transition-colors"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "…" : <Plus className="h-5 w-5" />}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleMediaUpload(e.target.files)}
          />
        </div>
      )}

      {!existing && (
        <p className="text-xs text-muted-foreground">
          Save first, then you can add photos and media.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending || !title.trim()}>
          {isPending ? "Saving…" : existing ? "Save changes" : "Create item"}
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
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
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Identity verification
      </dt>

      {!v && !verification.isLoading && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            Upload a government-issued ID (Aadhaar, passport, etc.) to get verified.
            Front and back photos accepted.
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
          <input
            ref={idInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleIdUpload(e.target.files)}
          />
        </div>
      )}

      {status === "pending" && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          Under review — we'll notify you once approved.
        </div>
      )}

      {status === "approved" && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
          <ShieldCheck className="h-4 w-4" />
          Verified
        </div>
      )}

      {status === "rejected" && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <ShieldX className="h-4 w-4" />
            Rejected
          </div>
          {v?.admin_note && (
            <p className="text-sm text-muted-foreground border-l-2 border-line pl-3">
              {v.admin_note}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => idInputRef.current?.click()}
            className="gap-2 mt-2"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Resubmit ID proof"}
          </Button>
          <input
            ref={idInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleIdUpload(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
