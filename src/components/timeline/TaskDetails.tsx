import React from 'react';
import { TimelineTask } from '@/types/timeline';
import { cn } from '@/lib/utils';
import { Calendar, Clock, AlertCircle, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailsProps {
  task: TimelineTask | null;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  if (!task) return null;

  const statusIcons = {
    not_started: <Circle className="h-4 w-4 text-muted-foreground" />,
    in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    overdue: <AlertTriangle className="h-4 w-4 text-red-500" />,
  };

  const statusText = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  const statusColors = {
    not_started: 'bg-muted',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Task Details</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <span 
                className={cn(
                  'text-xs px-2 py-1 rounded-full flex items-center gap-1',
                  statusColors[task.status]
                )}
              >
                {statusIcons[task.status]}
                {statusText[task.status]}
              </span>
            </div>
            {task.description && (
              <p className="text-muted-foreground mt-2">{task.description}</p>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full',
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  task.status === 'overdue' ? 'bg-red-500' : 'bg-muted-foreground'
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm">{format(task.startDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm">{format(task.endDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span>{Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 px-6 py-3 flex justify-end gap-2 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
