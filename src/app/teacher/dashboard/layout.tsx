
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Briefcase } from 'lucide-react';
import LogoutButton from '@/components/auth/logout-button';

export default function TeacherDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'teacher') {
      console.warn(`User ${user.uid} with role ${user.role} attempted to access teacher section. Redirecting.`);
      router.replace('/'); 
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role !== 'teacher') {
    return (
      <div className="flex-grow flex items-center justify-center p-6 min-h-screen bg-background">
        <p>Loading ...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="p-2 flex justify-center items-center h-14"> 
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/teacher/dashboard" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/teacher/dashboard'} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/teacher/dashboard/student-mentor" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/teacher/dashboard/student-mentor'} tooltip="Student Mentor">
                    <Users />
                    <span>Student Mentor</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/teacher/dashboard/admin-work" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/teacher/dashboard/admin-work'} tooltip="Admin Work">
                    <Briefcase />
                    <span>Admin Work</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col">
          <main className="flex-grow p-6"> 
            {children}
          </main>
          <footer className="text-center p-4 mt-auto text-muted-foreground text-sm border-t">
            Apollo 100x Hack &copy; 2025
            <div className="mt-2">
                <LogoutButton />
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
