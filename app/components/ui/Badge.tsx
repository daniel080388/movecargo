"use client";
import React from "react";

type Tone = "default" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export default function Badge({ tone = "default", className, ...props }: BadgeProps) {
  const toneCls =
    tone === "success"
      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      : tone === "warning"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
      : tone === "danger"
      ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700";
  return (
    <span className={["inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border", toneCls, className].filter(Boolean).join(" ")} {...props} />
  );
}
