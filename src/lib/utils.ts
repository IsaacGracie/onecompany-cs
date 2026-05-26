import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function getStatusBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    new: "default",
    serving: "default",
    need_confirm: "outline",
    quoted: "outline",
    won: "secondary",
    delivering: "secondary",
    delivered: "secondary",
    after_sales: "outline",
    completed: "secondary",
    lost: "destructive",
  };
  return map[status] || "default";
}

export function getLabelFromValue(
  items: readonly { value: string; label: string }[],
  value: string
) {
  return items.find((i) => i.value === value)?.label || value;
}

export function formatDate(dateStr: string | null | undefined, withTime?: boolean): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (!withTime) return date;
  return `${date} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
