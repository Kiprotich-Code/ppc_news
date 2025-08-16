"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import { AdminMobileNav } from "@/components/AdminMobileNav";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { tiptapToHtml } from "@/lib/utils";
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PencilIcon, 
  CheckIcon, 
  XIcon,
  DollarSignIcon,
  ClockIcon,
  UserIcon,
  AlertCircleIcon,
  InfoIcon,
  ShieldAlertIcon,
  BadgeDollarSignIcon
} from "lucide-react";

const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPPV, setEditingPPV] = useState(false);
  const [ppvValue, setPPVValue] = useState<string>("");
  const [ppvLoading, setPPVLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
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
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/articles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch article");
        const data = await res.json();
        if (!data.article) throw new Error("Article not found");
        
        setArticle(data.article);
        setPPVValue(
          data.article.clickValue !== undefined && data.article.clickValue !== null 
            ? data.article.clickValue.toString() 
            : "0"
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch article details");
        toast.error("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  const handlePPVSave = async () => {
    const value = parseFloat(ppvValue);
    if (isNaN(value) || value < 0) {
      toast.error("Pay-Per-View rate must be a positive number");
      return;
    }
    
    setPPVLoading(true);
    try {
      const res = await fetch("/api/admin/articles/click-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id, clickValue: value })
      });
      
      if (!res.ok) throw new Error("Failed to update PPV rate");
      
      toast.success(`Pay-Per-View rate updated to $${value.toFixed(2)}`);
      setArticle((prev: any) => ({ ...prev, clickValue: value }));
      setEditingPPV(false);
    } catch (error) {
      toast.error("Failed to update Pay-Per-View rate");
    } finally {
      setPPVLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      const res = await fetch("/api/admin/articles/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id, status: "APPROVED" })
      });
      
      if (!res.ok) throw new Error("Failed to approve article");
      
      toast.success("Article approved successfully");
      setArticle((prev: any) => ({ ...prev, status: "APPROVED" }));
    } catch (error) {
      toast.error("Failed to approve article");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    setRejectLoading(true);
    try {
      const res = await fetch("/api/admin/articles/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          articleId: id, 
          status: "REJECTED", 
          note: rejectReason 
        })
      });
      
      if (!res.ok) throw new Error("Failed to reject article");
      
      toast.success("Article rejected");
      setArticle((prev: any) => ({ 
        ...prev, 
        status: "REJECTED", 
        moderationNote: rejectReason 
      }));
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject article");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center bg-gray-100 min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-8 flex flex-col items-center justify-center bg-gray-100 min-h-screen text-red-600">
      <AlertCircleIcon className="w-12 h-12 mb-4" />
      <p className="text-xl font-medium">{error}</p>
      <button 
        onClick={() => router.back()}
        className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Go back
      </button>
    </div>
  );
  
  if (!article) return (
    <div className="p-8 flex flex-col items-center justify-center bg-gray-100 min-h-screen">
      <InfoIcon className="w-12 h-12 mb-4 text-gray-600" />
      <p className="text-xl font-medium text-gray-800">Article not found</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={undefined} />
      </div>
      
      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300 max-w-full overflow-hidden"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Back to articles
            </button>
          </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
          {/* Article Header Section */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 break-words">
              {article.title}
            </h1>
            
            <div className="flex flex-col space-y-3 md:space-y-2 text-sm text-gray-700">
              <div className="flex items-center flex-wrap">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  article.status === "APPROVED" ? "bg-green-500" :
                  article.status === "REJECTED" ? "bg-red-500" : "bg-yellow-500"
                }`}></span>
                <span className="font-medium">Status: {article.status}</span>
              </div>
              
              <div className="flex items-center flex-wrap">
                <UserIcon className="w-4 h-4 mr-1 text-gray-600 flex-shrink-0" />
                <span className="font-medium">Author: </span>
                <Link
                  href={`/admin/members/${article.authorId}`}
                  className="ml-1 text-indigo-600 hover:text-indigo-800 transition-colors break-all"
                >
                  {article.author?.name || "Unknown"}
                </Link>
              </div>
              
              <div className="flex items-center flex-wrap">
                <ClockIcon className="w-4 h-4 mr-1 text-gray-600 flex-shrink-0" />
                <span className="break-all">Created: {article.createdAt ? new Date(article.createdAt).toLocaleString() : "-"}</span>
              </div>
            </div>
          </div>
          
          {/* Article Content */}
          <div className="p-6">
            <div className="prose prose-lg max-w-none text-gray-800 overflow-hidden break-words">
              <div 
                className="break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: tiptapToHtml(article.content || "") }} 
              />
            </div>
          </div>
        </div>

        {/* Moderation Note (if exists) */}
        {article.moderationNote && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-3">
                <InfoIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Moderation Note</h3>
              </div>
              <p className="text-gray-700">{article.moderationNote}</p>
            </div>
          </div>
        )}

        {/* Action Cards - Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* PPV Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <BadgeDollarSignIcon className="w-6 h-6 text-indigo-600 mr-2 flex-shrink-0" />
                <h3 className="text-lg font-medium text-gray-900">Pay-Per-View Settings</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-gray-700 font-medium">Current Rate:</span>
                  <span className="font-mono bg-gray-100 px-3 py-1 rounded-md text-gray-800">
                    ${article.clickValue?.toFixed(2) || "0.00"}
                  </span>
                </div>
                
                {editingPPV ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <span className="text-gray-700 sm:w-24 font-medium">New Rate:</span>
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-600">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={ppvValue}
                          onChange={e => setPPVValue(e.target.value)}
                          className="border border-gray-300 rounded-md pl-8 pr-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-800"
                          disabled={ppvLoading}
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        className="flex items-center justify-center bg-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 text-gray-800"
                        onClick={() => {
                          setEditingPPV(false);
                          setPPVValue(article.clickValue?.toString() || "0");
                        }}
                        disabled={ppvLoading}
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                      <button
                        className="flex items-center justify-center bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        onClick={handlePPVSave}
                        disabled={ppvLoading}
                      >
                        {ppvLoading ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <>
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingPPV(true)}
                    className="w-full flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition-colors mt-2 font-medium"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit Pay-Per-View Rate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Moderation Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ShieldAlertIcon className="w-6 h-6 text-purple-600 mr-2 flex-shrink-0" />
                <h3 className="text-lg font-medium text-gray-900">Article Moderation</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-gray-700 font-medium">Current Status:</span>
                  <span className={`px-2 py-1 rounded-md text-sm font-medium ${
                    article.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    article.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {article.status}
                  </span>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={article.status === "APPROVED" || approveLoading}
                    className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                      article.status === "APPROVED" 
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {approveLoading ? (
                      <span className="animate-spin">...</span>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Approve Article
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={article.status === "REJECTED" || rejectLoading}
                    className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                      article.status === "REJECTED" 
                        ? "bg-red-100 text-red-800 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Reject Article
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
              <div className="flex items-center mb-4">
                <XCircleIcon className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Reject Article</h3>
              </div>
              
              <p className="mb-4 text-gray-700">
                Please provide a reason for rejecting this article. This will be visible to the author.
              </p>
              
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-800"
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                disabled={rejectLoading}
                autoFocus
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 text-gray-800"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  disabled={rejectLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                  onClick={handleReject}
                  disabled={rejectLoading || !rejectReason.trim()}
                >
                  {rejectLoading ? (
                    <span className="animate-spin">...</span>
                  ) : (
                    <>
                      <XCircleIcon className="w-5 h-5 mr-2" />
                      Confirm Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
      
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={undefined} />
      </div>
    </div>
  );
};

export default ArticleDetailPage;