"use client";

import { useAuth } from '@/context/auth-context';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function LogoutButton() {
  const { signOutUser, loading } = useAuth();

  return (
    <SidebarMenuButton
      onClick={signOutUser}
      disabled={loading}
      // Use the default variant for the sidebar menu button
      variant="default"
      // The `tooltip` prop handles the text display when the sidebar is collapsed
      tooltip="Log Out"
      aria-label="Log out"
      // Apply w-full to make it span the available width within the sidebar footer
      className="w-full"
    >
      {loading ? (
        // Show a small spinner when loading
        <LoadingSpinner className="h-4 w-4" />
      ) : (
        // Show the LogOut icon
        <LogOut className="w-5 h-5" />
      )}
      {/* The text "Log Out" will only appear when the sidebar is expanded */}
      <span>Log Out</span>
    </SidebarMenuButton>
  );
}