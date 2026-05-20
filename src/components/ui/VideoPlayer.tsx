import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Inline icons ──────────────────────────────────────────────────────────────

function Play({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function Pause({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6 19h4V5H6zm8-14v14h4V5z" />
    </svg>
  );
}

function VolumeOn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function VolumeOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}

function Expand({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function Shrink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [dragging, setDragging] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Control visibility ──────────────────────────────────────────────────────

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (playing) scheduleHide();
  }, [playing, scheduleHide]);

  // ── Video events ────────────────────────────────────────────────────────────

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onPlay = () => { setPlaying(true); scheduleHide(); };
    const onPause = () => { setPlaying(false); setShowControls(true); clearTimeout(hideTimer.current); };
    const onEnded = () => { setPlaying(false); setShowControls(true); };
    const onProgress = () => {
      if (v.buffered.length && v.duration) {
        setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
      }
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("progress", onProgress);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("progress", onProgress);
    };
  }, [scheduleHide]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Keyboard shortcuts (when player focused or hovered) ─────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v || !containerRef.current) return;

      // only when focused inside the player or hovering it
      const focused =
        containerRef.current.matches(":focus-within") ||
        containerRef.current.matches(":hover");
      if (!focused) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          v.paused ? v.play() : v.pause();
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = clamp(v.currentTime + 5, 0, v.duration);
          revealControls();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = clamp(v.currentTime - 5, 0, v.duration);
          revealControls();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealControls]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Progress bar drag ───────────────────────────────────────────────────────

  const seekToRatio = useCallback((clientX: number) => {
    const bar = barRef.current;
    const v = videoRef.current;
    if (!bar || !v || !v.duration) return;
    const { left, width } = bar.getBoundingClientRect();
    v.currentTime = clamp((clientX - left) / width) * v.duration;
  }, []);

  const onBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      seekToRatio(e.clientX);

      const onMove = (ev: MouseEvent) => seekToRatio(ev.clientX);
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [seekToRatio],
  );

  // ── Volume ──────────────────────────────────────────────────────────────────

  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const progress = duration > 0 ? currentTime / duration : 0;
  const effectiveVolume = muted ? 0 : volume;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black overflow-hidden select-none outline-none", className)}
      tabIndex={-1}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && scheduleHide()}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        className="h-full w-full"
        onClick={togglePlay}
        style={{ cursor: showControls ? "default" : "none" }}
      />

      {/* Centre play overlay — visible when paused */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-200 pointer-events-none",
          playing ? "opacity-0" : "opacity-100 pointer-events-auto",
        )}
      >
        <span className="h-14 w-14 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm ring-1 ring-white/20">
          <Play className="h-6 w-6 text-white translate-x-0.5" />
        </span>
      </button>

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-3 pt-8 pb-2.5",
          "bg-gradient-to-t from-black/75 via-black/30 to-transparent",
          "transition-opacity duration-300",
          showControls || dragging ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Progress bar */}
        <div
          ref={barRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="group/bar relative mb-3 h-1 cursor-pointer"
          onMouseDown={onBarMouseDown}
        >
          {/* Track */}
          <div className="absolute inset-0 rounded-full bg-white/20" />
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-none"
            style={{ width: `${buffered * 100}%` }}
          />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent transition-none"
            style={{ width: `${progress * 100}%` }}
          />
          {/* Scrubber thumb */}
          <div
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-opacity",
              dragging ? "opacity-100 scale-125" : "opacity-0 group-hover/bar:opacity-100",
            )}
            style={{ left: `${progress * 100}%` }}
          />
          {/* Hover expand hitbox */}
          <div className="absolute -inset-y-2 inset-x-0" />
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="text-white/90 hover:text-white transition-colors p-0.5"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Volume */}
          <div
            className="flex items-center gap-1.5"
            onMouseEnter={() => setShowVolSlider(true)}
            onMouseLeave={() => setShowVolSlider(false)}
          >
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="text-white/90 hover:text-white transition-colors p-0.5 shrink-0"
            >
              {effectiveVolume === 0 ? (
                <VolumeOff className="h-4 w-4" />
              ) : (
                <VolumeOn className="h-4 w-4" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                showVolSlider ? "w-16 opacity-100" : "w-0 opacity-0",
              )}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={effectiveVolume}
                onChange={onVolumeChange}
                className="h-1 w-16 cursor-pointer appearance-none bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Time */}
          <span className="flex-1 text-[11px] text-white/70 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="text-white/90 hover:text-white transition-colors p-0.5"
          >
            {fullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
