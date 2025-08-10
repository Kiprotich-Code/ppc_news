"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Clock, 
  Bookmark, 
  Heart, 
  MessageCircle, 
  User,
  ChevronUp,
  CheckCircle,
  FileText
} from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { tiptapToHtml } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data, error, isLoading } = useSWR(id ? `/api/public-article/${id}` : null, fetcher);
  const article = data?.article;

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track article view
  useEffect(() => {
    if (id) {
      fetch(`/api/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
    }
  }, [id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: API call to like/unlike article
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: API call to bookmark/unbookmark article
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600 text-base">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl text-gray-300 mb-4">📄</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6 text-sm">The article you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/feed" 
            className="inline-flex items-center px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const htmlContent = tiptapToHtml(article.content);
  const readTime = formatReadTime(article.content);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Back to Feed Button - Floating */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-all duration-200 z-50"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Article Container */}
      <article className="max-w-3xl w-full bg-white shadow-sm">
        {/* Article Header */}
        <header className="px-6 pt-16 pb-6">
          {/* Adjusted Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {article.title}
          </h1>

          {/* Author Section */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative">
              {article.authorImage ? (
                <Image
                  src={article.authorImage}
                  alt={article.authorName || "Author"}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="font-medium text-gray-900 text-base">
                  {article.authorName || "Anonymous"}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Draft"}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {readTime}
                </span>
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {article.views.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>

          {/* Article Actions */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${
                  isLiked 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">
                  {isLiked ? 'Liked' : 'Like'}
                </span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${
                  isBookmarked 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">
                  {isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>
              
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all duration-200 text-sm">
                <MessageCircle className="w-3 h-3" />
                <span className="text-xs font-medium">Comment</span>
              </button>
            </div>

            <ShareButton 
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={article?.title || ''}
              size="sm"
              variant="outline"
            />
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="px-6 py-10">
          <div 
            className="prose prose-base prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg prose-img:shadow-sm" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>

        {/* CTA Section */}
        <div className="relative bg-gradient-to-br from-red-50 via-white to-red-50 px-6 py-12 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-6 left-6 w-24 h-24 bg-red-500 rounded-full blur-2xl"></div>
            <div className="absolute bottom-6 right-6 w-32 h-32 bg-red-500 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-300 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative max-w-2xl mx-auto text-center">
            {/* Main icon */}
            
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Loved this article?
            </h3>
            <p className="text-base text-gray-600 mb-4 max-w-md mx-auto">
              Join thousands of readers discovering amazing stories every day
            </p>
            
            {/* Stats showcase */}
            <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <Eye className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-xl font-bold text-gray-900">50K+</div>
                <div className="text-xs text-gray-600">Daily Readers</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-xl font-bold text-gray-900">1K+</div>
                <div className="text-xs text-gray-600">Articles</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <User className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-xl font-bold text-gray-900">500+</div>
                <div className="text-xs text-gray-600">Writers</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/feed"
                className="group inline-flex items-center px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Explore More Articles
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                Free to read
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                Quality content
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                Expert writers
              </div>
            </div>
          </div>
        </div>

        {/* Author Bio Section */}
        <div className="px-6 py-6">
          <div className="flex items-start space-x-3 max-w-2xl mx-auto">
            <div className="relative flex-shrink-0">
              {article.authorImage ? (
                <Image
                  src={article.authorImage}
                  alt={article.authorName || "Author"}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {article.authorName || "Anonymous"}
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                {article.authorBio || "Passionate writer sharing insights and stories with the world."}
              </p>
              <Link
                href={`/author/${article.authorId}`}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
              >
                View Profile →
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-all duration-200 z-50"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}