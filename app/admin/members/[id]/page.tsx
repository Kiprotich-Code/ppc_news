"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import Link from "next/link";
import { AdminMobileNav } from "@/components/AdminMobileNav";
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldIcon,
  CalendarIcon,
  FileTextIcon,
  DollarSignIcon,
  ActivityIcon,
  BarChart2Icon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MoreHorizontalIcon
} from "lucide-react";

const MemberDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/members?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch member details");
        const data = await res.json();
        setMember(data.user);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch member details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen text-red-500">
      <div className="bg-red-100 p-4 rounded-full mb-4">
        <XCircleIcon className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-medium mb-2">Error Loading Member</h2>
      <p className="mb-4">{error}</p>
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Members
      </button>
    </div>
  );

  if (!member) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <UserIcon className="w-10 h-10 text-gray-500" />
      </div>
      <h2 className="text-xl font-medium mb-2">Member Not Found</h2>
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Members
      </button>
    </div>
  );

  // Calculate stats
  const totalArticles = member.articles?.length || 0;
  const approvedArticles = member.articles?.filter((a: any) => a.status === "APPROVED").length || 0;
  const totalEarnings = member.earnings?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;
  const pendingWithdrawals = member.withdrawals?.filter((w: any) => w.status === "PENDING").length || 0;
  const lastActivity = member.auditLogs?.[0] ? new Date(member.auditLogs[0].createdAt).toLocaleString() : "No activity";

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to Members
          </button>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              member.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
              member.role === "WRITER" ? "bg-blue-100 text-blue-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {member.role}
            </span>
            <span className="text-sm text-gray-500">
              Joined {new Date(member.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
                <p className="text-gray-500">{member.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{member.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{member.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{member.address || 'Not provided'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCardIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{member.withdrawalAccount || 'Not set up'}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-500">Articles</h3>
                <FileTextIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{totalArticles}</p>
                  <p className="text-sm text-green-600">
                    {approvedArticles} approved ({totalArticles ? Math.round((approvedArticles / totalArticles) * 100) : 0}%)
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <BarChart2Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-500">Earnings</h3>
                <DollarSignIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Lifetime</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <TrendingUpIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-500">Recent Activity</h3>
              <ActivityIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-4">
              {member.auditLogs?.slice(0, 3).map((log: any) => (
                <div key={log.id} className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-1 rounded-full mt-1">
                    <ClockIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-500">{log.details || 'No details'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!member.auditLogs || member.auditLogs.length === 0) && (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
              {member.auditLogs?.length > 3 && (
                <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                  View all activity <MoreHorizontalIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Articles Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Articles</h3>
              <span className="text-sm text-gray-500">{totalArticles} total</span>
            </div>
            <div className="space-y-3">
              {member.articles?.slice(0, 5).map((article: any) => (
                <div key={article.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      article.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      article.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {article.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!member.articles || member.articles.length === 0) && (
                <p className="text-gray-500 text-sm">No articles found</p>
              )}
              {member.articles?.length > 5 && (
                <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2">
                  View all articles <MoreHorizontalIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>

          {/* Withdrawals Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Withdrawals</h3>
              <span className="text-sm text-gray-500">{member.withdrawals?.length || 0} total</span>
            </div>
            <div className="space-y-3">
              {member.withdrawals?.slice(0, 5).map((withdrawal: any) => (
                <div key={withdrawal.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">${withdrawal.amount.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      withdrawal.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      withdrawal.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {withdrawal.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {withdrawal.method || 'Unknown method'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!member.withdrawals || member.withdrawals.length === 0) && (
                <p className="text-gray-500 text-sm">No withdrawal requests</p>
              )}
              {member.withdrawals?.length > 5 && (
                <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2">
                  View all withdrawals <MoreHorizontalIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Earnings History</h3>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {member.earnings?.slice(0, 5).map((earning: any) => (
                  <tr key={earning.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                      <Link href={`/admin/articles/${earning.articleId}`}>
                        {earning.articleTitle || 'Unknown article'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${earning.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${earning.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        earning.status === "PAID" ? "bg-green-100 text-green-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {earning.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!member.earnings || member.earnings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No earnings recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {member.earnings?.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center w-full">
                  View all earnings <MoreHorizontalIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
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

export default MemberDetailPage;