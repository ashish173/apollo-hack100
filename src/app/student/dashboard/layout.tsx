
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboard } from 'lucide-react';
import LogoutButton from '@/components/auth/logout-button';

export default function StudentDashboardLayout({
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
    } else if (user.role !== 'student') {
      console.warn(`User ${user.uid} with role ${user.role} attempted to access student section. Redirecting.`);
      router.replace('/'); 
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role !== 'student') {
    return (
      <div className="flex-grow flex items-center justify-center p-6 min-h-screen bg-background">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background max-w-[1600px] w-full mx-auto px-6">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-sidebar-border">
            <Link href="/student/dashboard" className="flex items-center gap-2 group-data-[state=collapsed]:hidden overflow-hidden">
              {/* EduConnect SVG Logo */}
              <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-sidebar-primary flex-shrink-0">
                <rect x="20" y="20" width="50" height="50" rx="10" ry="10" fill="currentColor" />
                <rect x="40" y="40" width="50" height="50" rx="10" ry="10" fill="currentColor" opacity="0.7" />
              </svg>
              <span className="text-xl font-semibold text-sidebar-foreground whitespace-nowrap">EduConnect</span>
            </Link>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="gap-2 p-2">
              <SidebarMenuItem>
                <Link href="/student/dashboard" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/student/dashboard' || pathname.startsWith('/student/dashboard/project')} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
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
            EduConnect App &copy; {new Date().getFullYear()}
            {/* <div className="mt-2">
              <LogoutButton /> // REMOVED from here
            </div> */}
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
