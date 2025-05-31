
"use client";

import Link from 'next/link';
import { SidebarProvider, SidebarInset, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from '@/components/ui/sidebar';
import { UploadCloud, Video, Globe, Tv2, ShieldCheck, Mail } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect } from 'react'; // Added useEffect for auth bypass
// Removed useAuth and useRouter as login is bypassed for now

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Login bypass: Dashboard is directly accessible
  // const { user, loading } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/'); // Redirect to landing if not logged in
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) { // Removed !user condition for bypass
  // if (loading) { // Simplified for bypass, can show a loader or just children
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <p>Loading dashboard...</p>
  //     </div>
  //   );
  // }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" collapsible="icon" className="hidden md:flex">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <Image src="/aeye-logo.png" alt="AEYE Logo" width={32} height={32} />
            <span>AEYE</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>Analysis Modes</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={false} tooltip="Upload and analyze a video file">
                  <Link href="/dashboard?tab=upload">
                    <UploadCloud />
                    <span>Upload Video</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={false} tooltip="Analyze your live webcam feed">
                  <Link href="/dashboard?tab=live">
                    <Video />
                    <span>Live webcam</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={false} tooltip="Analyze an external video stream">
                  <Link href="/dashboard?tab=external">
                    <Globe />
                    <span>External Stream</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={false} tooltip="View public webcams">
                  <Link href="/dashboard?tab=publicWebcams">
                    <Tv2 />
                    <span>Public Webcams</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false} tooltip="View detected incidents">
                <Link href="/dashboard?tab=incidents">
                  <ShieldCheck />
                  <span>Detected Incidents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false} tooltip="Contact support">
                <Link href="mailto:info@aeye.com">
                  <Mail />
                  <span>Contact</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70">
          &copy; {new Date().getFullYear()} AEYE
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
            {/* Mobile-only header for sidebar trigger. This bar is hidden on md screens and up. */}
            <div className="p-2 border-b md:hidden flex items-center bg-background">
              <SidebarTrigger />
               <Link href="/dashboard" className="flex items-center gap-1 ml-2">
                <Image src="/aeye-logo.png" alt="AEYE Logo" width={24} height={24} />
                <span className="font-semibold text-foreground">AEYE</span>
              </Link>
            </div>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
