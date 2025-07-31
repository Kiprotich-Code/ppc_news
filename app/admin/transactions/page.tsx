"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { AdminSidebar } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Clock, Users } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

interface Transaction {
  id: string
  type: "DEPOSIT" | "WITHDRAWAL" | "REVENUE"
  amount: number
  status: "COMPLETED" | "PENDING" | "FAILED"
  date: string
  userId: string
  userName: string
  description: string
}

interface Wallet {
  userId: string
  userName: string
  balance: number
  pendingWithdrawals: number
}

interface TransactionStats {
  totalDeposits: number
  totalWithdrawals: number
  totalRevenue: number
  pendingAmount: number
}

export default function Transactions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<TransactionStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalRevenue: 0,
    pendingAmount: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchTransactionData()
  }, [session, status, router, typeFilter, statusFilter])

  const fetchTransactionData = async () => {
    setIsLoading(true)
    try {
      // Mock API response
      const mockTransactions: Transaction[] = [
        {
          id: "tx1",
          type: "REVENUE",
          amount: 150.25,
          status: "COMPLETED",
          date: new Date(Date.now() - 86400000).toISOString(),
          userId: "user1",
          userName: "John Doe",
          description: "Article earnings: 'Kenya's Economic Outlook'"
        },
        {
          id: "tx2",
          type: "WITHDRAWAL",
          amount: 200.00,
          status: "PENDING",
          date: new Date(Date.now() - 172800000).toISOString(),
          userId: "user2",
          userName: "Jane Smith",
          description: "Bank transfer to KCB"
        },
        {
          id: "tx3",
          type: "DEPOSIT",
          amount: 500.00,
          status: "COMPLETED",
          date: new Date(Date.now() - 259200000).toISOString(),
          userId: "user1",
          userName: "John Doe",
          description: "M-Pesa deposit"
        },
        {
          id: "tx4",
          type: "WITHDRAWAL",
          amount: 100.00,
          status: "FAILED",
          date: new Date(Date.now() - 345600000).toISOString(),
          userId: "user3",
          userName: "Alice Johnson",
          description: "Failed bank transfer"
        },
        {
          id: "tx5",
          type: "REVENUE",
          amount: 75.30,
          status: "COMPLETED",
          date: new Date(Date.now() - 432000000).toISOString(),
          userId: "user2",
          userName: "Jane Smith",
          description: "Article earnings: 'Tech in Nairobi'"
        }
      ]

      const mockWallets: Wallet[] = [
        {
          userId: "user1",
          userName: "John Doe",
          balance: 650.25,
          pendingWithdrawals: 0
        },
        {
          userId: "user2",
          userName: "Jane Smith",
          balance: 275.30,
          pendingWithdrawals: 200.00
        },
        {
          userId: "user3",
          userName: "Alice Johnson",
          balance: 100.00,
          pendingWithdrawals: 0
        }
      ]

      // Calculate stats
      const filteredTransactions = mockTransactions.filter(tx => {
        const typeMatch = typeFilter === "All" || tx.type === typeFilter.toUpperCase()
        const statusMatch = statusFilter === "All" || tx.status === statusFilter.toUpperCase()
        return typeMatch && statusMatch
      })

      const stats: TransactionStats = {
        totalDeposits: mockTransactions
          .filter(tx => tx.type === "DEPOSIT" && tx.status === "COMPLETED")
          .reduce((sum, tx) => sum + tx.amount, 0),
        totalWithdrawals: mockTransactions
          .filter(tx => tx.type === "WITHDRAWAL" && tx.status === "COMPLETED")
          .reduce((sum, tx) => sum + tx.amount, 0),
        totalRevenue: mockTransactions
          .filter(tx => tx.type === "REVENUE" && tx.status === "COMPLETED")
          .reduce((sum, tx) => sum + tx.amount, 0),
        pendingAmount: mockTransactions
          .filter(tx => tx.status === "PENDING")
          .reduce((sum, tx) => sum + tx.amount, 0)
      }

      setStats(stats)
      setTransactions(filteredTransactions)
      setWallets(mockWallets)
    } catch (error) {
      console.error("Error fetching transaction data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
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
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main className={`flex-1 p-4 md:p-8 pb-20 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">Manage deposits, withdrawals, revenue, and user wallets</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option>All</option>
              <option>Deposit</option>
              <option>Withdrawal</option>
              <option>Revenue</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpCircle className="h-8 w-8 text-red-600" />
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
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
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {transaction.userName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className={`font-medium ${
                          transaction.type === "DEPOSIT" || transaction.type === "REVENUE" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {transaction.type === "DEPOSIT" || transaction.type === "REVENUE" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-gray-500">{transaction.type}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-4">No transactions match the current filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* User Wallets Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">User Wallets</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {wallets.length > 0 ? (
                wallets.map((wallet) => (
                  <div key={wallet.userId} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{wallet.userName}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          User ID: {wallet.userId}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <span>Balance: {formatCurrency(wallet.balance)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span>Pending: {formatCurrency(wallet.pendingWithdrawals)}</span>
                        </div>
                        <Link
                          href={`/dashboard/wallets/${wallet.userId}`}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No wallets found</h3>
                  <p className="text-gray-600 mb-4">No user wallets are currently available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav />
      </div>
    </div>
  )
}