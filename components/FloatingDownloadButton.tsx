"use client";

import React, { useState } from 'react';
import { Download, X, Smartphone, ArrowRight } from 'lucide-react';

interface FloatingDownloadButtonProps {
  className?: string;
}

export const FloatingDownloadButton: React.FC<FloatingDownloadButtonProps> = ({ 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Expanded card */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 mb-2 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Download Our App</h3>
                <p className="text-sm text-gray-600">Get the best reading experience</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Offline reading support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Push notifications for new articles</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Better performance and speed</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button 
              onClick={() => {
                // Handle Android APK download
                window.open('/downloads/paypost-app.apk', '_blank');
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download APK (Android)
            </button>
            
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <span>Coming soon for iOS</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Don't show again
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isExpanded ? 'rotate-0' : 'hover:scale-110'
        }`}
      >
        {isExpanded ? (
          <X className="w-5 h-5" />
        ) : (
          <Download className="w-5 h-5 group-hover:animate-bounce" />
        )}
      </button>
    </div>
  );
};
