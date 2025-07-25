"use client"

import React, { useState, useEffect } from 'react';
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import { HardHat } from "lucide-react";
import { AdminMobileNav } from "@/components/AdminMobileNav"

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  flagged: boolean;
  note?: string;
  paidAt?: string;
  accountDetails: string;
  createdAt: string;
  processedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
};

const AdminWithdrawals = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={undefined} />
      </div>
      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <HardHat className="h-20 w-20 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Work in Progress</h1>
          <p className="text-gray-500 mb-6 max-w-md">The withdrawals management panel is under construction. Check back soon for new features and payout management!</p>
          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
            <span>Men at work</span>
          </div>
        </div>
      </main>
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={undefined} />
      </div>
    </div>
  );
};

export default AdminWithdrawals;
