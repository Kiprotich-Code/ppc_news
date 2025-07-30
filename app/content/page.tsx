"use client";

import React from "react";
import Link from "next/link";
import { User, Eye, Clock } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PublicFeed() {
  const { data, error, isLoading } = useSWR("/api/public-feed", fetcher);
  // Only show articles with status 'APPROVED'
  const articles = (data?.articles || []).filter((article: any) => article.status === 'APPROVED');

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Latest Published Articles</h2>
      {isLoading && <div>Loading articles...</div>}
      {error && <div className="text-red-600">Failed to load articles.</div>}
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
        {articles.map((article: any) => (
          <Link key={article.id} href={`/content/${article.id}`} className="block bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900">{article.title}</span>
              <span className="text-xs text-gray-500">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Draft"}</span>
            </div>
            <div className="text-gray-700 line-clamp-2 mb-2">{article.content?.slice(0, 120)}...</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span><User className="inline w-4 h-4 mr-1" />{article.authorName || "Unknown"}</span>
              <span><Eye className="inline w-4 h-4 mr-1" />{article.views}</span>
              <span><Clock className="inline w-4 h-4 mr-1" />{article.readTime || "-"}</span>
            </div>
          </Link>
        ))}
        {(!isLoading && articles.length === 0) && <div className="text-gray-500">No published articles yet.</div>}
      </div>
    </section>
  );
}
