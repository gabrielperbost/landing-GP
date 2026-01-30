"use client";

import { useEffect, useRef, useState } from "react";
import { trackVideoComplete, trackVideoMid, trackVideoStart } from "@/lib/tracking";

type Props = {
  src: string;
  poster?: string;
  id: string;
  onProgress?: (percent: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
};

export const LazyVideo = ({ src, poster, id, onProgress, autoPlay, loop, muted = true, className }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);
  const started = useRef(false);
  const midway = useRef(false);
  const completed = useRef(false);
  const [generatedPoster, setGeneratedPoster] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Render immediately (no intersection observer).
    setVisible(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => {
      if (!started.current) {
        trackVideoStart(id);
        started.current = true;
      }
    };
    const handleTime = () => {
      const pct = video.duration ? video.currentTime / video.duration : 0;
      if (pct >= 0.5 && !midway.current) {
        trackVideoMid(id);
        midway.current = true;
      }
      if (pct >= 0.95 && !completed.current) {
        trackVideoComplete(id);
        completed.current = true;
      }
      onProgress?.(pct);
    };
    video.addEventListener("play", handlePlay);
    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("ended", () => {
      handleTime();
    });
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("timeupdate", handleTime);
    };
  }, [id, onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || poster || generatedPoster || !visible) return;

    const handleLoaded = () => {
      try {
        const targetTime = video.duration ? Math.min(0.1, video.duration / 10) : 0.1;
        const capture = () => {
          try {
            const canvas = document.createElement("canvas");
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            setGeneratedPoster(dataUrl);
          } catch (err) {
            console.error("poster-capture", err);
          }
        };
        video.addEventListener("seeked", capture, { once: true });
        video.currentTime = targetTime;
      } catch (err) {
        console.error("poster-init", err);
      }
    };

    video.addEventListener("loadeddata", handleLoaded, { once: true });
    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
    };
  }, [poster, generatedPoster, visible]);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        className="h-full w-full rounded-xl object-cover bg-black"
        poster={poster ?? generatedPoster}
        controls
        playsInline
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        preload="metadata"
        crossOrigin="anonymous"
      >
        <source src={src} />
      </video>
    </div>
  );
};
