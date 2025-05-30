
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LogoutButton from '@/components/auth/logout-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function StudentDashboard() {
  const { user, loading } = useAuth(); // Correctly destructure
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'student') { // Access role from user object
      console.log("redirectinggg..." );
      router.replace('/'); // Redirect to home, which will route appropriately
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role !== 'student') { // Check user and user.role
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
            <GraduationCap size={48} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Student Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Welcome, {user.displayName || 'Student'}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">Access your projects here.</p>
          <LogoutButton />
        </CardContent>
      </Card>
       <footer className="text-center p-4 mt-8 text-muted-foreground text-sm">
        Apollo App
      </footer>
    </div>
  );
}
