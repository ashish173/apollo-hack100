
"use client";

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
     return (
      <div className="flex-grow flex items-center justify-center p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <p>Teacher Dashboard</p>
    </div>
  );
}
