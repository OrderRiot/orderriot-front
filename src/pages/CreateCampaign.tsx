import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, FileText, Play, Plus, SendHorizonal, Trash2, Upload, X, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/campaign/ProgressBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadCampaignDocuments,
  uploadCampaignMedia,
  useAddReward,
  useCampaign,
  useCreateCampaign,
  useMe,
  useMyOrganizations,
  useRewards,
  useSubmitCampaign,
  useUpdateCampaign,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { formatMoney, getYouTubeId, isVideoUrl, pct } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

const categories = [
  "Design",
  "Technology",
  "Film",
  "Music",
  "Games",
  "Publishing",
  "Food",
  "Fashion",
  "Photography",
  "Theatre",
  "Crafts",
  "Comics",
];

const basicsSchema = z.object({
  title: z.string().min(3, "Give it a title").max(140),
  subtitle: z.string().max(280).optional(),
  category: z.string().min(1, "Pick a category"),
  location: z.string().min(1, "Where are you based?"),
  company: z.string().optional(),
});
type BasicsValues = z.infer<typeof basicsSchema>;

const goalSchema = z.object({
  goal_amount: z.coerce.number().min(1, "Set a goal"),
  completion_date: z.string().min(1, "Pick a deadline"),
});
type GoalValues = z.infer<typeof goalSchema>;

const storySchema = z.object({
  description: z.string().min(20, "Tell the story — at least 20 characters"),
});
type StoryValues = z.infer<typeof storySchema>;

const rewardSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  min_amount: z.coerce.number().min(1),
  max_backers: z.coerce.number().int().positive().optional().or(z.literal("")),
  estimated_delivery: z.string().optional(),
});

type StepKey = "basics" | "story" | "goal" | "media" | "rewards" | "documents" | "review";
const steps: { key: StepKey; title: string; caption: string }[] = [
  { key: "basics",    title: "Basics",    caption: "Title, category, location" },
  { key: "story",     title: "Story",     caption: "What you're making and why" },
  { key: "goal",      title: "Goal",      caption: "Funding target & deadline" },
  { key: "media",     title: "Media",     caption: "Cover image and gallery" },
  { key: "rewards",   title: "Rewards",   caption: "What backers get" },
  { key: "documents", title: "Documents", caption: "Legal & project files for review" },
  { key: "review",    title: "Review",    caption: "Submit when ready" },
];

export default function CreateCampaign() {
  const params = useParams();
  const editingId = params.id ? Number(params.id) : null;
  const existing = useCampaign(editingId ?? 0);
  const create = useCreateCampaign();
  const update = useUpdateCampaign(editingId ?? 0);
  const submit = useSubmitCampaign(editingId ?? 0);
  const navigate = useNavigate();
  const me = useMe();
  const myOrgs = useMyOrganizations();

  const [step, setStep] = useState<StepKey>("basics");
  const [draftId, setDraftId] = useState<number | null>(editingId);

  const hasVerifiedOrg = myOrgs.data?.some((o) => o.status === "verified") ?? false;

  if (!editingId && (me.data || me.isSuccess)) {
    if (!me.data?.isverified) {
      return (
        <div className="container-edge py-20 max-w-2xl">
          <div className="border border-line p-10 space-y-4">
            <div className="editorial-index">— Access required</div>
            <h1 className="font-display text-display-sm">Identity verification required</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              To create a campaign you must first verify your identity. Upload your ID proof from your profile settings.
            </p>
            <div className="flex gap-3 pt-2">
              <Button asChild><Link to="/profile/settings">Go to settings</Link></Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </div>
      );
    }
    if (!hasVerifiedOrg && !myOrgs.isLoading) {
      return (
        <div className="container-edge py-20 max-w-2xl">
          <div className="border border-line p-10 space-y-4">
            <div className="editorial-index">— Access required</div>
            <h1 className="font-display text-display-sm">Verified organization required</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Campaigns must be run under a verified organization. Create an organization and submit it for admin verification first.
            </p>
            <div className="flex gap-3 pt-2">
              <Button asChild><Link to="/organizations/new">Create organization</Link></Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // When editing, hydrate draftId once the campaign loads
  useEffect(() => {
    if (editingId && existing.data) setDraftId(existing.data.camp_id);
  }, [editingId, existing.data]);

  const stepIndex = steps.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className="bg-paper">
      {/* Sticky stepper */}
      <div className="border-b border-line bg-paper sticky top-16 z-30">
        <div className="container-edge py-5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-baseline gap-3">
              <span className="editorial-index">— Step {stepIndex + 1} of {steps.length}</span>
              <span className="font-display text-2xl">
                {steps[stepIndex]!.title}
                <span className="italic-display text-muted-foreground"> · </span>
                <span className="text-muted-foreground text-base font-sans">
                  {steps[stepIndex]!.caption}
                </span>
              </span>
            </div>
            <button
              onClick={() => navigate("/profile/campaigns")}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
            >
              Save & exit
            </button>
          </div>
          <ProgressBar value={progress} className="mt-4" />
        </div>
      </div>

      <div className="container-edge py-12 md:py-16 max-w-4xl">
        {step === "basics" && (
          <BasicsStep
            initial={existing.data}
            onSubmit={async (values) => {
              try {
                if (draftId) {
                  await update.mutateAsync(values);
                } else {
                  // we'll keep a placeholder goal until we hit the goal step
                  const created = await create.mutateAsync({
                    ...values,
                    goal_amount: 1,
                  });
                  setDraftId(created.camp_id);
                  navigate(`/create/${created.camp_id}`, { replace: true });
                }
                setStep("story");
              } catch (err) {
                toast.error(apiError(err));
              }
            }}
          />
        )}

        {step === "story" && (
          <StoryStep
            initial={existing.data}
            onBack={() => setStep("basics")}
            onSubmit={async (values) => {
              if (!draftId) return setStep("basics");
              try {
                await update.mutateAsync(values);
                setStep("goal");
              } catch (err) {
                toast.error(apiError(err));
              }
            }}
          />
        )}

        {step === "goal" && (
          <GoalStep
            initial={existing.data}
            onBack={() => setStep("story")}
            onSubmit={async (values) => {
              if (!draftId) return setStep("basics");
              try {
                await update.mutateAsync({
                  goal_amount: values.goal_amount,
                  completion_date: new Date(values.completion_date).toISOString(),
                });
                setStep("media");
              } catch (err) {
                toast.error(apiError(err));
              }
            }}
          />
        )}

        {step === "media" && draftId && (
          <MediaStep
            campId={draftId}
            initial={existing.data?.media ?? []}
            onBack={() => setStep("goal")}
            onNext={() => setStep("rewards")}
          />
        )}

        {step === "rewards" && draftId && (
          <RewardsStep
            campId={draftId}
            onBack={() => setStep("media")}
            onNext={() => setStep("documents")}
          />
        )}

        {step === "documents" && draftId && (
          <DocumentsStep
            campId={draftId}
            onBack={() => setStep("rewards")}
            onNext={() => setStep("review")}
          />
        )}

        {step === "review" && draftId && (
          <ReviewStep
            campId={draftId}
            onBack={() => setStep("documents")}
            onLaunch={async () => {
              if (existing.data?.status !== "draft") {
                toast.success("Changes saved.");
                navigate(`/campaigns/${draftId}`);
                return;
              }
              try {
                await submit.mutateAsync();
                toast.success("Submitted for review.");
                navigate(`/campaigns/${draftId}`);
              } catch (err) {
                toast.error(apiError(err));
              }
            }}
            launching={submit.isPending}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 1 — BASICS
// ─────────────────────────────────────────────────────────────────
function BasicsStep({
  initial,
  onSubmit,
}: {
  initial?: Campaign;
  onSubmit: (v: BasicsValues) => Promise<void>;
}) {
  const form = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    values: initial
      ? {
          title: initial.title ?? "",
          subtitle: initial.subtitle ?? "",
          category: initial.category ?? "",
          location: initial.location ?? "",
          company: initial.company ?? "",
        }
      : undefined,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
      <header>
        <div className="editorial-index">— 01 / 06</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Start with the <span className="italic-display">basics.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          A clear title and a sharp tagline. People decide in seconds.
        </p>
      </header>

      <div>
        <Label htmlFor="title">Project title</Label>
        <Input
          id="title"
          placeholder="The thing you want to make"
          className="text-2xl font-display h-14"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-destructive text-xs mt-2 italic">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle / one-liner</Label>
        <Input
          id="subtitle"
          placeholder="A single sentence that makes people lean in"
          {...form.register("subtitle")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(v) => form.setValue("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-destructive text-xs mt-2 italic">
              {form.formState.errors.category.message}
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
          {form.formState.errors.location && (
            <p className="text-destructive text-xs mt-2 italic">
              {form.formState.errors.location.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="company">Studio / company (optional)</Label>
        <Input
          id="company"
          placeholder="The name on the cover"
          {...form.register("company")}
        />
      </div>

      <div className="flex justify-end pt-6 border-t border-line">
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          Continue <ArrowRight />
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — STORY
// ─────────────────────────────────────────────────────────────────
function StoryStep({
  initial,
  onBack,
  onSubmit,
}: {
  initial?: Campaign;
  onBack: () => void;
  onSubmit: (v: StoryValues) => Promise<void>;
}) {
  const form = useForm<StoryValues>({
    resolver: zodResolver(storySchema),
    values: initial ? { description: initial.description ?? "" } : undefined,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
      <header>
        <div className="editorial-index">— 02 / 06</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Tell the <span className="italic-display">story.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          What is it? Who's it for? Why does it need to exist? Be specific.
        </p>
      </header>

      <div>
        <Label htmlFor="description">Project description</Label>
        <Textarea
          id="description"
          rows={14}
          placeholder="Open with a line they'll remember. Then the why. Then the how."
          className="font-serif text-lg leading-relaxed"
          style={{ fontFamily: '"Geist", sans-serif' }}
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-destructive text-xs mt-2 italic">
            {form.formState.errors.description.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Use blank lines to break paragraphs. Markdown coming soon.
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          Continue <ArrowRight />
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — GOAL
// ─────────────────────────────────────────────────────────────────
function GoalStep({
  initial,
  onBack,
  onSubmit,
}: {
  initial?: Campaign;
  onBack: () => void;
  onSubmit: (v: GoalValues) => Promise<void>;
}) {
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    values: initial
      ? {
          goal_amount: initial.goal_amount ?? 0,
          completion_date: initial.completion_date
            ? initial.completion_date.slice(0, 10)
            : "",
        }
      : undefined,
  });

  const goal = form.watch("goal_amount");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
      <header>
        <div className="editorial-index">— 03 / 06</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Set the <span className="italic-display">goal.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Be honest. Set what you actually need to ship the project well — and
          a deadline you can live with.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Label htmlFor="goal">Funding goal (₹)</Label>
          <Input
            id="goal"
            type="number"
            min={1}
            placeholder="50000"
            className="text-4xl font-display h-16 tnum"
            {...form.register("goal_amount", { valueAsNumber: true })}
          />
          {form.formState.errors.goal_amount && (
            <p className="text-destructive text-xs mt-2 italic">
              {form.formState.errors.goal_amount.message}
            </p>
          )}
          {goal > 0 && (
            <p className="text-xs text-muted-foreground mt-3 tnum">
              ≈ {formatMoney(goal)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            className="h-16 text-2xl font-display"
            {...form.register("completion_date")}
          />
          {form.formState.errors.completion_date && (
            <p className="text-destructive text-xs mt-2 italic">
              {form.formState.errors.completion_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="border border-line p-6 bg-muted/40 text-sm text-muted-foreground leading-relaxed">
        <strong className="text-ink">All-or-nothing.</strong> If you don't hit
        your goal by the deadline, no backer is charged. We think this is the
        only fair way to do it.
      </div>

      <div className="flex justify-between pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          Continue <ArrowRight />
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 — MEDIA
// ─────────────────────────────────────────────────────────────────
function MediaStep({
  campId,
  initial,
  onBack,
  onNext,
}: {
  campId: number;
  initial: string[];
  onBack: () => void;
  onNext: () => void;
}) {
  const [media, setMedia] = useState<string[]>(initial ?? []);
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [addingYt, setAddingYt] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateMedia = useUpdateCampaign(campId);

  async function persist(updated: string[]) {
    await updateMedia.mutateAsync({ media: updated });
    setMedia(updated);
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const all = await uploadCampaignMedia(campId, Array.from(files));
      setMedia(all);
      toast.success("Uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function addYouTube() {
    const ytId = getYouTubeId(ytUrl.trim());
    if (!ytId) { toast.error("Paste a valid YouTube URL."); return; }
    setAddingYt(true);
    try {
      await persist([...media, ytUrl.trim()]);
      setYtUrl("");
      toast.success("YouTube video added.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setAddingYt(false);
    }
  }

  async function remove(i: number) {
    try {
      await persist(media.filter((_, idx) => idx !== i));
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const updated = [...media];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(targetIndex, 0, moved!);
    setDragIndex(null);
    persist(updated).catch((err) => toast.error(apiError(err)));
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="editorial-index">— 04 / 06</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Show, don't <span className="italic-display">tell.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Upload images or short videos. The first one is your cover. Drag to reorder.
        </p>
      </header>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="border border-dashed border-line hover:border-ink p-12 w-full grid place-items-center transition-colors group"
      >
        <Upload className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <div className="mt-4 font-display text-2xl">
          {uploading ? "Uploading…" : "Drop or browse"}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG, or MP4. Up to 10 files per campaign.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          hidden
          multiple
          onChange={(e) => onFiles(e.target.files)}
        />
      </button>

      <div className="border border-dashed border-line p-6">
        <div className="flex items-center gap-3 mb-4">
          <Youtube className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="font-display text-lg">Embed a YouTube video</span>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="https://youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addYouTube}
            disabled={addingYt || !ytUrl}
          >
            {addingYt ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((url, i) => {
            const ytId = getYouTubeId(url);
            const isVid = isVideoUrl(url);
            return (
              <div
                key={url}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                onDragEnd={() => setDragIndex(null)}
                className={`aspect-[4/3] bg-muted relative overflow-hidden cursor-grab group ${
                  dragIndex === i ? "opacity-40" : ""
                }`}
              >
                {ytId ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover pointer-events-none"
                  />
                ) : isVid ? (
                  <>
                    <video
                      src={url}
                      preload="metadata"
                      muted
                      playsInline
                      className="h-full w-full object-cover pointer-events-none"
                    />
                    <span className="absolute inset-0 grid place-items-center pointer-events-none">
                      <Play className="h-7 w-7 fill-white text-white drop-shadow" />
                    </span>
                  </>

                ) : (
                  <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
                )}
                {i === 0 && (
                  <span className="absolute top-2 left-2 bg-ink text-paper px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 bg-ink/80 text-paper p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="button" size="lg" onClick={onNext}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 5 — REWARDS
// ─────────────────────────────────────────────────────────────────
function RewardsStep({
  campId,
  onBack,
  onNext,
}: {
  campId: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const rewards = useRewards(campId);
  const add = useAddReward(campId);
  const [showForm, setShowForm] = useState(false);

  const form = useForm({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      title: "",
      description: "",
      min_amount: 25,
      max_backers: "" as unknown as number,
      estimated_delivery: "",
    },
  });

  async function onSubmit(values: z.infer<typeof rewardSchema>) {
    try {
      await add.mutateAsync({
        title: values.title,
        description: values.description || null,
        min_amount: values.min_amount,
        max_backers:
          typeof values.max_backers === "number" && values.max_backers > 0
            ? values.max_backers
            : null,
        estimated_delivery: values.estimated_delivery
          ? new Date(values.estimated_delivery).toISOString()
          : null,
      });
      form.reset({
        title: "",
        description: "",
        min_amount: 25,
        max_backers: "" as unknown as number,
        estimated_delivery: "",
      });
      setShowForm(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="editorial-index">— 05 / 06</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Pick the <span className="italic-display">tiers.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Reward tiers give backers something concrete in exchange for their
          pledge. Three to six is usually right.
        </p>
      </header>

      {rewards.data && rewards.data.length > 0 && (
        <ul className="border-y border-line divide-y divide-line">
          {rewards.data.map((r, i) => (
            <li key={r.reward_id} className="py-5 grid grid-cols-12 gap-4 items-baseline">
              <span className="col-span-1 editorial-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-7">
                <div className="font-display text-xl">{r.title}</div>
                {r.description && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {r.description}
                  </div>
                )}
              </div>
              <div className="col-span-2 font-display text-xl tnum">
                {formatMoney(r.min_amount)}+
              </div>
              <div className="col-span-2 text-right text-xs text-muted-foreground tnum">
                {r.max_backers ? `${r.current_backers}/${r.max_backers}` : "Unlimited"}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus /> Add reward tier
        </Button>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border border-ink p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="font-display text-2xl">New tier</div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-ink"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div>
            <Label htmlFor="r-title">Title</Label>
            <Input id="r-title" {...form.register("title")} />
          </div>
          <div>
            <Label htmlFor="r-desc">Description</Label>
            <Textarea id="r-desc" rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="r-min">Min pledge (₹)</Label>
              <Input
                id="r-min"
                type="number"
                min={1}
                {...form.register("min_amount", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="r-max">Max backers</Label>
              <Input
                id="r-max"
                type="number"
                min={1}
                placeholder="Unlimited"
                {...form.register("max_backers", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="r-eta">Est. delivery</Label>
              <Input id="r-eta" type="date" {...form.register("estimated_delivery")} />
            </div>
          </div>
          <div className="flex justify-end pt-3 border-t border-line">
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add tier"}
            </Button>
          </div>
        </form>
      )}

      <div className="flex justify-between pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="button" size="lg" onClick={onNext}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 6 — DOCUMENTS
// ─────────────────────────────────────────────────────────────────
function DocumentsStep({
  campId,
  onBack,
  onNext,
}: {
  campId: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const camp = useCampaign(campId);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<string[]>(() => camp.data?.documents ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync once campaign data loads
  useEffect(() => {
    if (camp.data?.documents) setDocs(camp.data.documents);
  }, [camp.data?.documents]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const all = await uploadCampaignDocuments(campId, Array.from(files));
      setDocs(all);
      toast.success("Documents uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="editorial-index">— 06 / 07</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          Supporting <span className="italic-display">documents.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Upload any legal, project, or identity documents for the review team. These are
          private and never shown publicly. You can skip this and add them later.
        </p>
      </header>

      <div
        className="border-2 border-dashed border-line rounded-xl p-10 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-ink transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div>
          <div className="font-semibold">Click or drag files here</div>
          <div className="text-sm text-muted-foreground mt-1">
            PDF, images, or any file up to 25 MB &mdash; max 10 documents
          </div>
        </div>
        {uploading && <div className="text-sm text-muted-foreground">Uploading…</div>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {docs.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded ({docs.length})
          </div>
          {docs.map((url, i) => {
            const name = decodeURIComponent(url.split("/").pop() ?? `File ${i + 1}`);
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-line">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{name}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline shrink-0"
                >
                  View
                </a>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="button" size="lg" onClick={onNext}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 7 — REVIEW & SUBMIT
// ─────────────────────────────────────────────────────────────────
function ReviewStep({
  campId,
  onBack,
  onLaunch,
  launching,
}: {
  campId: number;
  onBack: () => void;
  onLaunch: () => void;
  launching: boolean;
}) {
  const camp = useCampaign(campId);
  const rewards = useRewards(campId);

  const completeness = useMemo(() => {
    const c = camp.data;
    if (!c) return 0;
    let score = 0;
    const checks = [
      !!c.title,
      !!c.subtitle,
      !!c.category,
      !!c.location,
      !!c.description && c.description.length > 80,
      c.goal_amount > 1,
      !!c.completion_date,
      !!c.media && c.media.length > 0,
      !!rewards.data && rewards.data.length > 0,
    ];
    checks.forEach((ok) => ok && score++);
    return Math.round((score / checks.length) * 100);
  }, [camp.data, rewards.data]);

  if (!camp.data) {
    return <p className="text-muted-foreground">Loading review…</p>;
  }

  const c = camp.data;

  return (
    <div className="space-y-10">
      <header>
        <div className="editorial-index">— 07 / 07</div>
        <h2 className="font-display text-display-md mt-3 leading-[1.02] text-balance">
          One last <span className="italic-display">look.</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          When you launch, the campaign goes live. You can keep editing until
          you launch.
        </p>
      </header>

      <div className="border border-line p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="editorial-index">— Readiness</div>
            <div className="font-display text-5xl mt-2 tnum">{completeness}%</div>
          </div>
          <div className="text-right text-xs text-muted-foreground max-w-[14rem]">
            Campaigns that launch above 80% complete tend to do better.
          </div>
        </div>
        <ProgressBar value={completeness} className="mt-5" />
      </div>

      <dl className="border-y border-line divide-y divide-line">
        <ReviewRow label="Title" value={c.title} />
        <ReviewRow label="Subtitle" value={c.subtitle ?? "—"} />
        <ReviewRow label="Category" value={c.category ?? "—"} />
        <ReviewRow label="Location" value={c.location ?? "—"} />
        <ReviewRow
          label="Goal"
          value={`${formatMoney(c.goal_amount)} by ${
            c.completion_date
              ? new Date(c.completion_date).toLocaleDateString()
              : "—"
          }`}
        />
        <ReviewRow
          label="Currently raised"
          value={`${formatMoney(c.current_amount)} · ${pct(
            c.current_amount,
            c.goal_amount,
          )}%`}
        />
        <ReviewRow label="Media" value={`${c.media?.length ?? 0} item(s)`} />
        <ReviewRow
          label="Rewards"
          value={`${rewards.data?.length ?? 0} tier(s)`}
        />
      </dl>

      <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 pt-6 border-t border-line">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="button" size="lg" onClick={onLaunch} disabled={launching}>
          {c.status === "draft" ? (
            <>{launching ? "Submitting…" : <><SendHorizonal /> Send for review</>}</>
          ) : c.status === "pending_review" ? (
            "Awaiting review"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-12 py-4 gap-4">
      <dt className="col-span-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground self-center">
        {label}
      </dt>
      <dd className="col-span-8 text-pretty">{value}</dd>
    </div>
  );
}
