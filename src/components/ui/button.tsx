import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-lime-300 text-zinc-950 hover:bg-lime-200 focus-visible:outline-lime-200",
  secondary:
    "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08] focus-visible:outline-white",
  ghost:
    "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:outline-white",
} as const;

export function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
