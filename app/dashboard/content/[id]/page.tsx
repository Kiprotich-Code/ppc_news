"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { useEditor, EditorContent } from "@tiptap/react"; // TipTap React components
import StarterKit from "@tiptap/starter-kit"; // Basic extensions
import { Share2, Copy, CheckCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string; // Raw TipTap JSON
  status: string;
  views: number;
  earnings: number;
  images?: string[];
  featuredImage?: string;
  createdAt?: string;
  publishedAt?: string;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Initialize TipTap editor (read-only for rendering)
  const editor = useEditor({
    extensions: [StarterKit],
    content: "", // Initial content is empty; will be set dynamically
    editable: false, // Read-only mode for rendering
    immediatelyRender: false, // Explicitly set to false for SSR
  });

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarOpen(window.innerWidth >= 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showShareMenu && !target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    console.log("ID:", id, "Session:", session, "Status:", status);
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (!id) {
      console.error("No article ID provided");
      setError("No article ID provided");
      setIsLoading(false);
      return;
    }
    fetchArticle();
  }, [session, status, id]);

  useEffect(() => {
    if (!article || isLoading || error) return;
    console.log("Article loaded:", article);
    if (article.status === "APPROVED") {
      fetch(`/api/articles/${article.id}/view`, { method: "POST" });
    }
    // Update editor content with the raw JSON
    if (editor && article.content) {
      try {
        const parsedContent = JSON.parse(article.content); // Parse the JSON string
        editor.commands.setContent(parsedContent); // Set content without focusing
      } catch (e) {
        console.error("Failed to parse article content:", e);
        setError("Invalid article content format");
      }
    }
  }, [article, isLoading, error, editor]);

  const fetchArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      console.log("API response:", data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch article");
      if (!data.article) throw new Error("Article not found");
      setArticle(data.article);
    } catch (e: unknown) {
      console.error("Fetch error:", e);
      setError(e instanceof Error ? e.message : "Unknown error");
      setArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!article) return;
    
    // Generate the public shareable link
    const shareUrl = `${window.location.origin}/feed/${article.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleShare = (platform: string) => {
    if (!article) return;
    
    const shareUrl = `${window.location.origin}/feed/${article.id}`;
    const title = article.title;
    const description = `📰 ${title}\n\nRead the full article on PayPost.co.ke\n${shareUrl}`;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`📰 ${title}`)}&url=${encodeURIComponent(shareUrl)}&via=paypost`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(description)}`, '_blank');
        break;
      case 'copy':
        handleCopyLink();
        break;
    }
    setShowShareMenu(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? "md:ml-64" : "md:ml-20"} mt-4 pb-20`}>
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? "md:ml-64" : "md:ml-20"} mt-4 pb-20 flex items-center justify-center`}>
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => router.push("/dashboard/content")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Content
            </button>
          </div>
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? "md:ml-64" : "md:ml-20"} mt-4 pb-20 flex items-center justify-center`}>
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-600 mb-2">Article Not Found</h2>
            <p className="text-gray-700 mb-4">The requested article could not be found.</p>
            <button
              onClick={() => router.push("/dashboard/content")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Content
            </button>
          </div>
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div
        className={`fixed md:static inset-0 z-40 md:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${sidebarOpen ? "md:ml-64" : "md:ml-20"} mt-4 pb-20`}>
          <div className="px-4 sm:px-6 md:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <Link
                  href="/dashboard/content"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Content Library
                </Link>
                <div className="flex items-center gap-3">
                  {/* Share Button */}
                  <div className="relative share-menu-container">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </button>

                    {/* Share Menu Dropdown */}
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleShare('copy')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {copySuccess ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                                Link Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-3" />
                                Copy Link
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className="h-4 w-4 mr-3">📱</span>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('twitter')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className="h-4 w-4 mr-3">🐦</span>
                            Twitter
                          </button>
                          <button
                            onClick={() => handleShare('facebook')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className="h-4 w-4 mr-3">📘</span>
                            Facebook
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Article Button */}
                  <Link
                    href={`/dashboard/articles/new?edit=${article.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Edit Article
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {article.featuredImage && (
                  <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 relative">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="p-4 sm:p-6 md:p-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                    {article.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          article.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : article.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : article.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {article.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>👁️ {article.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💰 ${article.earnings.toFixed(2)}</span>
                    </div>
                    {article.createdAt && (
                      <div className="flex items-center gap-1">
                        <span>📅 {new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Render TipTap content using EditorContent */}
                  <EditorContent editor={editor} className="prose prose-sm sm:prose-base max-w-none" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}