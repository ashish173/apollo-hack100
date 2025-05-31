
"use client";

import { useAuth } from '@/context/auth-context';
import React from 'react';
import VisionApp from './attendance-manager';
import AttendanceExtractor from './attendance-extractor';
export default function AdminWorkPage() {
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
      <p>Admin Work Page</p>
      {/* <VisionApp /> */}
      <AttendanceExtractor />
    </div>
  );
}
