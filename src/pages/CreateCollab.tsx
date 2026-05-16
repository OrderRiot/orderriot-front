import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateCollab, useMyIdeas, useMyCampaigns, useMe, useMyOrganizations } from "@/lib/queries";
import { apiError } from "@/lib/api";
import { PRESET_SKILLS } from "./CollabBoard";
import type { CollabCallType, CollabPostCreatePayload, CollabPostType } from "@/lib/types";

const CALL_TYPE_OPTIONS: { value: CollabCallType; label: string; hint: string }[] = [
  {
    value: "open",
    label: "Open call",
    hint: "Anyone can reach out with a message",
  },
  {
    value: "outreach",
    label: "I'll reach out",
    hint: "You're looking for specific people; they can't send unsolicited messages",
  },
  {
    value: "both",
    label: "Both",
    hint: "Open to messages and also actively looking yourself",
  },
];

const SUPPORT_SUGGESTIONS = ["Paid", "Revenue share", "Barter", "Equity", "Volunteer", "Credit only"];

export default function CreateCollab() {
  const navigate = useNavigate();
  const me = useMe();
  const createCollab = useCreateCollab();
  const myIdeas = useMyIdeas();
  const myCampaigns = useMyCampaigns();
  const myOrgs = useMyOrganizations();

  const verifiedOrgs = myOrgs.data?.filter((o) => o.status === "verified") ?? [];

  const [postType, setPostType] = useState<CollabPostType>("request");
  const [orgId, setOrgId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [callType, setCallType] = useState<CollabCallType>("open");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [supportType, setSupportType] = useState("");
  const [ideaId, setIdeaId] = useState<number | "">("");
  const [campaignId, setCampaignId] = useState<number | "">("");

  if (me.data && !me.data.isverified) {
    return (
      <div className="container-edge py-20 max-w-xl text-center">
        <div className="italic-display text-2xl mb-4">Verification required.</div>
        <p className="text-muted-foreground text-sm mb-6">
          Complete identity verification to post collaborations.
        </p>
        <Button variant="outline" onClick={() => navigate("/profile")}>Go to profile</Button>
      </div>
    );
  }

  function toggleSkill(s: string) {
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustomSkill() {
    const s = customSkill.trim();
    if (!s || selectedSkills.includes(s)) return;
    setSelectedSkills((prev) => [...prev, s]);
    setCustomSkill("");
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    const payload: CollabPostCreatePayload = {
      post_type: postType,
      title: title.trim(),
      description: description || undefined,
      call_type: postType === "offer" ? "open" : callType,
      skills: selectedSkills.length ? selectedSkills : undefined,
      support_type: supportType || undefined,
      org_id: postType === "offer" && orgId !== "" ? Number(orgId) : undefined,
      idea_id: ideaId !== "" ? Number(ideaId) : undefined,
      campaign_id: campaignId !== "" ? Number(campaignId) : undefined,
    };
    try {
      const post = await createCollab.mutateAsync(payload);
      toast.success("Collaboration posted.");
      navigate(`/collabs/${post.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const publishedIdeas = myIdeas.data?.filter((i) => i.status === "published" || i.status === "converted") ?? [];
  const activeCampaigns = myCampaigns.data ?? [];

  return (
    <div className="container-edge py-16 md:py-20 max-w-2xl">
      <div className="mb-10">
        <div className="editorial-index">— New collaboration</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Post a <span className="italic-display">collab</span>.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm max-w-md">
          Let others know you're looking to work together. Keep it honest — the details are between you.
        </p>
      </div>

      <div className="space-y-8">
        {/* Post type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
            What kind of post is this?
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { value: "request" as CollabPostType, label: "Looking for someone", hint: "You need a collaborator or contributor" },
              { value: "offer" as CollabPostType, label: "Offering our services", hint: "Your verified org is open to working with others" },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPostType(opt.value)}
                className={`border p-4 text-left transition-colors ${
                  postType === opt.value ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                }`}
              >
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className={`text-xs mt-1 leading-snug ${postType === opt.value ? "text-paper/70" : "text-muted-foreground"}`}>
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Org selector — offer only */}
        {postType === "offer" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Which organization? <span className="text-destructive">*</span>
            </label>
            {verifiedOrgs.length === 0 ? (
              <div className="border border-line p-4 text-sm text-muted-foreground">
                You need a verified organization to post service offers.{" "}
                <a href="/organizations/new" className="text-accent hover:underline">Create one</a> and wait for verification.
              </div>
            ) : (
              <select
                className="border border-line px-3 py-2.5 text-sm bg-transparent w-full"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select organization…</option>
                {verifiedOrgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
            {postType === "offer" ? "What do you offer?" : "What are you looking for?"}{" "}
            <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full border border-line px-4 py-3 text-base bg-transparent focus:outline-none focus:border-ink"
            placeholder="e.g. Looking for a cinematographer for my documentary idea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
            More detail
          </label>
          <textarea
            className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-32"
            placeholder="What's the project about, what kind of support are you looking for, what would working together look like…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Call type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
            How do you want to connect?
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {CALL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCallType(opt.value)}
                className={`border p-4 text-left transition-colors ${
                  callType === opt.value
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink"
                }`}
              >
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className={`text-xs mt-1 leading-snug ${callType === opt.value ? "text-paper/70" : "text-muted-foreground"}`}>
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
            Skills / roles
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={`px-3 py-1.5 border text-sm transition-colors ${
                  selectedSkills.includes(s)
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted-foreground hover:border-ink hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Custom skill */}
          <div className="flex gap-2">
            <input
              className="border border-line px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-ink flex-1 max-w-xs"
              placeholder="Add a skill not listed…"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
            />
            <Button size="sm" variant="outline" onClick={addCustomSkill} disabled={!customSkill.trim()}>
              Add
            </Button>
          </div>
          {selectedSkills.filter((s) => !PRESET_SKILLS.includes(s)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSkills.filter((s) => !PRESET_SKILLS.includes(s)).map((s) => (
                <span key={s} className="flex items-center gap-1 border border-ink bg-ink text-paper px-3 py-1 text-sm">
                  {s}
                  <button onClick={() => toggleSkill(s)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Support type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
            Kind of support
            <span className="ml-2 font-normal text-muted-foreground normal-case">optional</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Just a label — the actual terms are between you and whoever you work with.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUPPORT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSupportType(supportType === s ? "" : s)}
                className={`px-3 py-1.5 border text-sm transition-colors ${
                  supportType === s
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted-foreground hover:border-ink hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            className="border border-line px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-ink w-full max-w-xs"
            placeholder="Or describe it yourself…"
            value={SUPPORT_SUGGESTIONS.includes(supportType) ? "" : supportType}
            onChange={(e) => setSupportType(e.target.value)}
          />
        </div>

        {/* Link to idea or campaign */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
            Link to a project
            <span className="ml-2 font-normal text-muted-foreground normal-case">optional</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {publishedIdeas.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Idea</div>
                <select
                  className="border border-line px-3 py-2 text-sm bg-transparent w-full"
                  value={ideaId}
                  onChange={(e) => { setIdeaId(e.target.value ? Number(e.target.value) : ""); setCampaignId(""); }}
                >
                  <option value="">None</option>
                  {publishedIdeas.map((i) => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
              </div>
            )}
            {activeCampaigns.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Campaign</div>
                <select
                  className="border border-line px-3 py-2 text-sm bg-transparent w-full"
                  value={campaignId}
                  onChange={(e) => { setCampaignId(e.target.value ? Number(e.target.value) : ""); setIdeaId(""); }}
                >
                  <option value="">None</option>
                  {activeCampaigns.map((c) => (
                    <option key={c.camp_id} value={c.camp_id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}
            {publishedIdeas.length === 0 && activeCampaigns.length === 0 && (
              <p className="text-xs text-muted-foreground col-span-2">
                You need a published idea or campaign to link to.
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-line">
          <Button onClick={handleSubmit} disabled={createCollab.isPending || !title.trim()}>
            {createCollab.isPending ? "Posting..." : "Post collaboration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
