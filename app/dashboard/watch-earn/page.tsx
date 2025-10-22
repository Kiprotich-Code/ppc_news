"use client";

import { WatchAndEarn } from '@/components/WatchAndEarn';
import { Navigation } from '@/components/Navigation';
import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';
import { DashboardMobileNav } from '@/components/DashboardMobileNav';
import { ClientOnly } from '@/components/ClientOnly';

export default function WatchEarnPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-red-50 flex flex-col md:flex-row">
      <ClientOnly>
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </div>
        <main className={`flex-1 p-4 md:p-8 pb-20 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
          <WatchAndEarn />
        </main>
        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </ClientOnly>
    </div>
  );
}