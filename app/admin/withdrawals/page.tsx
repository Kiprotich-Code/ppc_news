"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search
} from 'lucide-react';
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import { AdminMobileNav } from "@/components/AdminMobileNav";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  phoneNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  note?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const WithdrawalAdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'>('ALL');
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const isAdmin = session?.user?.email === 'admin@ppcnews.com' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchWithdrawals();
  }, [session, status, isAdmin, router]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawals', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals);
      } else {
        toast.error('Failed to fetch withdrawal requests');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    if (!adminNote.trim()) {
      toast.error('Please add an admin note before approving');
      return;
    }
    setProcessing(withdrawalId);
    try {
      const response = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ withdrawalId, adminNote: adminNote.trim() })
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Withdrawal approved successfully');
        setAdminNote('');
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        toast.error(result.error || 'Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawalId: string) => {
    if (!adminNote.trim()) {
      toast.error('Please add a reason for rejection');
      return;
    }
    setProcessing(withdrawalId);
    try {
      const response = await fetch('/api/admin/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ withdrawalId, adminNote: adminNote.trim() })
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Withdrawal rejected and wallet refunded');
        setAdminNote('');
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        toast.error(result.error || 'Failed to reject withdrawal');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const markAsPaid = async (withdrawalId: string) => {
    if (!adminNote.trim()) {
      toast.error('Please add confirmation details');
      return;
    }
    setProcessing(withdrawalId);
    try {
      const response = await fetch('/api/admin/withdrawals/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ withdrawalId, adminNote: adminNote.trim() })
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Withdrawal marked as paid');
        setAdminNote('');
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        toast.error(result.error || 'Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    (filter === 'ALL' || withdrawal.status === filter) &&
    (withdrawal.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     withdrawal.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     withdrawal.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const startItem = startIndex + 1;
    const endItem = Math.min(endIndex, filteredWithdrawals.length);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-700">
          Showing {startItem} to {endItem} of {filteredWithdrawals.length} results
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const totalPending = withdrawals.filter(w => w.status === 'PENDING').length;
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const pendingAmount = withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + w.amount, 0);
  const paidAmount = withdrawals.filter(w => w.status === 'PAID').reduce((sum, w) => sum + w.amount, 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>

      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Withdrawals</h1>
            <p className="text-gray-600 text-sm mt-1">
              {withdrawals.length} {withdrawals.length === 1 ? 'request' : 'requests'} total
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search withdrawals..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchWithdrawals}
              disabled={loading}
              className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex space-x-2">
              {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{searchTerm ? 'No withdrawals match your search' : 'No withdrawal requests found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{withdrawal.user.name}</div>
                            <div className="text-sm text-gray-600">{withdrawal.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {withdrawal.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(withdrawal.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {withdrawal.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedWithdrawal(withdrawal.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {(withdrawal.status === 'PAID' || withdrawal.status === 'REJECTED') && (
                          <span className="text-gray-500 text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination()}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={session?.user?.name} />
      </div>

      {/* Action Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            {(() => {
              const withdrawal = withdrawals.find(w => w.id === selectedWithdrawal);
              if (!withdrawal) return null;
              return (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {withdrawal.status === 'PENDING' ? 'Review Withdrawal' : 'Mark as Paid'}
                    </h3>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>User:</strong> {withdrawal.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Amount:</strong> {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Phone:</strong> {withdrawal.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {withdrawal.status === 'PENDING' ? 'Admin Note' : 'Payment Confirmation Details'}
                      </label>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder={
                          withdrawal.status === 'PENDING'
                            ? 'Add a note about your decision...'
                            : 'Add M-Pesa transaction ID or confirmation details...'
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3">
                      {withdrawal.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processing === withdrawal.id || !adminNote.trim()}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === withdrawal.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processing === withdrawal.id || !adminNote.trim()}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === withdrawal.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {withdrawal.status === 'APPROVED' && (
                        <button
                          onClick={() => markAsPaid(withdrawal.id)}
                          disabled={processing === withdrawal.id || !adminNote.trim()}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === withdrawal.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedWithdrawal(null);
                          setAdminNote('');
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalAdminPage;