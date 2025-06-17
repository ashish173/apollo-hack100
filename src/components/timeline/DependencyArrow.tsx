import React from 'react';
import { TaskDependency, TimelineTask } from '@/types/timeline';
import { cn } from '@/lib/utils';

interface DependencyArrowProps {
  dependency: TaskDependency;
  fromTask: TimelineTask;
  toTask: TimelineTask;
  fromRect: DOMRect;
  toRect: DOMRect;
  containerRect: DOMRect;
}

const DependencyArrow: React.FC<DependencyArrowProps> = ({
  dependency,
  fromTask,
  toTask,
  fromRect,
  toRect,
  containerRect,
}) => {
  // Calculate relative positions within the container
  const fromX = fromRect.left - containerRect.left;
  const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
  const toX = toRect.left - containerRect.left;
  const toY = toRect.top - containerRect.top + toRect.height / 2;

  // Determine connection points based on dependency type (Asana-style)
  let startX: number, startY: number, endX: number, endY: number;

  switch (dependency.type) {
    case 'finish_to_start':
      // Connect from end of first task to start of second task
      startX = fromX + fromRect.width;
      startY = fromY;
      endX = toX;
      endY = toY;
      break;
    case 'start_to_start':
      // Connect from start of first task to start of second task
      startX = fromX;
      startY = fromY;
      endX = toX;
      endY = toY;
      break;
    case 'finish_to_finish':
      // Connect from end of first task to end of second task
      startX = fromX + fromRect.width;
      startY = fromY;
      endX = toX + toRect.width;
      endY = toY;
      break;
    case 'start_to_finish':
      // Connect from start of first task to end of second task
      startX = fromX;
      startY = fromY;
      endX = toX + toRect.width;
      endY = toY;
      break;
    default:
      startX = fromX + fromRect.width;
      startY = fromY;
      endX = toX;
      endY = toY;
  }

  // Create Asana-style wavy path with meaningful curves
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Control points for smooth, meaningful curves
  const controlOffset = Math.min(Math.max(Math.abs(deltaX) * 0.4, 20), 60);
  const verticalOffset = deltaY !== 0 ? Math.sign(deltaY) * Math.min(Math.abs(deltaY) * 0.3, 20) : 0;
  
  // Create a smooth S-curve that flows naturally between tasks
  const pathData = `
    M ${startX} ${startY}
    C ${startX + controlOffset} ${startY + verticalOffset},
      ${endX - controlOffset} ${endY - verticalOffset},
      ${endX} ${endY}
  `;

  // Color and style based on dependency type (Asana-inspired)
  const getDependencyStyle = (type: TaskDependency['type']) => {
    switch (type) {
      case 'finish_to_start':
        return {
          stroke: '#4F46E5', // Indigo for primary flow
          strokeWidth: 2,
          strokeDasharray: undefined,
          opacity: 0.8,
        };
      case 'start_to_start':
        return {
          stroke: '#059669', // Emerald for parallel start
          strokeWidth: 2,
          strokeDasharray: '4,4',
          opacity: 0.7,
        };
      case 'finish_to_finish':
        return {
          stroke: '#DC2626', // Red for synchronized finish
          strokeWidth: 2,
          strokeDasharray: '6,2',
          opacity: 0.7,
        };
      case 'start_to_finish':
        return {
          stroke: '#7C3AED', // Purple for reverse dependency
          strokeWidth: 2,
          strokeDasharray: '2,3,2,3',
          opacity: 0.6,
        };
      default:
        return {
          stroke: '#6B7280', // Gray for unknown
          strokeWidth: 1,
          strokeDasharray: undefined,
          opacity: 0.5,
        };
    }
  };

  const style = getDependencyStyle(dependency.type);
  const markerId = `arrow-${dependency.fromId}-${dependency.toId}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerRect.width,
        height: containerRect.height,
        zIndex: 10,
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,0 0,6 6,3"
            fill={style.stroke}
            opacity={style.opacity}
          />
        </marker>
        
        {/* Add a subtle glow effect for better visibility */}
        <filter id={`glow-${dependency.fromId}-${dependency.toId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background line for better visibility */}
      <path
        d={pathData}
        fill="none"
        stroke="white"
        strokeWidth={style.strokeWidth + 2}
        opacity={0.8}
      />
      
      {/* Main dependency line */}
      <path
        d={pathData}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={style.opacity}
        markerEnd={`url(#${markerId})`}
        filter={`url(#glow-${dependency.fromId}-${dependency.toId})`}
        className="transition-opacity duration-200 hover:opacity-100"
      />
    </svg>
  );
};

export default DependencyArrow;
