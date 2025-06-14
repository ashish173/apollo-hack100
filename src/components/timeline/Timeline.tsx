import React, { useState, useCallback, useMemo } from 'react';
import { TimelineTask } from '@/types/timeline';
import TaskBar from './TaskBar';
import TimelineHeader from './TimelineHeader';
import TaskDetails from './TaskDetails';

interface TimelineProps {
  tasks: TimelineTask[];
}

const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
  // Calculate the date range for the timeline
  const startDate = useMemo(() => {
    return new Date(Math.min(...tasks.map(task => task.startDate.getTime())));
  }, [tasks]);

  const endDate = useMemo(() => {
    return new Date(Math.max(...tasks.map(task => task.endDate.getTime())));
  }, [tasks]);

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
    return (diffDays / totalDays) * 100;
  }, [startDate, totalDays]);

  // Handle task click
  const handleTaskClick = useCallback((taskId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTaskId(prevId => prevId === taskId ? null : taskId);
  }, []);

  // Handle click outside tasks
  const handleBackgroundClick = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return (
    <div className="w-full overflow-x-auto" onClick={handleBackgroundClick}>
      <div className="min-w-max">
        {/* Timeline Header */}
        <TimelineHeader startDate={startDate} endDate={endDate} />
        
        {/* Timeline Rows */}
        <div className="mt-8 space-y-4">
          {tasks.map((task) => (
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
