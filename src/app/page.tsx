"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LandingPage from './landing/page'; // Assuming this is already created

export default function HomePage() {
  const { user, loading } = useAuth(); // 'role' is part of the 'user' object if available
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Still loading auth state, do nothing yet.
      return;
    }

    if (user) {
      // User is authenticated
      const role = user.role; // Access role from the user object
      if (role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else if (role === 'student') {
        router.replace('/student/dashboard');
      } else {
        // Handle cases where role is not 'teacher' or 'student',
        // or if role is not defined on the user object yet.
        // For now, if user exists but role is unexpected,
        // we could redirect to a generic page or log,
        // but the prompt focuses on teacher/student.
        // If role is simply undefined but user exists, it might mean data is still loading
        // or there's an issue with role assignment.
        // For robustness, one might wait for role or redirect to login if role is invalid.
        // However, sticking to the prompt: if user is logged in and role isn't teacher/student,
        // they will not be redirected by this logic and will see the LandingPage or null.
        // This might be desired if there are other roles that should see the landing page,
        // or an oversight if all logged-in users must have a role and be redirected.
        // Given the context, it's safer to assume if user exists, a role-based redirect *should* happen.
        // If role is not one of the two, perhaps they should not be on a dashboard.
        // For now, let's assume if user exists and role is not teacher/student, they see landing page.
        // This can be refined based on more specific requirements for other roles.

        // User is authenticated but has an unexpected role.
        // Redirect to login or a generic error page, or let them stay if desired.
        // For now, consistent with redirecting unauth users to login:
        router.replace('/login'); 
      }
    } else {
      // User is not authenticated, and loading is false.
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Render logic:
  // 1. If loading, show a loading indicator (or null to prevent layout shift).
  // 2. If user is authenticated, redirection is likely happening via useEffect.
  //    Returning null or a loading indicator prevents flashing the LandingPage.
  // 3. If not loading and no user, show the LandingPage.

  if (loading || user) {
    // While loading, or if user is logged in (and useEffect is handling redirection),
    // return a minimal loader or null to avoid showing LandingPage content.
    // A full page loader might be better if the loading state is prolonged.
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p> {/* Or a proper spinner component */}
      </div>
    );
  }

  // If not loading and no user, show the Landing Page
  return <LandingPage />;
}

