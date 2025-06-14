'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Timeline from '@/components/timeline/Timeline';
import { TimelineTask } from '@/types/timeline';

// Mock data for the timeline
const MOCK_TASKS: TimelineTask[] = [
  {
    id: 'task-1',
    title: 'Project Kickoff',
    startDate: new Date(2025, 5, 1),
    endDate: new Date(2025, 5, 7),
    status: 'completed',
    progress: 100,
    description: 'Initial project setup and planning',
  },
  {
    id: 'task-2',
    title: 'Research Phase',
    startDate: new Date(2025, 5, 5),
    endDate: new Date(2025, 5, 14),
    status: 'in_progress',
    progress: 60,
    description: 'Conduct research and gather requirements',
  },
  {
    id: 'task-3',
    title: 'Design Mockups',
    startDate: new Date(2025, 5, 12),
    endDate: new Date(2025, 5, 21),
    status: 'in_progress',
    progress: 30,
    description: 'Create UI/UX mockups',
  },
  {
    id: 'task-4',
    title: 'Development',
    startDate: new Date(2025, 5, 19),
    endDate: new Date(2025, 6, 9),
    status: 'not_started',
    progress: 0,
    description: 'Implement features and functionality',
  },
  {
    id: 'task-5',
    title: 'Testing',
    startDate: new Date(2025, 6, 7),
    endDate: new Date(2025, 6, 16),
    status: 'not_started',
    progress: 0,
    description: 'Test and fix issues',
  },
  {
    id: 'task-6',
    title: 'Deployment',
    startDate: new Date(2025, 6, 17),
    endDate: new Date(2025, 6, 19),
    status: 'not_started',
    progress: 0,
    description: 'Deploy to production',
  },
];

export default function TimelinePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'student') {
      console.warn(`User ${user.uid} with role ${user.role} attempted to access student section. Redirecting.`);
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role !== 'student') {
    return (
      <div className="flex-grow flex items-center justify-center p-6 min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Project Timeline</h1>
        <p className="text-muted-foreground">Track your project progress and deadlines</p>
      </header>
      
      <div className="flex-grow bg-card rounded-lg border p-4">
        <Timeline tasks={MOCK_TASKS} />
      </div>
    </div>
  );
}
