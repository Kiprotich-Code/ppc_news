"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Eye, Clock, ArrowRight, MessageCircle, Share, FileText, X } from "lucide-react";
import useSWR from "swr";
import { Navigation } from "@/components/Navigation";
import { ShareButton } from "@/components/ShareButton";
import { getCategoryConfig } from "@/lib/categories";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Utility function to extract text from TipTap JSON content
const extractTextFromTipTap = (content: string): string => {
  try {
    const parsed = JSON.parse(content);
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(' ');
      }
      return '';
    };
    return extractText(parsed);
  } catch (error) {
    return content;
  }
};

// Utility function to format numbers (e.g., 19800 -> 19.8k)
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// Utility function to get time ago
const getTimeAgo = (date: string): string => {
  const now = new Date();
  const publishedDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w`;
};

export default function PublicFeed() {
  const { data, error, isLoading } = useSWR("/api/public-feed", fetcher);
  const articles = data?.articles || [];

  return (
    <>
      <Navigation />
      <section className="max-w-2xl mx-auto px-4 py-6">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Explore</h1>
          <p className="text-gray-600 text-sm">Discover the latest insights from our community</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            <p className="mt-3 text-gray-600 text-sm">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className="text-red-600 text-center py-8 text-sm">Failed to load articles.</div>}

        {/* Articles Feed */}
        <div className="space-y-3">
          {articles.map((article: any) => {
            const contentText = extractTextFromTipTap(article.content);

            return (
              <div key={article.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-3">
                  {/* Header with source info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">paypost.co.ke</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">
                        {article.publishedAt ? getTimeAgo(article.publishedAt) : "Draft"}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <ShareButton 
                        url={`/feed/${article.id}`}
                        title={article.title}
                        size="sm"
                        variant="ghost"
                        align="left"
                        className="text-xs p-1"
                      />
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="flex gap-3">
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/feed/${article.id}`}>
                        <h2 className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-3 hover:text-red-600 transition-colors">
                          {article.title}
                        </h2>
                      </Link>
                      
                      {/* Category badge */}
                      {article.category && (
                        <div className="mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryConfig(article.category).color}`}>
                            {getCategoryConfig(article.category).name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Image */}
                    <Link href={`/feed/${article.id}`} className="flex-shrink-0">
                      {article.featuredImage ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={article.featuredImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {(!isLoading && articles.length === 0) && (
            <div className="text-center py-16">
              <div className="text-gray-500 text-base">No published articles yet.</div>
              <p className="text-gray-400 mt-1 text-sm">Check back later for new content!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}