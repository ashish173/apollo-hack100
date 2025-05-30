
"use client";

import { useAuth } from '@/context/auth-context';

export default function StudentMentorPage() {
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
      Student Mentor Page
    </div>
  );
}
