import React, { forwardRef } from 'react';
import { TimelineTask } from '@/types/timeline';
import { cn } from '@/lib/utils';

interface TaskBarProps {
  task: TimelineTask;
  getDatePosition: (date: Date) => number;
  totalDays: number;
  isSelected: boolean;
  onClick: (taskId: string, event: React.MouseEvent) => void;
  'aria-label'?: string;
}

const TaskBar = forwardRef<HTMLDivElement, TaskBarProps>(({ 
  task, 
  getDatePosition, 
  totalDays, 
  isSelected, 
  onClick,
  'aria-label': ariaLabel,
}, ref) => {
  const { id, title, startDate, endDate, status, progress } = task;
  
  const statusColors = {
    'not_started': 'bg-gray-300 border-gray-400',
    'in_progress': 'bg-blue-500 border-blue-600',
    'completed': 'bg-green-500 border-green-600',
    'overdue': 'bg-red-500 border-red-600',
  };
  
  const statusText = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'overdue': 'Overdue',
  };

  // Calculate position and width
  const left = getDatePosition(startDate);
  const right = 100 - getDatePosition(endDate);
  const width = 100 - left - right;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(id, e as any);
    }
  };

  return (
    <div ref={ref} className="relative h-full w-full">
      <div className="absolute left-0 top-0 w-48 pr-4 truncate">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{statusText[status]}</div>
      </div>
      <div className="absolute left-48 right-0 top-1/2 h-9 -translate-y-1/2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            'relative h-full rounded-full border-2 transition-all duration-200 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            statusColors[status],
            isSelected && 'ring-2 ring-primary ring-offset-2'
          )}
          style={{
            left: `${left}%`,
            width: `${width}%`,
          }}
          aria-label={ariaLabel || `${title}: ${statusText[status]}, ${progress}% complete`}
          aria-selected={isSelected}
          role="button"
          tabIndex={0}
          onClick={(e) => onClick(id, e)}
          onKeyDown={handleKeyDown}
        >
          {/* Progress indicator */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          
          {/* Task title on bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white truncate px-2">
              {progress > 0 && `${progress}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

TaskBar.displayName = 'TaskBar';

export default TaskBar;
