"use client";
import React from "react";
import Link from "next/link";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

function classes(variant: Variant, size: Size, extra?: string) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95"
      : variant === "outline"
      ? "border border-[var(--border)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
      : "text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"; // ghost
  const s = size === "sm" ? "h-8 px-3 text-sm" : size === "lg" ? "h-12 px-5 text-base" : "h-10 px-4 text-sm";
  return [base, v, s, extra].filter(Boolean).join(" ");
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={classes(variant, size, className)} {...props} />;
}

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ href, variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...(props as any)} />
  );
}

export default Button;
