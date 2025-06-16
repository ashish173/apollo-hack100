// src/components/ui/loading-spinner.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin transition-all duration-200",
  {
    variants: {
      variant: {
        default: "text-blueberry-500 dark:text-blueberry-400",
        primary: "text-blueberry-600 dark:text-blueberry-400",
        secondary: "text-neutral-500 dark:text-neutral-400",
        success: "text-success-500 dark:text-success-400",
        warning: "text-warning-500 dark:text-warning-400",
        error: "text-error-500 dark:text-error-400",
        muted: "text-neutral-400 dark:text-neutral-500",
        white: "text-white",
        inherit: "text-current",
      },
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
        "2xl": "w-16 h-16",
        custom: "",
      },
      speed: {
        slow: "animate-spin-slow",
        default: "animate-spin",
        fast: "animate-spin-fast",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      speed: "default",
    },
  }
);

const containerVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      layout: {
        inline: "",
        centered: "w-full h-full min-h-[120px]",
        overlay: "absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50",
        fullscreen: "fixed inset-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm z-50",
      },
    },
    defaultVariants: {
      layout: "inline",
    },
  }
);

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants>, VariantProps<typeof containerVariants> {
  className?: string;
  iconClassName?: string;
  label?: string;
  description?: string;
  icon?: 'loader' | 'rotate' | 'refresh';
  size?: VariantProps<typeof spinnerVariants>['size'] | number;
  showLabel?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({
    className,
    iconClassName,
    variant,
    size,
    speed,
    layout,
    label = "Loading",
    description,
    icon = 'loader',
    showLabel = false,
    ...props
  }, ref) => {
    const IconComponent = {
      loader: Loader2,
      rotate: RotateCcw,
      refresh: RefreshCw,
    }[icon];

    const isCustomSize = typeof size === 'number';
    const spinnerSize = isCustomSize ? 'custom' : size;

    return (
      <div
        ref={ref}
        className={cn(containerVariants({ layout }), className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-3">
          <IconComponent
            className={cn(
              spinnerVariants({ variant, size: spinnerSize, speed }),
              iconClassName
            )}
            style={isCustomSize ? { width: `${size}px`, height: `${size}px` } : undefined}
            aria-label={label}
          />
          {(showLabel || description) && (
            <div className="text-center space-y-1">
              {showLabel && (
                <p className="subtitle text-neutral-700 dark:text-neutral-300">
                  {label}
                </p>
              )}
              {description && (
                <p className="body-text text-neutral-600 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

// Named export (as used in Apollo Design System)
export { LoadingSpinner };

// Also provide a default export for convenience
export default LoadingSpinner;