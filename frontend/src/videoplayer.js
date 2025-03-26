import { useRef, useState, useEffect, useCallback } from "react";
import { requestSubtitle } from "./ApiService.js";
import { Button, Form, Overlay, Stack, ProgressBar, ToggleButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VideoPlayer() {
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const playToggleBtnRef = useRef(null);
  const buttonRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const touchStartXRef = useRef(null);
  const initialTimeRef = useRef(null);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeAmount, setSwipeAmount] = useState(0);
  const totalSwipeRef = useRef(0);
  const touchTargetIsControlRef = useRef(false);
  const swipeIndicatorTimerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const [subToggle, setSubToggle] = useState('Sub O');
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);
  const [subtitleUrl, setSubtitleUrl] = useState(null);

  const [caption, setCaption] = useState('embed');
  const [btnRequestCaption, setBtnRequestCaption] = useState('Request');

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const videoId = "video.mp4";

  const handleRequestCaption = () => {
    (async () => {
      try {
        setBtnRequestCaption('Requesting')
        const blob = await requestSubtitle(videoId, caption);
        const vttUrl = URL.createObjectURL(blob); 
        setBtnRequestCaption('Done')
        setSubtitleUrl(vttUrl);
      } catch (error) {
        console.error("Failed to load subtitles.", error);
        setBtnRequestCaption('Error')
      }
    })(); 

    return () => {
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
      }
    };
  };

  const handleSubtitleToggle = () => {
    setSubtitlesVisible(!subtitlesVisible);
    setSubToggle(subtitlesVisible ? 'Sub X' : 'Sub O');
  };

  useEffect(() => {
    if (videoRef.current && videoRef.current.textTracks && videoRef.current.textTracks.length > 0) {
      const track = videoRef.current.textTracks[0];
      track.mode = subtitlesVisible ? 'showing' : 'hidden';
    }
  }, [subtitlesVisible]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = () => setCurrentTime(videoRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(videoRef.current.duration);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    if (!isDragging) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isDragging]);

  const updateVideoTime = (e) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    let clickX = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    
    clickX = Math.max(0, Math.min(clickX, rect.width));
    
    const progressRatio = clickX / rect.width;
    const newTime = progressRatio * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    updateVideoTime(e);
    
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      videoRef.current.pause();
    }
    
    const handleMouseMove = (e) => {
      e.preventDefault();
      updateVideoTime(e);
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsDragging(false);
      
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      
      resetControlsTimer();
      
      if (wasPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  
  const handleProgressTouchStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    updateVideoTime(e);
    
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      videoRef.current.pause();
    }
  };
  
  const handleProgressTouchMove = (e) => {
    if (isDragging) {
      e.stopPropagation();
      updateVideoTime(e);
    }
  };
  
  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    
    resetControlsTimer();
    
    if (isPlaying) {
      videoRef.current.play();
    }
  };

  const handleProgressClick = (e) => {
    if (isDragging) return;
    
    e.stopPropagation();
    
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressRatio = clickX / rect.width;
    const newTime = progressRatio * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = e.target.value;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const handlePiP = async (e) => {
    e.stopPropagation();
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (videoRef.current.requestPictureInPicture) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const handleFullscreen = async (e) => {
    e.stopPropagation();
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const videoContainer = videoContainerRef.current;
  
    try {
      if (!document.fullscreenElement) {
        await videoContainer.requestFullscreen();
  
        if (isPortrait && window.screen.orientation && window.screen.orientation.lock) {
          await window.screen.orientation.lock("landscape");
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen or orientation change failed:", err);
    }
  };

  const showSwipeFeedback = useCallback((seconds) => {
    const direction = seconds > 0 ? "right" : "left";
    setSwipeDirection(direction);
    setSwipeAmount(Math.abs(seconds));
    setShowSwipeIndicator(true);
    
    if (swipeIndicatorTimerRef.current) {
      clearTimeout(swipeIndicatorTimerRef.current);
    }
    
    swipeIndicatorTimerRef.current = setTimeout(() => {
      setShowSwipeIndicator(false);
    }, 2000);
  }, []);

  const skipTimeWithFeedback = useCallback((seconds) => {
    const newTime = videoRef.current.currentTime + seconds;
    videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
    showSwipeFeedback(seconds);
  }, [duration, showSwipeFeedback]);

  const handleContainerClick = useCallback(() => {
    setShowControls(true);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handlePlayPauseClick = (e) => {
    e.stopPropagation();
    togglePlay();
  };

  const handleTouchStart = (e) => {
    const target = e.target;
    const controlsOverlay = document.querySelector('.controls-overlay');
    
    if (controlsOverlay && (target === controlsOverlay || controlsOverlay.contains(target))) {
      touchTargetIsControlRef.current = true;
      return;
    }
    
    touchTargetIsControlRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    initialTimeRef.current = videoRef.current.currentTime;
    totalSwipeRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (touchTargetIsControlRef.current || touchStartXRef.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const diffX = touchX - touchStartXRef.current;
    const threshold = 50;
    
    if (Math.abs(diffX) > threshold) {
      const direction = diffX > 0 ? "right" : "left";
      setSwipeDirection(direction);
      
      totalSwipeRef.current = Math.round(
        direction === "right" 
          ? videoRef.current.currentTime - initialTimeRef.current
          : initialTimeRef.current - videoRef.current.currentTime
      );
      
      const newTime = initialTimeRef.current + (diffX / 50);
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
      
      setSwipeAmount(Math.abs(totalSwipeRef.current));
      setShowSwipeIndicator(true);
      
      if (swipeIndicatorTimerRef.current) {
        clearTimeout(swipeIndicatorTimerRef.current);
        swipeIndicatorTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTargetIsControlRef.current) {
      touchTargetIsControlRef.current = false;
      return;
    }
    
    if (showSwipeIndicator) {
      swipeIndicatorTimerRef.current = setTimeout(() => {
        setShowSwipeIndicator(false);
      }, 500);
    }
    
    touchStartXRef.current = null;
    initialTimeRef.current = null;
    totalSwipeRef.current = 0;
  };
  
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    resetControlsTimer();
  }, [resetControlsTimer]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case "ArrowLeft":
          skipTimeWithFeedback(-5);
          break;
        case "ArrowRight":
          skipTimeWithFeedback(5);
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skipTimeWithFeedback, togglePlay]);

  useEffect(() => {
    resetControlsTimer();
    
    if (isDragging) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      if (!showControls) {
        setShowControls(true);
      }
    } else {
      resetControlsTimer();
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isDragging, resetControlsTimer, showControls]);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.screen.orientation && 
          (window.screen.orientation.angle === 90 || window.screen.orientation.angle === -90)) {
        if (!document.fullscreenElement && videoContainerRef.current.requestFullscreen) {
          videoContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };
  
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener("change", handleOrientationChange);
      
      return () => {
        window.screen.orientation.removeEventListener("change", handleOrientationChange);
      };
    }
    
    return undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (swipeIndicatorTimerRef.current) {
        clearTimeout(swipeIndicatorTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div
      ref={videoContainerRef}
      className="position-absolute"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={"/video/" + videoId}
        className="position-relative"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      >
        {subtitleUrl && <track src={subtitleUrl} kind="subtitles" default />}
      </video>

      {showControls && (
        <div className="position-absolute bottom-0 w-100 align-items-center" style={{ 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 50%)',
        }}>
          
          <div className="mx-1 align-items-center">
            <ToggleButton ref={playToggleBtnRef} variant="outline-light" onClick={handlePlayPauseClick}> 
              {isPlaying ? "||" : ">"} 
            </ToggleButton>
          </div>

          <Overlay target={playToggleBtnRef.current} show={showSwipeIndicator} placement="top">
            <div>
              <Button variant="outline-light" className="my-2 bg-opacity-50 bg-dark">
                {swipeDirection === "right" ? ">>" : "<<"} {swipeAmount} seconds
              </Button>
            </div>
          </Overlay>

          <div 
            ref={progressRef}
            style={{ cursor: 'pointer' }}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
          >
            <ProgressBar now={progressPercentage} variant="primary" className="opacity-25 my-3 mx-3"/>
          </div>

          <div className="d-flex my-2 mx-2 justify-content-end align-items-center gap-1">
            <input
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={volume} 
              onChange={handleVolumeChange}
            />

            <Button variant="outline-light" onClick={handleSubtitleToggle}>{subToggle}</Button>

            <Button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} variant="outline-light">
              Subtitle
            </Button>
            
            <Overlay target={buttonRef.current} container={videoContainerRef.current} show={isOpen} placement="top" style={{ zIndex: 1000 }}>
              <Stack gap={1} className="align-items-center text-white bg-dark bg-opacity-50 p-2 my-1">
                <span>Caption</span>
                <Form.Select onChange={(e) => setCaption(e.target.value)} className="bg-dark bg-opacity-50 text-white ">
                  <option value="embed">embed</option>
                </Form.Select>

                <Button onClick={handleRequestCaption} variant="outline-light">{btnRequestCaption}</Button>
              </Stack>
            </Overlay>
        
            <Button variant="outline-light" onClick={handlePiP}>PiP</Button>

            <Button variant="outline-light" onClick={handleFullscreen}>Fullscreen</Button>
          </div>
        </div>
      )}
    </div>
  );
}