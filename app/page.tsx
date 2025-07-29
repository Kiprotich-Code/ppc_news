"use client"

import React from "react";
import Link from "next/link";
import { FileText, User, Eye, Clock } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  const mockArticles = [
    {
      id: 1,
      title: "New IEBC Chairperson and Commissioners Set for Swearing-In",
      author: "Faith Mwangi",
      views: "18.3K",
      readTime: "6 min",
      category: "Politics",
      excerpt: "High Court clears the way for swearing-in of new Electoral Commission leadership as Kenya prepares for future elections."
    },
    {
      id: 2,
      title: "KRA Surpasses Revenue Target Despite Economic Challenges",
      author: "Peter Kariuki",
      views: "14.7K",
      readTime: "8 min",
      category: "Economy",
      excerpt: "Kenya Revenue Authority collects Sh2.571 trillion in 2024/2025, beating target by Sh16 billion amid tough economic conditions."
    },
    {
      id: 3,
      title: "Kenya Secures CAF Approval for 2024 CHAN Tournament",
      author: "Samuel Otieno",
      views: "12.1K",
      readTime: "5 min",
      category: "Sports",
      excerpt: "Final nod from African football body confirms Kenya's readiness to host the continental championship for home-based players."
    },
    {
      id: 4,
      title: "Digital Financial Services Reach 12 Million Kenyans",
      author: "Grace Wanjiku",
      views: "16.8K",
      readTime: "7 min",
      category: "Technology",
      excerpt: "Government initiative expands mobile money and digital banking access to underserved communities across the country."
    },
    {
      id: 5,
      title: "Nairobi Road Works Project Enters Second Phase",
      author: "James Mbugua",
      views: "9.5K",
      readTime: "4 min",
      category: "Infrastructure",
      excerpt: "Sh1.4 billion road improvement project continues through November 2025, affecting major city routes and traffic patterns."
    },
    {
      id: 6,
      title: "Kenya's Economic Growth Shows Resilience Amid Global Challenges",
      author: "Dr. Mary Njoroge",
      views: "13.2K",
      readTime: "10 min",
      category: "Economy",
      excerpt: "Analysis of Kenya's economic performance and recovery strategies in the face of international market pressures."
    },
    {
      id: 7,
      title: "Youth Entrepreneurship Programs Gain Momentum Nationwide",
      author: "David Kimani",
      views: "11.4K",
      readTime: "6 min",
      category: "Business",
      excerpt: "Government and private sector initiatives create new opportunities for young entrepreneurs across various industries."
    },
    {
      id: 8,
      title: "Climate Action: Kenya's Green Energy Transition Progress",
      author: "Dr. Elizabeth Waweru",
      views: "8.9K",
      readTime: "9 min",
      category: "Environment",
      excerpt: "Update on renewable energy projects and environmental conservation efforts as Kenya leads East Africa's green transition."
    },
    {
      id: 9,
      title: "Education Sector Reforms: New Policies Take Effect",
      author: "Margaret Akinyi",
      views: "15.6K",
      readTime: "8 min",
      category: "Education",
      excerpt: "Latest developments in Kenya's education system including curriculum changes and infrastructure improvements."
    },
    {
      id: 10,
      title: "Healthcare Innovation: Telemedicine Expands to Rural Areas",
      author: "Dr. Michael Ochieng",
      views: "10.7K",
      readTime: "7 min",
      category: "Health",
      excerpt: "Digital health platforms bridge the gap between urban medical expertise and rural communities across Kenya."
    },
    {
      id: 11,
      title: "Tourism Recovery: Visitor Numbers Show Strong Growth",
      author: "Anne Wairimu",
      views: "7.3K",
      readTime: "5 min",
      category: "Tourism",
      excerpt: "Kenya's tourism sector bounces back with increased international arrivals and domestic travel initiatives."
    },
    {
      id: 12,
      title: "Agriculture Modernization: Tech Solutions for Farmers",
      author: "John Mwangi",
      views: "12.8K",
      readTime: "8 min",
      category: "Agriculture",
      excerpt: "Smart farming technologies and digital platforms help Kenyan farmers improve productivity and market access."
    }
  ];

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