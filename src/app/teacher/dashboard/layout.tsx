
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Briefcase, PanelLeft } from 'lucide-react';
import LogoutButton from '@/components/auth/logout-button';

export default function TeacherDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, toggleSidebar } = useSidebar();

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
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {isMobile && (
        <div className="fixed top-0 left-0 z-50 p-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <PanelLeft className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      )}
      <div className="flex min-h-screen bg-background max-w-[1600px] mx-auto px-6">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="flex flex-row items-center justify-start md:justify-between px-4 py-3 border-b border-sidebar-border">
            <Link href="/teacher/dashboard" className="flex items-center gap-2 group-data-[state=collapsed]:hidden overflow-hidden">
              {/* Abstract SVG Logo for EduConnect */}
              <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-sidebar-primary flex-shrink-0">
                <rect x="20" y="20" width="50" height="50" rx="10" ry="10" fill="currentColor" />
                <rect x="40" y="40" width="50" height="50" rx="10" ry="10" fill="currentColor" opacity="0.7" />
              </svg>
              <span className="text-xl font-semibold text-sidebar-foreground whitespace-nowrap">Apollo</span>
            </Link>
            <div className="hidden md:flex items-center">
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="gap-2 p-2"> {/* Increased gap for more spacing */}
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

          {/* Moved LogoutButton inside SidebarFooter */}
          <SidebarFooter className="p-2"> {/* Add padding to SidebarFooter */}
            <LogoutButton className="w-full" /> {/* Make button full width */}
          </SidebarFooter>

        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col">
          <main className="flex-grow p-6"> 
            {children}
          </main>
          <footer className="text-center p-4 mt-auto text-muted-foreground text-sm border-t">
            Apollo {new Date().getFullYear()}
            {/* <div className="mt-2">
              <LogoutButton /> // REMOVED from here
            </div> */}
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}