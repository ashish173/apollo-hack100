
"use client";

import { useAuth } from '@/context/auth-context';
import { helloWorld } from '../../../../../functions/src';
import { functions } from "@/lib/firebase";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import React from 'react';
export default function AdminWorkPage() {
  const { user, loading } = useAuth();


  const helloWorld = httpsCallable<{}, { message: string }>(functions, 'helloWorld');


  const helloWorldFn = (async () => {
    try {
      const result = await helloWorld();
    } catch(err) {
      console.log("err", err);
    } finally {
    }
  });

  React.useEffect(() => {
    helloWorldFn();
  }, []);


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
    </div>
  );
}
