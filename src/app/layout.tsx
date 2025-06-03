import type {Metadata} from 'next';
import { useEffect } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { clarity } from "@microsoft/clarity";
import { AuthProvider } from '@/context/auth-context';
import Analytics from '@/components/analytics'; // Import Analytics component
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Apollo',
  description: 'Smart Teachers Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    clarity.init("rthng3a4s4");
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics /> {/* Add Analytics component */}
      </body>
    </html>
  );
}
