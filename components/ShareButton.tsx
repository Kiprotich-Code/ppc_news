"use client";

import { useState } from "react";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy, 
  CheckCircle 
} from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'solid';
  align?: 'left' | 'right';
}

export function ShareButton({ 
  url, 
  title, 
  className = "",
  size = 'sm',
  variant = 'outline',
  align = 'right'
}: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = (platform: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(fullUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  const variantClasses = {
    outline: 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    solid: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowShareMenu(!showShareMenu);
        }}
        className={`flex items-center space-x-1.5 rounded-lg transition-all duration-200 font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        <Share2 className={iconSize[size]} />
        <span>Share</span>
      </button>

      {/* Share Dropdown */}
      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`absolute mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-30 overflow-hidden ${
            align === 'left' ? 'left-0' : 'right-0'
          } ${
            // Adjust positioning on very small screens
            'max-w-[calc(100vw-2rem)] sm:max-w-none'
          }`}>
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare('twitter');
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Twitter className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
                <span className="truncate">Twitter</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare('facebook');
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Facebook className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">Facebook</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare('linkedin');
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="w-4 h-4 mr-3 text-blue-700 flex-shrink-0" />
                <span className="truncate">LinkedIn</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare('copy');
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                    <span className="text-green-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                    <span className="truncate">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
