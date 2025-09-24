"use client";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        "w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-md px-3 py-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
