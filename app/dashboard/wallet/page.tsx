"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { formatCurrency } from "@/lib/utils";
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Eye,
  EyeOff,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Building2,
  PhoneCall
} from 'lucide-react';

const WalletDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState("DEPOSIT");
  
  // Mock data matching original structure
  const stats = {
    balance: 125430.50,
    investment: 85000.00,
    earnings: 12543.80,
    pendingWithdrawals: 5000.00,
    totalDeposits: 450000.00,
    totalWithdrawals: 324569.50,
    currency: 'KES'
  };

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-16`}>
            <LoadingSpinner />
          </main>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const transactions = [
    { id: '1', type: 'DEPOSIT', amount: 15000, status: 'COMPLETED', date: '2025-08-04T10:30:00Z', description: 'M-Pesa Deposit', paymentMethod: 'MPESA' },
    { id: '2', type: 'INVESTMENT', amount: 5000, status: 'COMPLETED', date: '2025-08-03T14:20:00Z', description: 'Investment Added', paymentMethod: 'WALLET' },
    { id: '3', type: 'WITHDRAWAL', amount: 8000, status: 'PENDING', date: '2025-08-03T09:15:00Z', description: 'M-Pesa Withdrawal', paymentMethod: 'MPESA' },
    { id: '4', type: 'INTEREST', amount: 234.50, status: 'COMPLETED', date: '2025-08-02T16:45:00Z', description: 'Investment Interest', paymentMethod: 'AUTO' },
    { id: '5', type: 'TRANSFER', amount: 2500, status: 'COMPLETED', date: '2025-08-01T11:30:00Z', description: 'Internal Transfer', paymentMethod: 'WALLET' }
  ];

  const investmentInterest = stats.investment * 0.02;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case 'WITHDRAWAL': return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case 'INVESTMENT': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'INTEREST': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'TRANSFER': return <Building2 className="w-5 h-5 text-blue-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (transactionType === "WITHDRAWAL" && amount > stats.balance) {
      alert("Insufficient balance");
      return;
    }
    
    if (transactionType === "INVEST" && amount > stats.balance) {
      alert("Insufficient balance for investment");
      return;
    }
    
    // Handle transaction logic here
    console.log(`${transactionType}: ${amount}`);
  };

  const handleInvest = () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (amount > stats.balance) {
      alert("Insufficient balance for investment");
      return;
    }
    
    console.log(`Investment: ${amount}`);
    setTransactionAmount("");
  };

  const handleCollectInterest = () => {
    console.log("Collecting interest");
  };

  const handleEarningsTransfer = () => {
    console.log("Transferring earnings to wallet");
  };

  const handleWithdrawInvestment = () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (amount > stats.investment) {
      alert("Amount exceeds investment balance");
      return;
    }
    
    console.log(`Withdraw investment: ${amount}`);
    setTransactionAmount("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>
      
      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-32' : 'md:ml-16'} pb-20 md:pb-8`}>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          {/* Header */}
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Balance */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-2">Available Balance</p>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-3xl font-bold">
                        {balanceVisible ? formatCurrency(stats.balance) : '••••••••'}
                      </h2>
                      <button 
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-red-600 rounded-lg">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Investment Balance */}
              <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-2">Total Investment</p>
                    <h2 className="text-3xl font-bold">
                      {balanceVisible ? formatCurrency(stats.investment) : '••••••••'}
                    </h2>
                  </div>
                  <div className="p-3 bg-red-500 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">Available Earnings</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                      {formatCurrency(stats.earnings)}
                    </p>
                    {stats.earnings > 0 && (
                      <button 
                        onClick={handleEarningsTransfer}
                        className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                      >
                        Transfer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">Pending Withdrawals</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                      {formatCurrency(stats.pendingWithdrawals)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">M-Pesa</p>
                    <p className="text-xs text-gray-500 truncate">Quick deposits & withdrawals</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowUpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">Total Deposits</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{formatCurrency(stats.totalDeposits)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowDownCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">Total Withdrawals</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{formatCurrency(stats.totalWithdrawals)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 truncate">Investment Growth</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">+2.0%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => setTransactionType("DEPOSIT")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transactionType === "DEPOSIT" 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <ArrowUpCircle className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Deposit</span>
                </button>
                
                <button 
                  onClick={() => setTransactionType("WITHDRAWAL")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transactionType === "WITHDRAWAL" 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <ArrowDownCircle className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Withdraw</span>
                </button>
                
                <button 
                  onClick={() => setTransactionType("INVEST")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transactionType === "INVEST" 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Hold & Earn</span>
                </button>
              </div>
            </div>

            {/* Transaction Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {transactionType === "INVEST" ? "Invest Funds (2% Interest)" : `${transactionType.charAt(0) + transactionType.slice(1).toLowerCase()} Money`}
              </h3>
              
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">KES</span>
                    <input
                      type="number"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transactionType === "INVEST" ? "Invest Now" : `${transactionType.charAt(0) + transactionType.slice(1).toLowerCase()} ${formatCurrency(parseFloat(transactionAmount) || 0)}`}
                </button>
              </form>
            </div>

            {/* Investment Management */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Investment</h3>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Available Interest (2%)</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(investmentInterest)}</p>
                  </div>
                  <button
                    onClick={handleCollectInterest}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Collect Interest
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdraw Amount</label>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleWithdrawInvestment}
                  disabled={!transactionAmount || parseFloat(transactionAmount) > stats.investment}
                  className="w-full bg-gradient-to-r from-red-400 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw from Investment
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatDate(transaction.date)}</span>
                          <span>•</span>
                          <span>{transaction.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'DEPOSIT' || transaction.type === 'INTEREST' 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'INTEREST' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  );
};

export default WalletDashboard;