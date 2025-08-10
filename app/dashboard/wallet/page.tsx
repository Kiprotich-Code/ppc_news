"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { PayHeroPayment } from "@/components/PayHeroPayment";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
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
  PhoneCall,
  ArrowUpRight,
  Copy
} from 'lucide-react';

const WalletDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState("DEPOSIT");
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Investment related state
  const [investments, setInvestments] = useState<any[]>([]);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [selectedInvestmentPeriod, setSelectedInvestmentPeriod] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [creatingInvestment, setCreatingInvestment] = useState(false);
  
  // Investment plans configuration
  const investmentPlans = [
    { period: "ONE_WEEK", label: "1 Week", rate: 4, days: 7, color: "text-green-600" },
    { period: "TWO_WEEKS", label: "2 Weeks", rate: 8, days: 14, color: "text-blue-600" },
    { period: "ONE_MONTH", label: "1 Month", rate: 16, days: 30, color: "text-purple-600" }
  ];
  
  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setWalletData(data.wallet);
        setTransactions(data.transactions);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch investments
  const fetchInvestments = async () => {
    try {
      const res = await fetch("/api/investments");
      const data = await res.json();
      if (res.ok) {
        setInvestments(data.investments);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
    }
  };

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchWalletData();
    }
  }, [status, router]);

  // Refresh data periodically
  useEffect(() => {
    if (session) {
      const interval = setInterval(fetchWalletData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  // Fetch investments when component mounts
  useEffect(() => {
    if (session) {
      fetchInvestments();
    }
  }, [session]);

  if (status === "loading" || loading) {
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

  if (!session || !walletData) {
    return null;
  }

  const stats = walletData;
  
  // Calculate investment stats
  const totalInvested = investments
    .filter(inv => inv.status === 'ACTIVE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalEarnings = investments
    .filter(inv => inv.status === 'ACTIVE')
    .reduce((sum, inv) => sum + inv.currentEarnedInterest, 0);

  const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE').length;

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
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (transactionType === "WITHDRAWAL" && amount > stats.balance) {
      toast.error("Insufficient balance");
      return;
    }
    
    if (transactionType === "INVEST" && amount > stats.balance) {
      toast.error("Insufficient balance for investment");
      return;
    }
    
    // Open M-Pesa modal for deposits and withdrawals
    if (transactionType === "DEPOSIT" || transactionType === "WITHDRAWAL") {
      setMpesaModalOpen(true);
    } else if (transactionType === "INVEST") {
      handleInvest();
    }
  };

  const handleInvest = async () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount > stats.balance) {
      toast.error("Insufficient balance for investment");
      return;
    }
    
    try {
      const response = await fetch('/api/wallet/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Investment successful!");
        setTransactionAmount("");
        fetchWalletData(); // Refresh data
      } else {
        toast.error(result.error || "Investment failed");
      }
    } catch (error) {
      toast.error("Investment failed. Please try again.");
    }
  };

  const handleCollectInterest = async () => {
    try {
      const response = await fetch('/api/wallet/collect-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Interest collected successfully!");
        fetchWalletData(); // Refresh data
      } else {
        toast.error(result.error || "Failed to collect interest");
      }
    } catch (error) {
      toast.error("Failed to collect interest. Please try again.");
    }
  };

  const handleEarningsTransfer = async () => {
    if (stats.earnings <= 0) {
      toast.error("No earnings available to transfer");
      return;
    }

    try {
      const response = await fetch('/api/wallet/transfer-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Successfully transferred ${formatCurrency(stats.earnings)} to wallet!`);
        fetchWalletData(); // Refresh data
      } else {
        toast.error(result.error || "Failed to transfer earnings");
      }
    } catch (error) {
      toast.error("Failed to transfer earnings. Please try again.");
    }
  };

  const handleWithdrawInvestment = async () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount > stats.investment) {
      toast.error("Amount exceeds investment balance");
      return;
    }
    
    try {
      const response = await fetch('/api/wallet/investment-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Investment withdrawal successful!");
        setTransactionAmount("");
        fetchWalletData(); // Refresh data
      } else {
        toast.error(result.error || "Investment withdrawal failed");
      }
    } catch (error) {
      toast.error("Investment withdrawal failed. Please try again.");
    }
  };

  // Create new investment
  const handleCreateInvestment = async () => {
    if (!selectedInvestmentPeriod || !investmentAmount || parseFloat(investmentAmount) < 100) {
      toast.error("Please select a period and enter a valid amount (minimum KES 100)");
      return;
    }

    if (parseFloat(investmentAmount) > stats.balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setCreatingInvestment(true);
    try {
      const res = await fetch("/api/investments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(investmentAmount),
          period: selectedInvestmentPeriod
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Investment created successfully!");
        setShowInvestmentModal(false);
        setSelectedInvestmentPeriod("");
        setInvestmentAmount("");
        fetchInvestments();
        fetchWalletData(); // Refresh wallet balance
      } else {
        toast.error(data.error || "Failed to create investment");
      }
    } catch (error) {
      toast.error("Failed to create investment");
    } finally {
      setCreatingInvestment(false);
    }
  };

  // Withdraw matured investment
  const handleInvestmentWithdraw = async (investmentId: string) => {
    try {
      const res = await fetch("/api/investments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Investment withdrawn! KES ${data.amount.toLocaleString()} added to your wallet.`);
        fetchInvestments();
        fetchWalletData(); // Refresh wallet balance
      } else {
        toast.error(data.error || "Withdrawal failed");
      }
    } catch (error) {
      toast.error("Withdrawal failed");
    }
  };

  // Helper functions for investments
  const formatPeriod = (period: string) => {
    return period.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string, isMatured: boolean) => {
    if (status === 'WITHDRAWN') return 'bg-gray-500';
    if (isMatured) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = (status: string, isMatured: boolean) => {
    if (status === 'WITHDRAWN') return 'Withdrawn';
    if (isMatured) return 'Ready to Withdraw';
    return 'Active';
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
                      {balanceVisible ? formatCurrency(totalInvested) : '••••••••'}
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
                    {stats.earnings > 0 ? (
                      <button 
                        onClick={handleEarningsTransfer}
                        className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                      >
                        Transfer All
                      </button>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Earn by writing articles!</p>
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
                    <p className="text-xs font-medium text-gray-600 truncate">Investment Earnings</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
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
                  onClick={() => setShowInvestmentModal(true)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transactionType === "INVEST" 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Invest</span>
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
                  onClick={(e) => {
                    // Add validation before form submission
                    const amount = parseFloat(transactionAmount);
                    if (transactionType === "WITHDRAWAL" && amount > stats.balance) {
                      e.preventDefault();
                      toast.error(`Insufficient balance. Available: ${formatCurrency(stats.balance)}`);
                      return;
                    }
                    if (transactionType === "INVEST" && amount > stats.balance) {
                      e.preventDefault();
                      toast.error(`Insufficient balance for investment. Available: ${formatCurrency(stats.balance)}`);
                      return;
                    }
                  }}
                >
                  {transactionType === "INVEST" ? "Invest Now" : `${transactionType.charAt(0) + transactionType.slice(1).toLowerCase()} ${formatCurrency(parseFloat(transactionAmount) || 0)}`}
                </button>
              </form>
            </div>

            {/* Investment Section */}
            <div className="space-y-6">
              {/* Investment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Invested</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Earnings</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Investments</p>
                      <p className="text-2xl font-bold">{activeInvestments}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Investment Plans */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-row items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Investment Plans</h3>
                  <button 
                    onClick={() => setShowInvestmentModal(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline" />
                    New Investment
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {investmentPlans.map((plan) => (
                    <div key={plan.period} className="border-2 border-gray-200 hover:border-red-300 rounded-lg p-4 transition-colors cursor-pointer">
                      <div className="text-center space-y-2">
                        <h4 className="font-semibold">{plan.label}</h4>
                        <div className={`text-3xl font-bold ${plan.color}`}>{plan.rate}%</div>
                        <p className="text-sm text-gray-600">Returns in {plan.days} days</p>
                        <div className="text-xs text-gray-500">
                          KES 1,000 → KES {(1000 * (1 + plan.rate / 100)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Investments */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Investments</h3>
                {investments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No investments yet. Start your first investment today!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment) => (
                      <div key={investment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{formatPeriod(investment.period)}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(investment.status, investment.isMatured)}`}>
                                {getStatusText(investment.status, investment.isMatured)}
                              </span>
                              {investment.isMatured && investment.status === 'ACTIVE' && (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <ArrowUpRight className="w-3 h-3 mr-1 inline" />
                                  Ready!
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Principal</p>
                                <p className="font-semibold">{formatCurrency(investment.amount)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Interest Rate</p>
                                <p className="font-semibold">{(investment.interestRate * 100)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Earned Interest</p>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(investment.currentEarnedInterest)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Return</p>
                                <p className="font-semibold">{formatCurrency(investment.totalReturn)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Status</p>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">
                                    {investment.isMatured ? 'Matured' : `${investment.daysRemaining}d left`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Started: {new Date(investment.startDate).toLocaleDateString()}</span>
                              <span>Ends: {new Date(investment.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            {investment.canWithdraw && (
                              <button 
                                onClick={() => handleInvestmentWithdraw(investment.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                              >
                                <DollarSign className="w-4 h-4 mr-2 inline" />
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                          <span>{formatDate(transaction.createdAt)}</span>
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

      {/* Investment Creation Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Investment</h3>
                <button 
                  onClick={() => setShowInvestmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Plan</label>
                  <div className="grid grid-cols-1 gap-2">
                    {investmentPlans.map((plan) => (
                      <div
                        key={plan.period}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedInvestmentPeriod === plan.period 
                            ? 'border-red-500 bg-red-50' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedInvestmentPeriod(plan.period)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{plan.label}</p>
                            <p className="text-sm text-gray-600">{plan.days} days</p>
                          </div>
                          <div className={`text-lg font-bold ${plan.color}`}>
                            {plan.rate}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">KES</span>
                    <input
                      type="number"
                      placeholder="Enter amount (minimum KES 100)"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      min="100"
                      step="10"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available balance: {formatCurrency(stats?.balance || 0)}
                  </p>
                </div>

                {selectedInvestmentPeriod && investmentAmount && parseFloat(investmentAmount) >= 100 && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Investment Summary:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Principal:</span>
                        <span>{formatCurrency(parseFloat(investmentAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest ({investmentPlans.find(p => p.period === selectedInvestmentPeriod)?.rate}%):</span>
                        <span className="text-green-600">
                          {formatCurrency(parseFloat(investmentAmount) * (investmentPlans.find(p => p.period === selectedInvestmentPeriod)?.rate || 0) / 100)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total Return:</span>
                        <span>
                          {formatCurrency(parseFloat(investmentAmount) * (1 + (investmentPlans.find(p => p.period === selectedInvestmentPeriod)?.rate || 0) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowInvestmentModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateInvestment}
                    disabled={!selectedInvestmentPeriod || !investmentAmount || parseFloat(investmentAmount) < 100 || creatingInvestment}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingInvestment ? "Creating..." : "Invest Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayHero Payment Modal */}
      <PayHeroPayment
        isOpen={mpesaModalOpen}
        onClose={() => setMpesaModalOpen(false)}
        amount={parseFloat(transactionAmount) || 0}
        onSuccess={() => {
          toast.success(`${transactionType.charAt(0) + transactionType.slice(1).toLowerCase()} completed successfully!`);
          fetchWalletData(); // Refresh data
          setTransactionAmount("");
          setMpesaModalOpen(false);
        }}
        type={transactionType.toLowerCase() as 'deposit' | 'withdrawal'}
        description={`${transactionType.charAt(0) + transactionType.slice(1).toLowerCase()} to wallet`}
      />
    </div>
  );
};

export default WalletDashboard;