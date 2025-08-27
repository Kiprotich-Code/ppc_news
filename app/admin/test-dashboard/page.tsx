"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, Eye, FileText, Bell, Download } from 'lucide-react';

interface TestArticle {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  authorName: string;
  authorUsername: string;
  authorImage: string | null;
  viewCount: number;
  featuredImage: string | null;
}

export default function TestDashboard() {
  const [articles, setArticles] = useState<TestArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/admin/recent-articles');
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Dashboard</h1>
              <p className="text-gray-600">Monitor recent articles and test notifications</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="w-4 h-4" />
                <span>Notifications Active</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="w-4 h-4" />
                <span>APK Download Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
            <p className="text-sm text-gray-600">Articles that trigger notifications</p>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No articles found
              </div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {article.authorImage ? (
                        <img
                          src={article.authorImage}
                          alt={article.authorName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-gray-700">
                              {article.authorName}
                            </span>
                            <span className="text-sm text-gray-500">
                              @{article.authorUsername}
                            </span>
                            {article.category && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-red-600 capitalize">
                                  {article.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 ml-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye className="w-4 h-4" />
                            <span>{article.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeAgo(article.publishedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Testing Instructions</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Visit <code className="bg-blue-100 px-1 rounded">/feed</code> to see the floating download button and notification popup</p>
            <p>• Notifications appear for articles published in the last 24 hours</p>
            <p>• The download button expands to show app information</p>
            <p>• New article notifications check every 2 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
