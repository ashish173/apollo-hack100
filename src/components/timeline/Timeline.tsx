import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  TimelineTask, 
  TimelineView,
  TaskDependency 
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
  isWithinInterval,
  isValid,
  parseISO
} from 'date-fns';
import TaskBar from './TaskBar';
import TimelineHeader from './TimelineHeader';
import TaskDetails from './TaskDetails';
import TimelineControls from './TimelineControls';
import DependencyArrow from './DependencyArrow';
import DependencyTooltip from './DependencyTooltip';

interface TimelineProps {
  tasks: TimelineTask[];
  dependencies?: TaskDependency[];
}

const Timeline: React.FC<TimelineProps> = ({ tasks, dependencies = [] }) => {
  // View state
  const [view, setView] = useState<TimelineView>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Refs for task elements to position dependency arrows
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dependency tooltip state
  const [tooltipState, setTooltipState] = useState<{
    dependency: TaskDependency;
    fromTask: TimelineTask;
    toTask: TimelineTask;
    position: { x: number; y: number };
  } | null>(null);

  // Validate and normalize task dates
  const normalizedTasks = useMemo(() => {
    return tasks.map(task => {
      let startDate = task.startDate;
      let endDate = task.endDate;

      // Handle string dates by parsing them
      if (typeof startDate === 'string') {
        startDate = parseISO(startDate);
      }
      if (typeof endDate === 'string') {
        endDate = parseISO(endDate);
      }

      // Validate dates and provide fallbacks
      if (!isValid(startDate)) {
        console.warn(`Invalid start date for task ${task.id}, using current date`);
        startDate = new Date();
      }
      if (!isValid(endDate)) {
        console.warn(`Invalid end date for task ${task.id}, using start date + 1 day`);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // Ensure end date is not before start date
      if (endDate < startDate) {
        console.warn(`End date before start date for task ${task.id}, adjusting end date`);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        ...task,
        startDate,
        endDate,
      };
    });
  }, [tasks]);

  // Validate dependencies
  const validDependencies = useMemo(() => {
    return dependencies.filter(dep => {
      const fromTask = normalizedTasks.find(t => t.id === dep.fromId);
      const toTask = normalizedTasks.find(t => t.id === dep.toId);
      
      if (!fromTask || !toTask) {
        console.warn(`Invalid dependency: task not found for ${dep.fromId} -> ${dep.toId}`);
        return false;
      }

      // Only filter out circular dependencies
      if (dep.fromId === dep.toId) {
        console.warn(`Circular dependency detected: ${dep.fromId} -> ${dep.toId}`);
        return false;
      }

      return true;
    });
  }, [dependencies, normalizedTasks]);

  // Only show critical dependency errors (like missing tasks)
  const dependencyErrors = useMemo(() => {
    const errors: string[] = [];
    
    dependencies.forEach(dep => {
      const fromTask = normalizedTasks.find(t => t.id === dep.fromId);
      const toTask = normalizedTasks.find(t => t.id === dep.toId);
      
      if (!fromTask) {
        errors.push(`Error: Source task "${dep.fromId}" not found`);
      }
      if (!toTask) {
        errors.push(`Error: Target task "${dep.toId}" not found`);
      }
      if (dep.fromId === dep.toId) {
        errors.push(`Error: Circular dependency detected for task "${dep.fromId}"`);
      }
    });
    
    return errors;
  }, [dependencies, normalizedTasks]);

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
    const filteredTasks = normalizedTasks.filter(task => {
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
  }, [view, currentDate, normalizedTasks]);

  // Calculate the total days in the timeline
  const totalDays = useMemo(() => {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // State for selected task
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Find the selected task
  const selectedTask = useMemo(() => {
    return normalizedTasks.find(task => task.id === selectedTaskId) || null;
  }, [normalizedTasks, selectedTaskId]);

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

  // Handle dependency arrow hover
  const handleDependencyHover = useCallback((
    dependency: TaskDependency,
    event: React.MouseEvent
  ) => {
    const fromTask = normalizedTasks.find(t => t.id === dependency.fromId);
    const toTask = normalizedTasks.find(t => t.id === dependency.toId);
    
    if (!fromTask || !toTask) return;

    setTooltipState({
      dependency,
      fromTask,
      toTask,
      position: { x: event.clientX, y: event.clientY },
    });
  }, [normalizedTasks]);

  // Handle tooltip close
  const handleTooltipClose = useCallback(() => {
    setTooltipState(null);
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
    setTooltipState(null);
  }, []);

  // Set task ref
  const setTaskRef = useCallback((taskId: string, element: HTMLDivElement | null) => {
    if (element) {
      taskRefs.current.set(taskId, element);
    } else {
      taskRefs.current.delete(taskId);
    }
  }, []);

  return (
    <div 
      className="w-full" 
      onClick={handleBackgroundClick}
      role="application"
      aria-label="Project timeline with task dependencies"
    >
      {/* Timeline Controls */}
      <TimelineControls
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        currentDate={currentDate}
      />
      
      {/* Dependency validation errors */}
      {dependencyErrors.length > 0 && (
        <div 
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Dependency Warnings:</h4>
          <ul className="text-sm text-yellow-700 space-y-1" role="list">
            {dependencyErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2" role="listitem">
                <span className="text-yellow-500 mt-0.5">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="w-full overflow-x-auto">
        <div 
          className="min-w-max relative" 
          ref={containerRef}
          role="grid"
          aria-label="Timeline tasks and dependencies"
          aria-rowcount={visibleTasks.length}
          aria-colcount={1}
        >
          {/* Timeline Header */}
          <TimelineHeader 
            startDate={startDate} 
            endDate={endDate} 
            view={view}
            aria-label="Timeline date headers"
          />
          
          {/* Timeline Rows */}
          <div className="mt-4 space-y-4">
            {visibleTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="relative h-12"
                role="gridcell"
                aria-rowindex={index + 1}
                aria-colindex={1}
                aria-selected={selectedTaskId === task.id}
                tabIndex={0}
              >
                <TaskBar 
                  ref={(el) => setTaskRef(task.id, el)}
                  task={task} 
                  getDatePosition={getDatePosition}
                  totalDays={totalDays}
                  isSelected={selectedTaskId === task.id}
                  onClick={handleTaskClick}
                  aria-label={`Task: ${task.title}, Status: ${task.status}, Progress: ${task.progress}%`}
                />
              </div>
            ))}
          </div>

          {/* Dependency Arrows */}
          {containerRef.current && validDependencies.map((dependency) => {
            const fromElement = taskRefs.current.get(dependency.fromId);
            const toElement = taskRefs.current.get(dependency.toId);
            const fromTask = normalizedTasks.find(t => t.id === dependency.fromId);
            const toTask = normalizedTasks.find(t => t.id === dependency.toId);

            if (!fromElement || !toElement || !fromTask || !toTask || !containerRef.current) {
              return null;
            }

            const containerRect = containerRef.current.getBoundingClientRect();
            const fromRect = fromElement.getBoundingClientRect();
            const toRect = toElement.getBoundingClientRect();

            return (
              <div
                key={`${dependency.fromId}-${dependency.toId}`}
                onMouseEnter={(e) => handleDependencyHover(dependency, e)}
                onMouseLeave={handleTooltipClose}
                className="absolute inset-0 pointer-events-auto"
                style={{ zIndex: 5 }}
                role="img"
                aria-label={`Dependency arrow from ${fromTask.title} to ${toTask.title}, type: ${dependency.type.replace('_', ' ')}`}
              >
                <DependencyArrow
                  dependency={dependency}
                  fromTask={fromTask}
                  toTask={toTask}
                  fromRect={fromRect}
                  toRect={toRect}
                  containerRect={containerRect}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetails 
          task={selectedTask} 
          onClose={() => setSelectedTaskId(null)}
          aria-label="Task details panel"
        />
      )}

      {/* Dependency Tooltip */}
      {tooltipState && (
        <DependencyTooltip
          dependency={tooltipState.dependency}
          fromTask={tooltipState.fromTask}
          toTask={tooltipState.toTask}
          position={tooltipState.position}
          onClose={handleTooltipClose}
          aria-label="Dependency relationship details"
        />
      )}
    </div>
  );
};

export default Timeline;
