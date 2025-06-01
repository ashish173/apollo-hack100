import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number; // pixel size
  className?: string; // for the container div, e.g., for positioning
  iconClassName?: string; // for the icon itself
}

export default function LoadingSpinner({ size = 48, className, iconClassName }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <Loader2 
        className={cn("animate-spin text-primary", iconClassName)} 
        style={{width: `${size}px`, height: `${size}px`}} 
        aria-label="Loading"
      />
    </div>
  );
}
