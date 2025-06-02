import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
