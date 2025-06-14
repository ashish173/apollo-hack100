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

export interface TimelineView {
  startDate: Date;
  endDate: Date;
  zoomLevel: 'day' | 'week' | 'month';
}

export interface TaskDependency {
  fromTaskId: string;
  toTaskId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}
