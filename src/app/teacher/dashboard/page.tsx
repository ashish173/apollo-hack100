
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';

export default function TeacherDashboard() {

  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher/dashboard');
  }, [router]);
}
