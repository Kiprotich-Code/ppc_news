"use client"

// Admin Settings: Manage users/roles, monetization, maintenance, announcements, stats
import React from 'react';
import { AdminSidebar } from "@/components/AdminSidebar";
import { HardHat } from "lucide-react";
const AdminSettings = () => {
  // Fetch and update settings, roles, announcements, stats
  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="fixed md:static z-30">
        <AdminSidebar open={true} setOpen={() => {}} userImage={undefined} userName={undefined} />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 md:ml-64">
        <div className="flex flex-col items-center justify-center text-center">
          <HardHat className="h-20 w-20 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Work in Progress</h1>
          <p className="text-gray-500 mb-6 max-w-md">The admin settings panel is under construction. Check back soon for new features and configuration options!</p>
          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
            <span>Men at work</span>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminSettings;
