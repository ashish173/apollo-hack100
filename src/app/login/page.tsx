"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/'); // User is already logged in, redirect to home/dashboard
    }
  }, [user, authLoading, router]);

  const handleSignIn = async () => {
    if (selectedRole) {
      await signInWithGoogle(selectedRole);
    }
  };

  if (authLoading || (!authLoading && user)) {
    // Show loader if auth is loading or if user exists (and redirection is in progress)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <p> Loading ... </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome to Apollo</CardTitle>
          <p className="text-sm text-muted-foreground pb-2">Your platform for managing and collaborating on educational projects.</p>
          <CardDescription className="text-muted-foreground pt-2">
            Please select your role and Sign In.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="role-selection" className="text-lg font-semibold mb-3 block">Select Your Role:</Label>
            <RadioGroup
              id="role-selection"
              defaultValue="teacher"
              onValueChange={(value: UserRole) => setSelectedRole(value)}
              className="flex space-x-6 justify-center" // Increased spacing
            >
              <div className="flex flex-col items-center space-y-1"> {/* Modified for vertical alignment of label and description */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="role-teacher" />
                  <Label htmlFor="role-teacher" className="text-md cursor-pointer">Teacher</Label>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Manage projects, assign tasks, and track student progress.</p>
              </div>
              <div className="flex flex-col items-center space-y-1"> {/* Modified for vertical alignment of label and description */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student" className="text-md cursor-pointer">Student</Label>
                </div>
                <p className="text-xs text-muted-foreground pt-1">View assigned projects, submit your work, and collaborate.</p>
              </div>
            </RadioGroup>
          </div>
          <Button 
            onClick={handleSignIn} 
            disabled={authLoading}
            className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-transform transform hover:scale-105"
            aria-label="Login with Google"
          >
            {authLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                Login with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
