"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  onWatchComplete: () => void;
  duration?: number;
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, onWatchComplete, duration = 30 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [hasCompletedWatch, setHasCompletedWatch] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      if (video.currentTime >= 10 && !hasCompletedWatch) {
        setHasCompletedWatch(true);
        onWatchComplete();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowThumbnail(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [hasCompletedWatch, onWatchComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-auto"
        onClick={togglePlay}
      />

      {showThumbnail && thumbnailUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <button
            onClick={togglePlay}
            className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors"
          >
            <Play className="h-8 w-8 ml-1" />
          </button>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <div className="flex-1 mx-4">
            <div className="bg-white bg-opacity-30 h-1 rounded">
              <div
                className="bg-red-600 h-1 rounded"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded mr-2"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <span className="text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {currentTime >= 10 && (
          <div className="mt-2 text-center">
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              ✓ Watch requirement met!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}