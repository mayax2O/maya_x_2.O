import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * Primitive Button implementing the variants defined in the MAYA_X_2.0
 * Design System (§7 Buttons). Presentational only: it renders styling and
 * forwards native button behavior — it has no knowledge of booking,
 * membership, or any other domain concept.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brass-deep text-white hover:bg-brass",
  secondary:
    "bg-transparent text-ink border border-slate/30 hover:border-slate",
  ghost: "bg-transparent text-brass-deep hover:bg-brass-tint",
  danger: "bg-danger text-white hover:brightness-110",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "px-5 py-2.5 text-[14.5px]",
  sm: "px-3.5 py-1.5 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "default", className, children, ...rest },
    ref,
  ) => {
    const classes = [
      "inline-flex items-center gap-2 rounded-md font-semibold font-body transition",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep",
      "disabled:opacity-45 disabled:cursor-not-allowed",
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
