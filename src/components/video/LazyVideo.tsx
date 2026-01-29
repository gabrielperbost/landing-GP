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
  const [visible, setVisible] = useState(false);
  const started = useRef(false);
  const midway = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
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

  return (
    <div ref={containerRef} className={className}>
      {visible ? (
        <video
          ref={videoRef}
          className="h-full w-full rounded-xl border border-slate-200 object-cover shadow-soft"
          poster={poster}
          controls
          playsInline
          muted={muted}
          loop={loop}
          autoPlay={autoPlay}
          preload="metadata"
        >
          <source src={src} />
        </video>
      ) : (
        <div className="h-full w-full rounded-xl border border-slate-200 bg-slate-100 shimmer" />
      )}
    </div>
  );
};
