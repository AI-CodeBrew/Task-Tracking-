import type { LabelColor } from "@/lib/types";

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  red: "bg-red-100 text-red-700 border-red-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
};

export const LABEL_DOT_CLASSES: Record<LabelColor, string> = {
  slate: "bg-slate-400",
  red: "bg-red-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};
