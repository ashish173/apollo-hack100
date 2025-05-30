"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LogoutButton from '@/components/auth/logout-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const { user, loading } = useAuth(); // Correctly destructure
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'teacher') { // Access role from user object
      console.log("redirectinggg..." ); 
      router.replace('/'); 
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role !== 'teacher') { // Check user and user.role
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <UserCircle size={48} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Teacher Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Welcome, {user.displayName || 'Teacher'}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">Manage Project Recommendations... and attendence automation.</p>
          <LogoutButton />
        </CardContent>
      </Card>
       <footer className="text-center p-4 mt-8 text-muted-foreground text-sm">
        Apollo App
      </footer>
    </div>
  );
}
