
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth(); // Correctly destructure: role is part of user object
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for auth state (including role fetching) to resolve
    }

    if (!user) {
      router.replace('/login');
    } else {
      const userRole = user.role; // Access role from the user object
      if (userRole === 'teacher') {
        router.replace('/teacher/dashboard');
      } else if (userRole === 'student') {
        router.replace('/student/dashboard');
      } else { // any other role or undefined
        console.log("Role:", userRole, "User details:", user, "Redirecting to login to re-authenticate.");
        router.replace('/login');
      }
    }
  }, [user, loading, router]); // user.role changes will trigger this effect because 'user' object changes

  // Show loading spinner while waiting for redirection logic to complete
  // This covers the brief period where loading is false but redirection hasn't happened yet.
  return (
    <div className="flex-grow flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}

