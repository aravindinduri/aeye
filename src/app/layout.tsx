
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Added

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AEYE - AI Public Safety Monitoring',
  description: 'Leverage AI for real-time incident detection, automated alerts, and enhanced security. AEYE provides proactive safety solutions for public and private spaces.',
  keywords: ['AI security', 'public safety', 'incident detection', 'video surveillance', 'AEYE'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider> {}
          {children}
          <Toaster />
        </AuthProvider> {}
      </body>
    </html>
  );
}
