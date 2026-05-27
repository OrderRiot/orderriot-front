import { Globe, Link2, Lock, FileText, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visibility } from "@/lib/types";

const OPTIONS: {
  value: Visibility;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "public",
    label: "Public",
    hint: "Visible to everyone, shows in feeds and search",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    value: "unlisted",
    label: "Link only",
    hint: "Not in feeds or search — accessible via direct URL",
    icon: <Link2 className="h-4 w-4" />,
  },
  {
    value: "private",
    label: "Private",
    hint: "Only you can see this",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "draft",
    label: "Draft",
    hint: "Work in progress — not published anywhere",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: "archived",
    label: "Archived",
    hint: "Retired — only visible to you",
    icon: <Archive className="h-4 w-4" />,
  },
];

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
  className?: string;
}

export function VisibilityPicker({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.hint}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition-colors",
              active
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
