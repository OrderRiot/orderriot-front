import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string, opts?: { compact?: boolean }) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "₹0";
  if (opts?.compact && n >= 1000) {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
      style: "currency",
      currency: "INR",
    }).format(n);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function pct(current: number | string, goal: number | string) {
  const c = Number(current);
  const g = Number(goal);
  if (!g) return 0;
  return Math.min(100, Math.round((c / g) * 100));
}

export function daysLeft(completion: string | null | undefined) {
  if (!completion) return null;
  const ms = new Date(completion).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function timeAgo(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.round(h / 24);
  if (d2 < 30) return `${d2}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name?: string | null) {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|avi)(\?.*)?$/i.test(url);
}

export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? (m[1] ?? null) : null;
}
