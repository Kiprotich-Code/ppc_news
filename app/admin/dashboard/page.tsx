"use client"

// Admin Dashboard: Overview and quick actions
import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Users, FileText, Clock, Eye, DollarSign, AlertCircle } from 'lucide-react';

type DashboardStats = {
  totalUsers: number;
  totalArticles: number;
  pendingArticles: number;
  totalViews: number;
  totalEarnings: number;
  pendingWithdrawals: number;
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        setStats(data.stats);
      } catch (e) {
        setError('Failed to fetch dashboard stats');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-16 p-6`}>
        <h1 className="text-2xl font-bold mb-6 text-red-700">Admin Dashboard</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-gray-500 text-sm">Total Users</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalArticles}</div>
                <div className="text-gray-500 text-sm">Total Articles</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingArticles}</div>
                <div className="text-gray-500 text-sm">Pending Articles</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
                <div className="text-gray-500 text-sm">Total Views</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalEarnings}</div>
                <div className="text-gray-500 text-sm">Total Earnings</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingWithdrawals}</div>
                <div className="text-gray-500 text-sm">Pending Withdrawals</div>
              </div>
            </div>
          </div>
        )}
        {/* Quick links to moderation, boosting, withdrawals, members, settings */}
      </main>
    </div>
  );
};

export default AdminDashboard;
