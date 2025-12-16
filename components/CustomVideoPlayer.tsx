'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, MoreVertical, Maximize, Download, Share2 } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  className?: string;
}

export default function CustomVideoPlayer({ src, className = '' }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
      if (showMenu && !event.target || !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    if (showVolumeSlider || showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider, showMenu]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (!isFullscreen) {
      // Save scroll position before entering fullscreen
      scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement);
      
      setIsFullscreen(isFull);
      
      // Restore scroll position when exiting fullscreen
      if (!isFull && scrollPositionRef.current !== undefined) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant' as ScrollBehavior
          });
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowMenu(false);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Video',
          url: src,
        });
      } else {
        await navigator.clipboard.writeText(src);
        alert('Video link copied to clipboard');
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

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
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#0a0a0a] rounded-2xl overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (!showVolumeSlider) setShowVolumeSlider(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className={isFullscreen ? 'w-screen h-screen object-contain' : 'w-full h-auto'}
        style={{ maxHeight: isFullscreen ? '100vh' : '600px', display: 'block' }}
        playsInline
      />

      {/* Controls overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end gap-2 pointer-events-auto">
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 bg-[#111] border border-[#222] rounded-xl shadow-2xl min-w-[160px] py-1.5 overflow-hidden z-50">
                <button 
                  onClick={handleDownload}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#aaa] hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button 
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#aaa] hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Bottom controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 pointer-events-auto transition-opacity duration-300 ${isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          {/* Timeline */}
          <div className="mb-4">
            <div 
              className="relative h-1 bg-white/20 rounded-full cursor-pointer group/timeline"
              onClick={(e) => {
                const video = videoRef.current;
                if (!video) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                video.currentTime = percent * duration;
                setCurrentTime(percent * duration);
              }}
            >
              <div 
                className="absolute left-0 top-0 h-full bg-[var(--accent)] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--accent)] rounded-full opacity-0 group-hover/timeline:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Volume */}
            <div 
              ref={volumeRef}
              className="relative flex items-center"
            >
              <button
                onClick={() => {
                  if (showVolumeSlider) {
                    setShowVolumeSlider(false);
                  } else {
                    setShowVolumeSlider(true);
                  }
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <div 
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-4 bg-[#111] backdrop-blur-md rounded-xl border border-[#222] transition-all duration-300 ease-out ${
                  showVolumeSlider ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible pointer-events-none'
                }`}
                onWheel={(e) => {
                  e.preventDefault();
                  const video = videoRef.current;
                  if (!video) return;
                  
                  const delta = e.deltaY > 0 ? -0.05 : 0.05;
                  const newVolume = Math.max(0, Math.min(1, volume + delta));
                  video.volume = newVolume;
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-[#aaa]">{Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer volume-slider"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${volume * 100}%, #333 ${volume * 100}%, #333 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>

            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs text-white/90 ml-auto font-mono tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.3);
        }

        .volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}

