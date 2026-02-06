import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const gradientIconVariants = cva(
  "flex items-center justify-center rounded-xl shadow-lg transition-transform",
  {
    variants: {
      gradient: {
        vybe: "bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan",
        purple: "bg-gradient-to-br from-purple-500 to-pink-500",
        blue: "bg-gradient-to-br from-blue-600 to-cyan-500",
        amber: "bg-gradient-to-br from-amber-500 to-yellow-500",
        emerald: "bg-gradient-to-br from-emerald-500 to-teal-500",
        sky: "bg-gradient-to-br from-sky-500 to-blue-600",
        indigo: "bg-gradient-to-br from-indigo-500 to-purple-500",
        pink: "bg-gradient-to-br from-pink-500 to-rose-500",
        orange: "bg-gradient-to-br from-orange-500 to-red-500",
        violet: "bg-gradient-to-br from-violet-500 to-purple-500",
        green: "bg-gradient-to-br from-green-500 to-emerald-500",
      },
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
      glow: {
        true: "shadow-glow",
        false: "",
      },
    },
    defaultVariants: {
      gradient: "vybe",
      size: "default",
      glow: false,
    },
  }
);

export interface GradientIconProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientIconVariants> {
  icon?: string;
}

const GradientIcon = forwardRef<HTMLDivElement, GradientIconProps>(
  ({ className, gradient, size, glow, icon, children, ...props }, ref) => {
    const iconSize = {
      sm: "text-lg",
      default: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
      "2xl": "text-4xl",
    }[size || "default"];

    return (
      <div
        ref={ref}
        className={cn(gradientIconVariants({ gradient, size, glow, className }))}
        {...props}
      >
        {icon ? (
          <span className={iconSize}>{icon}</span>
        ) : (
          <span className={cn("text-white", iconSize)}>{children}</span>
        )}
      </div>
    );
  }
);
GradientIcon.displayName = "GradientIcon";

export { GradientIcon, gradientIconVariants };
