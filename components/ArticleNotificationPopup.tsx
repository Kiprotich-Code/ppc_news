"use client";

import React, { useEffect, useState } from 'react';
import { Bell, X, User, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getCategoryConfig } from '@/lib/categories';

interface ArticleNotification {
  id: string;
  title: string;
  authorName: string;
  authorUsername: string;
  authorImage: string | null;
  category: string;
  publishedAt: string;
  articleId: string;
}

interface ArticleNotificationPopupProps {
  className?: string;
}

export const ArticleNotificationPopup: React.FC<ArticleNotificationPopupProps> = ({ 
  className = "" 
}) => {
  const [notifications, setNotifications] = useState<ArticleNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<ArticleNotification | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before running effects
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to check for new articles
  const checkForNewArticles = async () => {
    if (!mounted) return;
    try {
      const response = await fetch('/api/recent-articles');
      if (response.ok) {
        const data = await response.json();
        const newArticles = data.articles || [];
        
        // Filter articles published after last check
        const recentArticles = lastChecked 
          ? newArticles.filter((article: any) => 
              new Date(article.publishedAt) > new Date(lastChecked)
            )
          : newArticles.slice(0, 1); // Show only the latest one on first load

        if (recentArticles.length > 0) {
          setNotifications(recentArticles);
          showNextNotification(recentArticles);
        }
        
        setLastChecked(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to fetch recent articles:', error);
    }
  };

  // Show notifications one by one
  const showNextNotification = (notificationList: ArticleNotification[]) => {
    if (!mounted || notificationList.length === 0) return;
    
    setCurrentNotification(notificationList[0]);
    setIsVisible(true);
    
    // Auto-hide after 6 seconds
    const hideTimer = setTimeout(() => {
      hideCurrentNotification();
      // Show next notification if any
      if (notificationList.length > 1) {
        setTimeout(() => {
          showNextNotification(notificationList.slice(1));
        }, 1000);
      }
    }, 6000);

    return () => clearTimeout(hideTimer);
  };

  const hideCurrentNotification = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentNotification(null);
    }, 300);
  };

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

  // Check for new articles every 2 minutes, only when mounted
  useEffect(() => {
    if (!mounted) return;
    
    checkForNewArticles();
    
    const interval = setInterval(() => {
      checkForNewArticles();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [mounted, lastChecked]);

  // Don't render anything during SSR or before mount
  if (!mounted || !isVisible || !currentNotification) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-medium text-sm">New Article Published</span>
            </div>
            <button
              onClick={hideCurrentNotification}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {currentNotification.authorImage ? (
                <img
                  src={currentNotification.authorImage}
                  alt={currentNotification.authorName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold text-gray-900">{currentNotification.authorName}</span>
                {' '}recently wrote about{' '}
                <span className="font-medium text-red-600">
                  {currentNotification.category ? getCategoryConfig(currentNotification.category).name.toLowerCase() : 'a topic'}
                </span>
              </p>
              
              <Link 
                href={`/feed/${currentNotification.articleId}`}
                onClick={hideCurrentNotification}
                className="block"
              >
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-red-600 transition-colors cursor-pointer">
                  {currentNotification.title}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {getTimeAgo(currentNotification.publishedAt)}
                </span>
                {currentNotification.category && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryConfig(currentNotification.category).color}`}>
                      {getCategoryConfig(currentNotification.category).name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          <Link 
            href={`/feed/${currentNotification.articleId}`}
            onClick={hideCurrentNotification}
            className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Read Article
          </Link>
        </div>
      </div>
    </div>
  );
};
