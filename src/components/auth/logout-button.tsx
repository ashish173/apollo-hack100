"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    const { signOutUser, loading } = useAuth();

  return (
    <Button 
      variant="outline" 
      onClick={signOutUser} 
      disabled={loading}
      className="shadow-sm hover:bg-accent/10"
      aria-label="Log out"
    >
      {loading ? <p>Loading...</p> : <LogOut className="w-5 h-5"/>}
      Log Out
    </Button>
  );
}
