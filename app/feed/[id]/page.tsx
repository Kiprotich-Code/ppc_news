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
  Share2, 
  Bookmark, 
  Heart, 
  MessageCircle, 
  User,
  ChevronUp,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  CheckCircle,
  FileText
} from "lucide-react";
import { tiptapToHtml } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.title || '';
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        break;
    }
    setShowShareMenu(false);
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/feed" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      {/* Back to Feed Button - Fixed Position */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </button>
      </div>

      {/* Article Container */}
      <article className="max-w-4xl mx-auto bg-white shadow-sm">
        {/* Article Header */}
        <header className="px-8 pt-20 pb-8">
          {/* Huge Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8">
            {article.title}
          </h1>

          {/* Author Section */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
              {article.authorImage ? (
                <Image
                  src={article.authorImage}
                  alt={article.authorName || "Author"}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-15 h-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium text-gray-900 text-lg">
                  {article.authorName || "Anonymous"}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Draft"}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {readTime}
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {article.views.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>

          {/* Article Actions */}
          <div className="flex items-center justify-between border-t border-b border-gray-200 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isLiked 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">
                  {isLiked ? 'Liked' : 'Like'}
                </span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isBookmarked 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">
                  {isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all duration-200">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Comment</span>
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>

              {/* Share Dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Twitter className="w-4 h-4 mr-3 text-blue-400" />
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Facebook className="w-4 h-4 mr-3 text-blue-600" />
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Linkedin className="w-4 h-4 mr-3 text-blue-700" />
                      Share on LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-3 text-gray-500" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
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
        <div className="px-8 py-12">
          <div 
            className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg prose-img:shadow-md" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>

        {/* CTA Section */}
        <div className="relative border-t border-gray-200 bg-gradient-to-br from-red-50 via-white to-red-50 px-8 py-16 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-8 left-8 w-32 h-32 bg-red-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-8 right-8 w-40 h-40 bg-red-500 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-300 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-3xl mx-auto text-center">
            {/* Main icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved this article?
            </h3>
            <p className="text-lg text-gray-600 mb-4 max-w-xl mx-auto">
              Join thousands of readers discovering amazing stories every day
            </p>
            
            {/* Stats showcase */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <Eye className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Daily Readers</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">1K+</div>
                <div className="text-sm text-gray-600">Articles</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mx-auto mb-2">
                  <User className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Writers</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/feed"
                className="group inline-flex items-center px-8 py-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Explore More Articles
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Free to read
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Quality content
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Expert writers
              </div>
            </div>
          </div>
        </div>

        {/* Author Bio Section */}
        <div className="border-t border-gray-200 px-8 py-8">
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              {article.authorImage ? (
                <Image
                  src={article.authorImage}
                  alt={article.authorName || "Author"}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {article.authorName || "Anonymous"}
              </h4>
              <p className="text-gray-600 mb-4">
                {article.authorBio || "Passionate writer sharing insights and stories with the world."}
              </p>
              <Link
                href={`/author/${article.authorId}`}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
          className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}