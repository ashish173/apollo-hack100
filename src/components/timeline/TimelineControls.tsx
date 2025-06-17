import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { TimelineView } from '@/types/timeline';

interface TimelineControlsProps {
  view: TimelineView;
  onViewChange: (view: TimelineView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  currentDate: Date;
}

const viewLabels: Record<TimelineView, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
};

const TimelineControls: React.FC<TimelineControlsProps> = ({
  view,
  onViewChange,
  onNavigate,
  currentDate,
}) => {
  const formatDateRange = (date: Date, view: TimelineView): string => {
    const start = new Date(date);
    const end = new Date(date);
    
    switch (view) {
      case 'week':
        start.setDate(date.getDate() - date.getDay());
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return '';
    }
  };

  return (
    <div 
      className="flex items-center justify-between mb-4"
      role="toolbar"
      aria-label="Timeline navigation and view controls"
    >
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="text-xs"
          aria-label="Navigate to today"
        >
          Today
        </Button>
        <div className="flex" role="group" aria-label="Timeline navigation">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('prev')}
            className="h-8 w-8"
            aria-label={`Go to previous ${view}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('next')}
            className="h-8 w-8"
            aria-label={`Go to next ${view}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div 
          className="ml-2 text-sm font-medium"
          role="status"
          aria-live="polite"
          aria-label="Current date range"
        >
          {formatDateRange(currentDate, view)}
        </div>
      </div>
      <div 
        className="flex space-x-1 bg-muted p-1 rounded-md"
        role="radiogroup"
        aria-label="Timeline view options"
      >
        {(Object.keys(viewLabels) as TimelineView[]).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'ghost'}
            size="sm"
            className={`text-xs h-8 px-3 ${view === v ? 'shadow-sm' : ''}`}
            onClick={() => onViewChange(v)}
            role="radio"
            aria-checked={view === v}
            aria-label={`Switch to ${viewLabels[v]} view`}
          >
            {viewLabels[v]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimelineControls;
