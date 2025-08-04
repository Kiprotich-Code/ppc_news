"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Eye, Clock, ArrowRight, MessageCircle, Share, FileText } from "lucide-react";
import useSWR from "swr";
import { Navigation } from "@/components/Navigation";

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
      <section className="max-w-4xl mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore</h1>
          <p className="text-gray-600">Discover the latest insights from our community of writers</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className="text-red-600 text-center py-8">Failed to load articles.</div>}

        {/* Articles Feed */}
        <div className="space-y-4">
          {articles.map((article: any) => {
            const contentText = extractTextFromTipTap(article.content);

            return (
              <div key={article.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <Link href={`/feed/${article.id}`}>
                <div className="flex p-4">
                  {/* Left side - Image */}
                  <div className="flex-shrink-0 w-32 h-24">
                    {article.featuredImage ? (
                      <div className="relative w-full h-full rounded-l-lg overflow-hidden">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-l-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Right side - Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-h-24">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-medium text-gray-900 line-clamp-2 flex-1 mr-4 leading-tight">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            Published
                          </span>
                          <span className="text-xs text-gray-500">
                            {article.publishedAt ? getTimeAgo(article.publishedAt) : "Draft"}
                          </span>
                          <Link
                            href={`/feed/${article.id}`}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <span className="text-sm">See More</span>
                            <ArrowRight className="w-3 h-3 ml-1 inline" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                      <div className="flex items-center gap-6">
                        <span className="flex items-center">
                          <span className="mr-1">Reach</span>
                          <span className="font-medium text-gray-700">
                            {formatNumber(article.views || 0)}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">Clicks</span>
                          <span className="font-medium text-gray-700">
                            {formatNumber(article.clicks || 0)}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">Shares</span>
                          <span className="font-medium text-gray-700">
                            {formatNumber(article.shares || 0)}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">Comments</span>
                          <span className="font-medium text-gray-700">
                            {formatNumber(article.comments || 0)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </Link>
              </div>
            );
          })}

          {/* Empty State */}
          {(!isLoading && articles.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No published articles yet.</div>
              <p className="text-gray-400 mt-2">Check back later for new content!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}