"use client"

import React, { useEffect, useState } from 'react';
import { AdminSidebar } from "@/components/AdminSidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Edit3, Star, DollarSign, Eye, ChevronLeft, ChevronRight } from "lucide-react";

type Article = {
  id: string;
  title: string;
  content: string;
  status: string;
  moderationNote?: string;
  isBoosted: boolean;
  boostLevel?: string;
  boostExpiry?: string;
  clickValue?: number;
  publishedAt?: string;
  author: { name: string; email: string; };
};

const AdminArticles = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchArticles();
  }, [session, status, router]);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      setError('Failed to fetch articles');
    }
    setLoading(false);
  };

  const moderateArticle = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await fetch('/api/admin/articles/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, status, note }),
      });
      fetchArticles();
      setSelected(null);
      setNote('');
    } catch (e) {
      setError('Moderation failed');
    }
    setActionLoading(null);
  };

  const boostArticle = async (id: string, isBoosted: boolean, boostLevel?: string, boostExpiry?: string) => {
    setActionLoading(id + 'boost');
    try {
      await fetch('/api/admin/articles/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, isBoosted, boostLevel, boostExpiry }),
      });
      fetchArticles();
    } catch (e) {
      setError('Boost failed');
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar: responsive overlay on mobile */}
      <div className="fixed md:static z-30">
        <AdminSidebar
          open={true}
          setOpen={() => {}}
          userImage={undefined}
          userName={session?.user?.name}
        />
      </div>
      <main className="flex-1 p-2 md:p-8 md:ml-64 transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-lg p-2 md:p-4">
          <h2 className="text-lg font-semibold mb-4 text-red-700">All Articles</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Author</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Boosted</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {a.author?.name || "Unknown"}
                      <div className="text-xs text-gray-500">{a.author?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'APPROVED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${a.isBoosted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{a.isBoosted ? 'YES' : 'NO'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="group p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition"
                          onClick={() => setSelected(a)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                        </button>
                        <button
                          className="group p-2 rounded-full bg-gray-100 hover:bg-yellow-100 transition"
                          onClick={() => moderateArticle(a.id, "APPROVED")}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4 text-yellow-600 group-hover:text-yellow-800" />
                        </button>
                        <button
                          className="group p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                          onClick={() => moderateArticle(a.id, "REJECTED")}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4 text-red-600 group-hover:text-red-800" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Hide the details card for now to match the screenshot's simplicity */}
      </main>
    </div>
  );
};

export default AdminArticles;
