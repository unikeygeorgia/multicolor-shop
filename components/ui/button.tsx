import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn-style button wired to the Multicolor design language.
 * Variants compose the ported `.btn` / `.btn-line` / `.btn-ghost`
 * classes so links and buttons share one styled source of truth.
 */
export const buttonVariants = cva("", {
  variants: {
    variant: {
      solid: "btn",
      line: "btn-line",
      ghost: "btn-ghost",
    },
    size: {
      default: "",
      lg: "lg",
      sm: "sm",
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
