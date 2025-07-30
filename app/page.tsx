"use client"

import React from "react";
import Link from "next/link";
import { FileText, User, Eye, Clock } from "lucide-react";
import { Navigation } from "@/components/Navigation";


import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/public-feed", fetcher);
  const articles = data?.articles || [];

  const categoryColors = {
    Politics: "text-red-600",
    Economy: "text-green-600",
    Sports: "text-blue-600",
    Technology: "text-purple-600",
    Infrastructure: "text-orange-600",
    Business: "text-indigo-600",
    Environment: "text-emerald-600",
    Education: "text-yellow-600",
    Health: "text-teal-600",
    Tourism: "text-pink-600",
    Agriculture: "text-amber-600"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-red-50 py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          {/* Left: Text */}
          <div className="max-w-xl w-full mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Create. <span className="text-primary-red">Share.</span> Earn
            </h1>
            <p className="text-gray-700 text-lg mb-8">
              Share your stories, opinions and life with over 350 million global active users.
            </p>
            <a href="/auth/signin" className="button-red">
              Login / SignUp
              <span className="ml-2">&#8594;</span>
            </a>
          </div>
          {/* Right: Illustration/Logo */}
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Placeholder illustration */}
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="180" height="180" rx="40" fill="#e60012" />
                <text x="50%" y="54%" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" dy=".3em">N</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Articles List */}
      <section className="border-2 border-dashed border-gray-300 py-16 mx-auto my-16 max-w-4xl">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-red-800 mb-6">
            Got something to say?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We pay writers. Simple as that. Write about whatever's on your mind, publish it here, and we'll send you money when people read it.
          </p>

          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-700">
              <strong>Last month:</strong> Mary from Nakuru earned Ksh 18,400 writing about her neighbor's chicken business.
              <br /><br />
              <strong>This week:</strong> John's rant about traffic jams made him Ksh 3,200.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/auth/register">
              <button className="w-full max-w-sm bg-red-600 text-white px-8 py-3 rounded font-medium hover:bg-red-700 transition-colors">
                Start Writing
              </button>
            </Link>
            <p className="text-sm text-gray-500">
              Takes 2 minutes to set up. No credit card needed.
            </p>
          </div>
        </div>
      </section>

      {/* Public Article Feed */}
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

      <footer className="bg-gray-50 border-t border-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-red-600" />
              <span className="text-lg font-bold text-red-800">NewsHub</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 PPCNews. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}