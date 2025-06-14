export type TimelineView = 'week' | 'month' | 'quarter' | 'year';

export interface TimelineTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  description?: string;
  projectId?: string;
}

export interface TaskDependency {
  fromId: string;
  toId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface TimelineControlsProps {
  view: TimelineView;
  onViewChange: (view: TimelineView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  currentDate: Date;
}
