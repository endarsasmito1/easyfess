import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  // Simple className merger (install clsx if needed, or use this inline approach)
  return inputs.filter(Boolean).join(" ");
}

export function formatCoin(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
