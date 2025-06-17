import React from 'react';
import { TaskDependency, TimelineTask } from '@/types/timeline';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle
} from 'lucide-react';

interface DependencyTooltipProps {
  dependency: TaskDependency;
  fromTask: TimelineTask;
  toTask: TimelineTask;
  position: { x: number; y: number };
  onClose: () => void;
}

const DependencyTooltip: React.FC<DependencyTooltipProps> = ({
  dependency,
  fromTask,
  toTask,
  position,
  onClose,
}) => {
  // Get dependency type information
  const getDependencyInfo = (type: TaskDependency['type']) => {
    switch (type) {
      case 'finish_to_start':
        return {
          icon: ArrowRight,
          label: 'Finish to Start',
          description: 'Task must finish before the next can start',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'start_to_start':
        return {
          icon: ArrowDown,
          label: 'Start to Start',
          description: 'Both tasks must start at the same time',
          color: 'text-green-600 bg-green-50 border-green-200',
        };
      case 'finish_to_finish':
        return {
          icon: ArrowUp,
          label: 'Finish to Finish',
          description: 'Both tasks must finish at the same time',
          color: 'text-orange-600 bg-orange-50 border-orange-200',
        };
      case 'start_to_finish':
        return {
          icon: ArrowLeft,
          label: 'Start to Finish',
          description: 'Task cannot finish until the other starts',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
        };
      default:
        return {
          icon: ArrowRight,
          label: 'Unknown',
          description: 'Unknown dependency type',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  };

  // Get status icon and color
  const getStatusInfo = (status: TimelineTask['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Completed' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-600', label: 'In Progress' };
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', label: 'Overdue' };
      case 'not_started':
        return { icon: Circle, color: 'text-gray-600', label: 'Not Started' };
      default:
        return { icon: Circle, color: 'text-gray-600', label: 'Unknown' };
    }
  };

  // Format date safely
  const formatDate = (date: Date) => {
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    return format(date, 'MMM dd, yyyy');
  };

  const dependencyInfo = getDependencyInfo(dependency.type);
  const fromStatusInfo = getStatusInfo(fromTask.status);
  const toStatusInfo = getStatusInfo(toTask.status);
  const DependencyIcon = dependencyInfo.icon;
  const FromStatusIcon = fromStatusInfo.icon;
  const ToStatusIcon = toStatusInfo.icon;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close tooltip"
      >
        ×
      </button>

      {/* Dependency type header */}
      <div className={cn('flex items-center gap-2 p-2 rounded-md mb-3', dependencyInfo.color)}>
        <DependencyIcon className="w-4 h-4" />
        <div>
          <div className="font-medium text-sm">{dependencyInfo.label}</div>
          <div className="text-xs opacity-80">{dependencyInfo.description}</div>
        </div>
      </div>

      {/* Task information */}
      <div className="space-y-3">
        {/* From task */}
        <div className="border-l-4 border-gray-200 pl-3">
          <div className="flex items-center gap-2 mb-1">
            <FromStatusIcon className={cn('w-4 h-4', fromStatusInfo.color)} />
            <span className="font-medium text-sm">From: {fromTask.title}</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Status: {fromStatusInfo.label}</div>
            <div>Progress: {fromTask.progress}%</div>
            <div>Start: {formatDate(fromTask.startDate)}</div>
            <div>End: {formatDate(fromTask.endDate)}</div>
          </div>
        </div>

        {/* To task */}
        <div className="border-l-4 border-blue-200 pl-3">
          <div className="flex items-center gap-2 mb-1">
            <ToStatusIcon className={cn('w-4 h-4', toStatusInfo.color)} />
            <span className="font-medium text-sm">To: {toTask.title}</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Status: {toStatusInfo.label}</div>
            <div>Progress: {toTask.progress}%</div>
            <div>Start: {formatDate(toTask.startDate)}</div>
            <div>End: {formatDate(toTask.endDate)}</div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600 mb-1">Overall Progress</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fromTask.progress, toTask.progress)}%` }}
            />
          </div>
          <span className="text-xs font-medium">
            {Math.min(fromTask.progress, toTask.progress)}%
          </span>
        </div>
      </div>

      {/* Arrow pointer */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 -mt-px"></div>
      </div>
    </div>
  );
};

export default DependencyTooltip;
