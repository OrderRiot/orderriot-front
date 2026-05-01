import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number; // 0-100
  className?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("relative h-1.5 w-full bg-muted overflow-hidden rounded-full", className)}>
      <div
        className="absolute inset-y-0 left-0 bg-accent rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
