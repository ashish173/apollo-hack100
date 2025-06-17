'use client';

import Timeline from '@/components/timeline/Timeline';
import { TimelineTask, TaskDependency } from '@/types/timeline';

// Mock data for the timeline
const MOCK_TASKS: TimelineTask[] = [
  {
    id: 'task-1',
    title: 'Project Kickoff',
    startDate: new Date(2025, 5, 1),
    endDate: new Date(2025, 5, 3),
    status: 'completed',
    progress: 100,
    description: 'Initial project setup and planning',
  },
  {
    id: 'task-2',
    title: 'Research Phase',
    startDate: new Date(2025, 5, 4),
    endDate: new Date(2025, 5, 10),
    status: 'completed',
    progress: 100,
    description: 'Conduct research and gather requirements',
  },
  {
    id: 'task-3',
    title: 'Design Mockups',
    startDate: new Date(2025, 5, 11),
    endDate: new Date(2025, 5, 17),
    status: 'in_progress',
    progress: 75,
    description: 'Create UI/UX mockups',
  },
  {
    id: 'task-4',
    title: 'Frontend Development',
    startDate: new Date(2025, 5, 18),
    endDate: new Date(2025, 6, 2),
    status: 'in_progress',
    progress: 30,
    description: 'Implement user interface components',
  },
  {
    id: 'task-5',
    title: 'Backend Development',
    startDate: new Date(2025, 5, 18),
    endDate: new Date(2025, 6, 5),
    status: 'not_started',
    progress: 0,
    description: 'Develop API and database functionality',
  },
  {
    id: 'task-6',
    title: 'Integration Testing',
    startDate: new Date(2025, 6, 6),
    endDate: new Date(2025, 6, 12),
    status: 'not_started',
    progress: 0,
    description: 'Test integrated system functionality',
  },
  {
    id: 'task-7',
    title: 'Deployment',
    startDate: new Date(2025, 6, 13),
    endDate: new Date(2025, 6, 15),
    status: 'not_started',
    progress: 0,
    description: 'Deploy to production environment',
  },
];

// Mock dependencies for realistic project workflow
const MOCK_DEPENDENCIES: TaskDependency[] = [
  // Sequential flow: Kickoff → Research → Design → Development
  {
    fromId: 'task-1',
    toId: 'task-2',
    type: 'finish_to_start',
  },
  {
    fromId: 'task-2',
    toId: 'task-3',
    type: 'finish_to_start',
  },
  {
    fromId: 'task-3',
    toId: 'task-4',
    type: 'finish_to_start',
  },
  // Parallel development: Frontend and Backend start together
  {
    fromId: 'task-4',
    toId: 'task-5',
    type: 'start_to_start',
  },
  // Integration testing waits for both development tracks
  {
    fromId: 'task-4',
    toId: 'task-6',
    type: 'finish_to_start',
  },
  {
    fromId: 'task-5',
    toId: 'task-6',
    type: 'finish_to_start',
  },
  // Deployment after testing
  {
    fromId: 'task-6',
    toId: 'task-7',
    type: 'finish_to_start',
  },
];

export default function TimelinePage() {
  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Project Timeline</h1>
        <p className="text-muted-foreground">Track your project progress and task dependencies</p>
      </header>
      
      <div className="flex-grow bg-card rounded-lg border p-4">
        <Timeline tasks={MOCK_TASKS} dependencies={MOCK_DEPENDENCIES} />
      </div>
    </div>
  );
}
