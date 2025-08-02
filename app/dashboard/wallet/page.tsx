"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Clock, PhoneCall } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { MpesaPayment } from "@/components/MpesaPayment"
import { toast } from "sonner"

interface WalletStats {
  balance: number
  earnings: number
  pendingWithdrawals: number
  totalDeposits: number
  totalWithdrawals: number
  currency: string
}

interface Transaction {
  id: string
  type: "DEPOSIT" | "WITHDRAWAL" | "EARNING" | "TRANSFER"
  amount: number
  status: "COMPLETED" | "PENDING" | "FAILED"
  date: string
  description: string
  paymentMethod?: "MPESA"
}

export default function Wallet() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<WalletStats>({
    balance: 0,
    earnings: 0,
    pendingWithdrawals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    currency: 'KES'
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [transactionAmount, setTransactionAmount] = useState("")
  const [transactionType, setTransactionType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT")
  const [showMpesaDialog, setShowMpesaDialog] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchWalletData()
  }, [session, status, router])

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/wallet', {
        credentials: 'include',  // Add this line
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet data');
      }

      const stats: WalletStats = {
        balance: data.balance,
        earnings: data.earnings,
        pendingWithdrawals: 0, // TODO: Calculate from pending withdrawals
        totalDeposits: 0, // TODO: Calculate from transactions
        totalWithdrawals: 0, // TODO: Calculate from transactions
        currency: data.currency
      };

      // Transform transactions to match our interface
      const transactions: Transaction[] = data.transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type.toUpperCase(),
        amount: tx.amount,
        status: tx.status,
        date: tx.createdAt,
        description: tx.description,
        paymentMethod: tx.paymentMethod
      }));

      setStats(stats)
      setTransactions(transactions)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(transactionAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (transactionType === "DEPOSIT") {
      setShowMpesaDialog(true);
    } else {
      // Show confirmation before withdrawal
      if (amount > stats.balance) {
        toast.error("Insufficient balance");
        return;
      }

      // For withdrawals, show M-Pesa dialog
      setShowMpesaDialog(true);
    }
  }

  const handleMpesaSuccess = async () => {
    // Refresh wallet data after successful transaction
    await fetchWalletData();
    setTransactionAmount("");
    setShowMpesaDialog(false);
  }

  // Handle earnings transfer
  const handleEarningsTransfer = async () => {
    try {
      const response = await fetch('/api/wallet/transfer-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: stats.earnings })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Earnings transferred to wallet successfully');
      await fetchWalletData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer earnings');
    }
  }

  if (status === "loading" || isLoading) {
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
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <>
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </div>
        <main className={`flex-1 p-4 md:p-8 pb-20 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Wallet
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your earnings, deposits, and withdrawals
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.currency} {stats.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.currency} {typeof stats.balance === 'number' ? stats.balance.toLocaleString() : '0'}
                    </p>
                    {stats.earnings > 0 && (
                      <button 
                        onClick={handleEarningsTransfer}
                        className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Transfer to Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.currency} {stats.pendingWithdrawals.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhoneCall className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">M-Pesa</p>
                    <p className="text-sm text-gray-500">Quick deposits and withdrawals</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowUpCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDeposits)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowDownCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalWithdrawals)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-red-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Make a Transaction</h2>
              <form onSubmit={handleTransaction}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as "DEPOSIT" | "WITHDRAWAL")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="DEPOSIT">Deposit</option>
                      <option value="WITHDRAWAL">Withdrawal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400"
                  disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                >
                  Process Transaction
                </button>
              </form>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{transaction.description}</h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(new Date(transaction.date))}
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === "COMPLETED" 
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className={`font-medium ${
                            transaction.type === "DEPOSIT" || transaction.type === "EARNING" 
                              ? "text-green-600" 
                              : "text-red-600"
                          }`}>
                            {transaction.type === "DEPOSIT" || transaction.type === "EARNING" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-gray-500">
                            {transaction.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-gray-600 mb-4">Make a deposit or withdrawal to see it here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <MpesaPayment 
            isOpen={showMpesaDialog}
            onClose={() => setShowMpesaDialog(false)}
            amount={parseFloat(transactionAmount)}
            onSuccess={handleMpesaSuccess}
            type={transactionType.toLowerCase() as "deposit" | "withdrawal"}
            description={`${transactionType === "DEPOSIT" ? "Deposit to" : "Withdrawal from"} wallet`}
          />
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </>
    </div>
  )
}