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
  RefreshCw
} from 'lucide-react';

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

  // Check if user is admin (you should implement proper admin role checking)
  const isAdmin = session?.user?.email === 'admin@ppcnews.com' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchWithdrawals();
  }, [session, status, isAdmin]);

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
        body: JSON.stringify({
          withdrawalId,
          adminNote: adminNote.trim()
        })
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
        body: JSON.stringify({
          withdrawalId,
          adminNote: adminNote.trim()
        })
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
        body: JSON.stringify({
          withdrawalId,
          adminNote: adminNote.trim()
        })
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
    filter === 'ALL' || withdrawal.status === filter
  );

  const totalPending = withdrawals.filter(w => w.status === 'PENDING').length;
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const pendingAmount = withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + w.amount, 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
              <p className="text-gray-600 mt-1">Review and process withdrawal requests</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchWithdrawals}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
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
                      ? 'bg-blue-500 text-white'
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Withdrawal Requests ({filteredWithdrawals.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading withdrawal requests...</p>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {withdrawal.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(withdrawal.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {withdrawal.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedWithdrawal(withdrawal.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
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
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {(() => {
              const withdrawal = withdrawals.find(w => w.id === selectedWithdrawal);
              if (!withdrawal) return null;
              
              return (
                <>
                  <div className="p-6 border-b">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3">
                      {withdrawal.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processing === withdrawal.id || !adminNote.trim()}
                            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === withdrawal.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processing === withdrawal.id || !adminNote.trim()}
                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === withdrawal.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      
                      {withdrawal.status === 'APPROVED' && (
                        <button
                          onClick={() => markAsPaid(withdrawal.id)}
                          disabled={processing === withdrawal.id || !adminNote.trim()}
                          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
