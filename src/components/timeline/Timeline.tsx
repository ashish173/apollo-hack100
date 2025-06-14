import React, { useState, useCallback, useMemo } from 'react';
import { 
  TimelineTask, 
  TimelineView 
} from '@/types/timeline';
import { 
  addWeeks, 
  addMonths, 
  addQuarters, 
  addYears, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  isWithinInterval 
} from 'date-fns';
import TaskBar from './TaskBar';
import TimelineHeader from './TimelineHeader';
import TaskDetails from './TaskDetails';
import TimelineControls from './TimelineControls';

interface TimelineProps {
  tasks: TimelineTask[];
}

const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
  // View state
  const [view, setView] = useState<TimelineView>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Calculate the visible date range based on current view and date
  const { startDate, endDate, visibleTasks } = useMemo(() => {
    let rangeStart: Date;
    let rangeEnd: Date;
    
    switch (view) {
      case 'week':
        rangeStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        rangeEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        break;
      case 'month':
        rangeStart = startOfMonth(currentDate);
        rangeEnd = endOfMonth(currentDate);
        break;
      case 'quarter':
        rangeStart = startOfQuarter(currentDate);
        rangeEnd = endOfQuarter(currentDate);
        break;
      case 'year':
        rangeStart = startOfYear(currentDate);
        rangeEnd = endOfYear(currentDate);
        break;
      default:
        rangeStart = startOfWeek(currentDate);
        rangeEnd = endOfWeek(currentDate);
    }
    
    // Filter tasks that are within or overlap with the current view
    const filteredTasks = tasks.filter(task => {
      return (
        isWithinInterval(task.startDate, { start: rangeStart, end: rangeEnd }) ||
        isWithinInterval(task.endDate, { start: rangeStart, end: rangeEnd }) ||
        (task.startDate <= rangeStart && task.endDate >= rangeEnd)
      );
    });
    
    return {
      startDate: rangeStart,
      endDate: rangeEnd,
      visibleTasks: filteredTasks,
    };
  }, [view, currentDate, tasks]);

  // Calculate the total days in the timeline
  const totalDays = useMemo(() => {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // State for selected task
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Find the selected task
  const selectedTask = useMemo(() => {
    return tasks.find(task => task.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Function to calculate the position of a date in the timeline
  const getDatePosition = useCallback((date: Date) => {
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (diffDays / totalDays) * 100));
  }, [startDate, totalDays]);

  // Handle task click
  const handleTaskClick = useCallback((taskId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTaskId(prevId => prevId === taskId ? null : taskId);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    
    setCurrentDate(prevDate => {
      switch (view) {
        case 'week':
          return direction === 'prev' ? addWeeks(prevDate, -1) : addWeeks(prevDate, 1);
        case 'month':
          return direction === 'prev' ? addMonths(prevDate, -1) : addMonths(prevDate, 1);
        case 'quarter':
          return direction === 'prev' ? addQuarters(prevDate, -1) : addQuarters(prevDate, 1);
        case 'year':
          return direction === 'prev' ? addYears(prevDate, -1) : addYears(prevDate, 1);
        default:
          return prevDate;
      }
    });
  }, [view]);

  // Handle view change
  const handleViewChange = useCallback((newView: TimelineView) => {
    setView(newView);
  }, []);

  // Handle click outside tasks
  const handleBackgroundClick = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return (
    <div className="w-full" onClick={handleBackgroundClick}>
      {/* Timeline Controls */}
      <TimelineControls
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        currentDate={currentDate}
      />
      
      <div className="w-full overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <TimelineHeader startDate={startDate} endDate={endDate} view={view} />
          
          {/* Timeline Rows */}
          <div className="mt-4 space-y-4">
            {visibleTasks.map((task) => (
              <div key={task.id} className="relative h-12">
                <TaskBar 
                  task={task} 
                  getDatePosition={getDatePosition}
                  totalDays={totalDays}
                  isSelected={selectedTaskId === task.id}
                  onClick={handleTaskClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetails 
          task={selectedTask} 
          onClose={() => setSelectedTaskId(null)} 
        />
      )}
    </div>
  );
};

export default Timeline;
