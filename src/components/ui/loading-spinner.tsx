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
        apollo: "text-white", // Special variant for Apollo logo
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

// Apollo Logo Component for Loading Spinner
const ApolloSpinnerLogo = ({ 
  size = "default", 
  className = "",
  animate = true 
}: { 
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "2xl";
  className?: string;
  animate?: boolean;
}) => {
  const sizeMap = {
    xs: { container: "w-6 h-6", svg: "16", text: "text-xs" },
    sm: { container: "w-8 h-8", svg: "20", text: "text-sm" },
    default: { container: "w-12 h-12", svg: "24", text: "text-base" },
    lg: { container: "w-16 h-16", svg: "32", text: "text-lg" },
    xl: { container: "w-20 h-20", svg: "40", text: "text-xl" },
    "2xl": { container: "w-24 h-24", svg: "48", text: "text-2xl" }
  };

  const sizeConfig = sizeMap[size];

  return (
    <div className={cn(
      `${sizeConfig.container} bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center shadow-lg`,
      animate && "animate-spin",
      className
    )}>
      <svg 
        width={sizeConfig.svg} 
        height={sizeConfig.svg} 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        className="text-white"
      >
        {/* Animated Apollo logo with pulsing effect */}
        <rect 
          x="15" 
          y="15" 
          width="40" 
          height="40" 
          rx="8" 
          ry="8" 
          fill="currentColor"
          className={animate ? "animate-pulse" : ""}
        />
        <rect 
          x="35" 
          y="35" 
          width="40" 
          height="40" 
          rx="8" 
          ry="8" 
          fill="currentColor" 
          opacity="0.7"
          className={animate ? "animate-pulse" : ""}
          style={animate ? { animationDelay: '0.2s' } : {}}
        />
      </svg>
    </div>
  );
};

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants>, VariantProps<typeof containerVariants> {
  className?: string;
  iconClassName?: string;
  label?: string;
  description?: string;
  icon?: 'loader' | 'rotate' | 'refresh' | 'apollo';
  size?: VariantProps<typeof spinnerVariants>['size'] | number;
  showLabel?: boolean;
  showBranding?: boolean; // Show "Apollo" text with logo
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
    showBranding = false,
    ...props
  }, ref) => {
    const IconComponent = {
      loader: Loader2,
      rotate: RotateCcw,
      refresh: RefreshCw,
      apollo: null, // Handled separately
    }[icon];

    const isCustomSize = typeof size === 'number';
    const spinnerSize = isCustomSize ? 'custom' : size;
    const isApolloIcon = icon === 'apollo';

    // For Apollo icon, use Apollo variant automatically
    const effectiveVariant = isApolloIcon ? 'apollo' : variant;

    return (
      <div
        ref={ref}
        className={cn(containerVariants({ layout }), className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon/Logo */}
          <div className="flex items-center gap-3">
            {isApolloIcon ? (
              <ApolloSpinnerLogo 
                size={spinnerSize as any}
                className={iconClassName}
                animate={speed !== undefined}
              />
            ) : IconComponent ? (
              <IconComponent
                className={cn(
                  spinnerVariants({ variant: effectiveVariant, size: spinnerSize, speed }),
                  iconClassName
                )}
                style={isCustomSize ? { width: `${size}px`, height: `${size}px` } : undefined}
                aria-label={label}
              />
            ) : null}
            
            {/* Optional Apollo Branding */}
            {isApolloIcon && showBranding && (
              <div className="text-center">
                <h3 className={cn(
                  "font-bold bg-gradient-to-r from-blueberry-600 to-blueberry-700 bg-clip-text text-transparent",
                  spinnerSize === 'xs' ? 'text-sm' : 
                  spinnerSize === 'sm' ? 'text-base' :
                  spinnerSize === 'lg' ? 'text-xl' :
                  spinnerSize === 'xl' ? 'text-2xl' :
                  spinnerSize === '2xl' ? 'text-3xl' : 'text-lg'
                )}>
                  Apollo
                </h3>
                <p className={cn(
                  "text-blueberry-600 dark:text-blueberry-400 font-medium tracking-wider uppercase",
                  spinnerSize === 'xs' ? 'text-xs' : 
                  spinnerSize === 'sm' ? 'text-xs' :
                  spinnerSize === 'lg' ? 'text-sm' :
                  spinnerSize === 'xl' ? 'text-base' :
                  spinnerSize === '2xl' ? 'text-lg' : 'text-xs'
                )}>
                  Education Platform
                </p>
              </div>
            )}
          </div>
          
          {/* Labels */}
          {(showLabel || description) && (
            <div className="text-center space-y-1">
              {showLabel && (
                <p className={cn(
                  "font-semibold text-neutral-700 dark:text-neutral-300",
                  spinnerSize === 'xs' ? 'text-xs' : 
                  spinnerSize === 'sm' ? 'text-sm' :
                  spinnerSize === 'lg' ? 'text-lg' :
                  spinnerSize === 'xl' ? 'text-xl' :
                  spinnerSize === '2xl' ? 'text-2xl' : 'text-base'
                )}>
                  {label}
                </p>
              )}
              {description && (
                <p className={cn(
                  "text-neutral-600 dark:text-neutral-400",
                  spinnerSize === 'xs' ? 'text-xs' : 
                  spinnerSize === 'sm' ? 'text-xs' :
                  spinnerSize === 'lg' ? 'text-base' :
                  spinnerSize === 'xl' ? 'text-lg' :
                  spinnerSize === '2xl' ? 'text-xl' : 'text-sm'
                )}>
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
export { LoadingSpinner, ApolloSpinnerLogo };

// Also provide a default export for convenience
export default LoadingSpinner;