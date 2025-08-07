"use client"

import React, { useEffect, useState } from "react";
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  FilePlus, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  BarChart2,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminMobileNav } from "@/components/AdminMobileNav";

type Article = {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
  };
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  clickValue: number;
  views: number;
  earnings: number;
};

const AdminArticles = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const router = useRouter();
  const [isMdUp, setIsMdUp] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete article");
      await fetchArticles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete article");
    } finally {
      setActionLoading(null);
    }
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedArticles = React.useMemo(() => {
    if (!sortConfig) return articles;
    return [...articles].sort((a, b) => {
      if (a[sortConfig.key as keyof Article] < b[sortConfig.key as keyof Article]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Article] > b[sortConfig.key as keyof Article]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [articles, sortConfig]);

  const filteredArticles = React.useMemo(() => {
    if (!searchTerm) return sortedArticles;
    return sortedArticles.filter(article => {
      return (
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [sortedArticles, searchTerm]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="w-4 h-4 ml-1 opacity-0" />;
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const totalArticles = articles.length;
  const approvedArticles = articles.filter(a => a.status === "APPROVED").length;
  const pendingArticles = articles.filter(a => a.status === "PENDING").length;
  const totalEarnings = articles.reduce((sum, article) => sum + article.earnings, 0);
  const avgClickValue = articles.length > 0 
    ? articles.reduce((sum, article) => sum + article.clickValue, 0) / articles.length 
    : 0;

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={undefined} />
      </div>

      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Articles</h1>
            <p className="text-gray-600 text-sm mt-1">
              {articles.length} {articles.length === 1 ? "article" : "articles"} total
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => router.push("/admin/articles/new")}
            >
              <FilePlus className="w-5 h-5 mr-2" />
              New Article
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{totalArticles}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedArticles}</p>
                <p className="text-sm text-green-600">
                  {totalArticles ? Math.round((approvedArticles / totalArticles) * 100) : 0}%
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingArticles}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-gray-600">
                  Avg: ${avgClickValue.toFixed(2)} per click
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-500 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p>{error}</p>
              <button 
                onClick={fetchArticles} 
                className="mt-4 text-red-600 hover:text-red-800 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {getSortIcon("title")}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("author.name")}
                    >
                      <div className="flex items-center">
                        Author
                        {getSortIcon("author.name")}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("clickValue")}
                    >
                      <div className="flex items-center">
                        PPV Rate
                        {getSortIcon("clickValue")}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("earnings")}
                    >
                      <div className="flex items-center">
                        Earnings
                        {getSortIcon("earnings")}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Created
                        {getSortIcon("createdAt")}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                      <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {article.title.length > 50 ? `${article.title.substring(0, 50)}...` : article.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-red-600 hover:underline">
                              <Link href={`/admin/members/${article.author.id}`}>
                                {article.author.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            article.status === "APPROVED" ? "bg-green-100 text-green-800" :
                            article.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            article.status === "REJECTED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${(article.clickValue ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          ${(article.earnings ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/articles/${article.id}`)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/articles/${article.id}/edit`)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(article.id)}
                              disabled={actionLoading === article.id + "delete"}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {actionLoading === article.id + "delete" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? "No articles match your search" : "No articles found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={undefined} />
      </div>
    </div>
  );
};

export default AdminArticles;