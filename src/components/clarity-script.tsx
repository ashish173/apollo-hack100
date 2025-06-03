"use client";

import { useEffect } from 'react';
import { clarity } from '@microsoft/clarity';

export default function ClarityScript() {
  useEffect(() => {
    clarity.init("rthng3a4s4");
  }, []);

  return null; // This component doesn't render anything visible
}
