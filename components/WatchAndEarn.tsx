"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { VideoPlayer } from './VideoPlayer';
import { Play, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  createdAt: string;
}

interface UserLevel {
  currentLevel: number;
  videosWatchedToday: number;
  maxVideosPerDay: number;
  canWatchMore: boolean;
  nextLevel?: {
    level: number;
    name: string;
    activationFee: number;
  };
}

export function WatchAndEarn() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<Video[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      fetchVideos();
      fetchUserLevel();
    }
  }, [session]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    }
  };

  const fetchUserLevel = async () => {
    try {
      const response = await fetch('/api/user/level');
      if (response.ok) {
        const data = await response.json();
        setUserLevel(data);
      }
    } catch (error) {
      console.error('Error fetching user level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchComplete = async () => {
    if (!selectedVideo) return;

    try {
      const response = await fetch('/api/videos/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: selectedVideo.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`🎉 Earned ${formatCurrency(data.reward)} for watching!`);
        setWatchedVideos(prev => new Set(prev).add(selectedVideo.id));
        fetchUserLevel(); // Refresh user level stats
      } else {
        toast.error(data.error || 'Failed to process reward');
      }
    } catch (error) {
      console.error('Error processing watch:', error);
      toast.error('Failed to process reward');
    }
  };

  const handleUpgradeLevel = async (targetLevel: number) => {
    if (!userLevel?.nextLevel) return;

    try {
      const response = await fetch('/api/user/level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetLevel }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Upgraded to Level ${targetLevel}!`);
        fetchUserLevel(); // Refresh user level stats
      } else {
        toast.error(data.error || 'Failed to upgrade level');
      }
    } catch (error) {
      console.error('Error upgrading level:', error);
      toast.error('Failed to upgrade level');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Watch & Earn</h1>
        <p className="text-gray-600">Watch videos for at least 10 seconds to earn rewards based on your level</p>
      </div>

      {/* User Level Stats */}
      {userLevel && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-red-800">Your Level: {userLevel.currentLevel}</h2>
              <p className="text-red-600">Videos watched today: {userLevel.videosWatchedToday}/{userLevel.maxVideosPerDay}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600 mb-2">
                <DollarSign className="h-5 w-5 mr-1" />
                <span className="font-semibold">
                  Earn {userLevel.currentLevel === 1 ? 'Ksh 2' :
                        userLevel.currentLevel === 2 ? 'Ksh 4' :
                        userLevel.currentLevel === 3 ? 'Ksh 8' :
                        userLevel.currentLevel === 4 ? 'Ksh 20' : 'Ksh 30'} per video
                </span>
              </div>
              {!userLevel.canWatchMore && (
                <div className="flex items-center text-orange-600 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Daily limit reached
                </div>
              )}
            </div>
          </div>

          {/* Level Upgrade */}
          {userLevel.nextLevel && (
            <div className="border-t border-red-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">Upgrade to {userLevel.nextLevel.name}</h3>
                  <p className="text-sm text-red-600">
                    Earn {userLevel.nextLevel.level === 2 ? 'Ksh 4' :
                          userLevel.nextLevel.level === 3 ? 'Ksh 8' :
                          userLevel.nextLevel.level === 4 ? 'Ksh 20' : 'Ksh 30'} per video
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeLevel(userLevel.nextLevel!.level)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Upgrade for {formatCurrency(userLevel.nextLevel.activationFee)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Player */}
      {selectedVideo && (
        <div className="mb-8">
          <VideoPlayer
            videoUrl={selectedVideo.videoUrl}
            thumbnailUrl={selectedVideo.thumbnailUrl}
            title={selectedVideo.title}
            onWatchComplete={handleWatchComplete}
            duration={selectedVideo.duration}
          />
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-900">{selectedVideo.title}</h3>
            {selectedVideo.description && (
              <p className="text-gray-600 mt-2">{selectedVideo.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="aspect-video bg-gray-200 relative">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <Play className="h-12 w-12 text-gray-500" />
                </div>
              )}

              {watchedVideos.has(video.id) && (
                <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}

              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
              {video.description && (
                <p className="text-gray-600 text-sm line-clamp-2">{video.description}</p>
              )}
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Watch 10s to earn
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos available</h3>
          <p className="text-gray-600">Check back later for new videos to watch and earn!</p>
        </div>
      )}
    </div>
  );
}