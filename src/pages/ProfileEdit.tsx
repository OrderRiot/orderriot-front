import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, ExternalLink, Plus, Pencil, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadAvatar,
  uploadPortfolioMedia,
  deletePortfolioMedia,
  useMe,
  useUpdateMe,
  useMyPortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { initials } from "@/lib/utils";
import type { UserPortfolioItem } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/yourhandle" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourhandle" },
];

export default function ProfileEdit() {
  const me = useMe();
  const update = useUpdateMe();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [socials, setSocials] = useState<Record<string, string> | null>(null);

  if (me.isLoading || !me.data) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-2xl space-y-8">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10" />
        <Skeleton className="h-24" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  const user = me.data;

  // Initialise local state from server data on first render
  const displayName = name ?? user.name ?? "";
  const displayBio = bio ?? user.bio ?? "";
  const displayWebsite = website ?? user.website ?? "";
  const displaySocials: Record<string, string> = socials ?? user.social_links ?? {};

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

  async function handleSave() {
    try {
      await update.mutateAsync({
        name: displayName || null,
        bio: displayBio || null,
        website: displayWebsite || null,
        social_links: Object.keys(displaySocials).some((k) => displaySocials[k])
          ? Object.fromEntries(Object.entries(displaySocials).filter(([, v]) => v))
          : null,
      } as never);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  function setSocial(key: string, value: string) {
    setSocials((prev) => ({ ...(prev ?? user.social_links ?? {}), [key]: value }));
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
        <div className="editorial-index">— Public profile</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Edit <span className="italic-display">profile.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          This is what people see when they visit{" "}
          <Link
            to={`/users/${user.username}`}
            className="text-accent hover:underline"
          >
            your public profile
          </Link>
          .
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-10 pb-10 border-b border-line">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group block shrink-0"
          aria-label="Change avatar"
        >
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
            <AvatarFallback className="text-2xl">{initials(user.name || user.username)}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 bg-ink/60 text-paper grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera className="h-5 w-5" />
          </span>
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-paper/80 text-xs uppercase tracking-[0.18em] rounded-full">
              …
            </span>
          )}
        </button>
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={onAvatar} />
        <div>
          <div className="font-medium text-sm">{user.name || user.username}</div>
          <div className="text-xs text-muted-foreground">@{user.username}</div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-accent hover:underline mt-1 block"
          >
            Change photo
          </button>
        </div>
      </div>

      {/* Profile fields */}
      <div className="space-y-6 mb-10">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            className="mt-1"
            placeholder={user.username}
            value={displayName}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shown as your name on your public profile. Your @{user.username} handle stays the same.
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-24"
            placeholder="A short bio about yourself…"
            value={displayBio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            className="mt-1"
            placeholder="https://yoursite.com"
            value={displayWebsite}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>

      {/* Social links */}
      <div className="mb-10 pb-10 border-b border-line">
        <div className="text-sm font-semibold mb-4">Social links</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label htmlFor={`social-${key}`} className="text-xs">{label}</Label>
              <Input
                id={`social-${key}`}
                className="mt-1"
                placeholder={placeholder}
                value={displaySocials[key] ?? ""}
                onChange={(e) => setSocial(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>

      {/* Portfolio */}
      <div className="border-t border-line pt-10">
        <PortfolioSection />
      </div>
    </div>
  );
}

// ── Portfolio management ─────────────────────────────────────────

function PortfolioSection() {
  const portfolio = useMyPortfolio();
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
            Showcase your work publicly. Visible on your profile page.
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
              setShowForm(false);
              setEditingItem(item);
            } else {
              setEditingItem(null);
            }
          }}
        />
      )}

      {portfolio.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {!portfolio.isLoading && portfolio.data?.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground italic">No portfolio items yet.</p>
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
                    size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={() => { setShowForm(false); setEditingItem(item); }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm" variant="ghost"
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
  existing, onClose, onSaved,
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
        item = await updateItem.mutateAsync({ title: title.trim(), description: description || null, link: link || null, tags: tags.length ? tags : null });
      } else {
        item = await createItem.mutateAsync({ title: title.trim(), description: description || null, link: link || null, tags: tags.length ? tags : null });
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
        <div className="text-sm font-semibold">{existing ? "Edit portfolio item" : "New portfolio item"}</div>
        <button onClick={onClose} className="text-muted-foreground hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <Label>Title <span className="text-destructive">*</span></Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand identity for Sunrise Co." className="mt-1" />
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
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://yourwork.com" className="mt-1" />
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
                <button onClick={() => setTags((p) => p.filter((x) => x !== t))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {existing && (
        <div>
          <Label>Media</Label>
          <p className="text-xs text-muted-foreground mb-2">Up to 8 images. First is the cover.</p>
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
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e.target.files)} />
        </div>
      )}

      {!existing && (
        <p className="text-xs text-muted-foreground">Save first, then you can add photos.</p>
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
