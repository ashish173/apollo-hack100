import React from 'react';
import { TimelineTask } from '@/types/timeline';
import { cn } from '@/lib/utils';

interface TaskBarProps {
  task: TimelineTask;
  getDatePosition: (date: Date) => number;
  totalDays: number;
  isSelected: boolean;
  onClick: (taskId: string, event: React.MouseEvent) => void;
}

const TaskBar: React.FC<TaskBarProps> = ({ 
  task, 
  getDatePosition, 
  totalDays, 
  isSelected,
  onClick 
}) => {
  const { title, startDate, endDate, status, progress } = task;
  
  // Calculate positions and width
  const left = getDatePosition(startDate);
  const right = 100 - getDatePosition(endDate);
  const width = 100 - left - right;
  
  // Handle task click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(task.id, e);
  };
  
  // Status colors
  const statusColors = {
    not_started: 'bg-muted',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    overdue: 'bg-destructive',
  };
  
  // Status text
  const statusText = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  return (
    <div className="relative h-full w-full">
      {/* Task label */}
      <div className="absolute left-0 top-0 w-48 pr-4 truncate">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{statusText[status]}</div>
      </div>
      
      {/* Timeline track */}
      <div className="absolute left-48 right-0 top-1/2 h-2 -translate-y-1/2 bg-muted rounded-full overflow-hidden">
        {/* Progress bar */}
        <div 
          className={cn(
            'h-full rounded-full',
            statusColors[status]
          )}
          style={{
            width: `${progress}%`,
            opacity: 0.8,
          }}
        />
        
        {/* Task bar */}
        <div 
          className={cn(
            'absolute top-0 h-full border-2 rounded-md',
            'transition-all duration-200',
            'flex items-center justify-end pr-1',
            isSelected 
              ? 'ring-2 ring-offset-1 ring-primary z-10 scale-[1.02] shadow-md'
              : 'border-foreground/20 hover:border-foreground/40',
            status === 'completed' && 'border-green-500/50',
            status === 'in_progress' && 'border-blue-500/50',
            status === 'overdue' && 'border-destructive/50',
          )}
          style={{
            left: `${left}%`,
            right: `${right}%`,
          }}
          onClick={handleClick}
          title={`${title} (${formatDateRange(startDate, endDate)})`}
        >
          {progress > 30 && (
            <span className="text-[10px] font-medium text-white mix-blend-difference">
              {progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format date range
function formatDateRange(start: Date, end: Date): string {
  const format = (date: Date) => date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  return `${format(start)} - ${format(end)}`;
}

export default TaskBar;
