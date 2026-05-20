import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Icons ─────────────────────────────────────────────────────────────────────
// Play path: centroid at (12.5, 12) — 0.5px right of geometric center for
// optical balance of the triangle in a circle. No translate needed.

function IcoPlay({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.5 5v14l11-7z" />
    </svg>
  );
}

function IcoPause({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function IcoVolFull({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function IcoVolMute({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}

function IcoExpand({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function IcoShrink({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const PREVIEW_W = 160;
const PREVIEW_H = 90;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const previewRef  = useRef<HTMLVideoElement>(null); // for seek preview frames
  const barRef      = useRef<HTMLDivElement>(null);

  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [buffered,    setBuffered]    = useState(0);
  const [volume,      setVolume]      = useState(1);
  const [muted,       setMuted]       = useState(false);
  const [speed,       setSpeed]       = useState(1);
  const [fullscreen,  setFullscreen]  = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolBar,   setShowVolBar]   = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [dragging,    setDragging]    = useState(false);

  // Seek-preview: { barX, time } while hovering progress bar
  const [preview, setPreview] = useState<{ barX: number; time: number } | null>(null);
  const previewSeekTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Visibility ──────────────────────────────────────────────────────────────

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const showNow = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
  }, []);

  const revealAndSchedule = useCallback(() => {
    setShowControls(true);
    if (videoRef.current && !videoRef.current.paused) scheduleHide();
  }, [scheduleHide]);

  // ── Video events ────────────────────────────────────────────────────────────

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime     = () => setCurrentTime(v.currentTime);
    const onMeta     = () => setDuration(v.duration);
    const onPlay     = () => { setPlaying(true);  scheduleHide(); };
    const onPause    = () => { setPlaying(false); showNow(); };
    const onEnded    = () => { setPlaying(false); showNow(); };
    const onProgress = () => {
      if (v.buffered.length && v.duration)
        setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
    };

    v.addEventListener("timeupdate",       onTime);
    v.addEventListener("loadedmetadata",   onMeta);
    v.addEventListener("durationchange",   onMeta);
    v.addEventListener("play",             onPlay);
    v.addEventListener("pause",            onPause);
    v.addEventListener("ended",            onEnded);
    v.addEventListener("progress",         onProgress);

    return () => {
      v.removeEventListener("timeupdate",     onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("play",           onPlay);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("ended",          onEnded);
      v.removeEventListener("progress",       onProgress);
    };
  }, [scheduleHide, showNow]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      const c = containerRef.current;
      if (!v || !c) return;
      if (!c.matches(":hover") && !c.matches(":focus-within")) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          v.paused ? v.play() : v.pause();
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = clamp(v.currentTime + 5, 0, v.duration);
          revealAndSchedule();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = clamp(v.currentTime - 5, 0, v.duration);
          revealAndSchedule();
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
  }, [revealAndSchedule]);

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

  const applySpeed = useCallback((s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }, []);

  // ── Progress bar interaction ────────────────────────────────────────────────

  const ratioFromClientX = useCallback((clientX: number) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const { left, width } = bar.getBoundingClientRect();
    return clamp((clientX - left) / width);
  }, []);

  const seekToRatio = useCallback((ratio: number) => {
    const v = videoRef.current;
    if (v && v.duration) v.currentTime = ratio * v.duration;
  }, []);

  const onBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      seekToRatio(ratioFromClientX(e.clientX));

      const onMove = (ev: MouseEvent) => seekToRatio(ratioFromClientX(ev.clientX));
      const onUp   = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup",   onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup",   onUp);
    },
    [ratioFromClientX, seekToRatio],
  );

  /* const onBarMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar || !duration) return;
      const { left, width } = bar.getBoundingClientRect();
      const ratio = clamp((e.clientX - left) / width);
      const time  = ratio * duration;
      const barX  = e.clientX - left;
      setPreview({ barX, time });

      // Seek preview video with light debounce
      clearTimeout(previewSeekTimer.current);
      previewSeekTimer.current = setTimeout(() => {
        if (previewRef.current) previewRef.current.currentTime = time;
      }, 40);
    },
    [duration],
  ); */

  /* const onBarMouseLeave = useCallback(() => {
    setPreview(null);
    clearTimeout(previewSeekTimer.current);
  }, []); */

  // ── Volume ──────────────────────────────────────────────────────────────────

  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v   = videoRef.current;
    const val = parseFloat(e.target.value);
    if (v) { v.volume = val; v.muted = val === 0; }
    setVolume(val);
    setMuted(val === 0);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const progress       = duration > 0 ? currentTime / duration : 0;
  const effectiveVol   = muted ? 0 : volume;
  const controlsActive = showControls || dragging || !!preview;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={cn("group/player relative bg-black overflow-hidden select-none outline-none", className)}
      tabIndex={-1}
      onMouseMove={revealAndSchedule}
      onMouseLeave={() => {
        if (!videoRef.current?.paused) scheduleHide();
        setShowVolBar(false);
        setShowSpeedMenu(false);
      }}
      onClick={(e) => {
        // close speed menu on outside click
        if (showSpeedMenu) { setShowSpeedMenu(false); e.stopPropagation(); }
      }}
    >
      {/* ── Main video ──────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        className="h-full w-full"
        style={{ cursor: controlsActive ? "default" : "none" }}
        onClick={togglePlay}
      />

      {/* SEEK PREVIEW DISABLED */}
      {/* <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-20 transition-opacity duration-100",
          preview ? "opacity-100" : "opacity-0",
        )}
        style={{
          bottom: 52,
          left: preview
            ? clamp(
                preview.barX - PREVIEW_W / 2,
                0,
                (barRef.current?.clientWidth ?? PREVIEW_W) - PREVIEW_W,
              )
            : 0,
          width: PREVIEW_W,
        }}
      >
        <div
          className="overflow-hidden ring-1 ring-white/15 bg-black"
          style={{ width: PREVIEW_W, height: PREVIEW_H }}
        >
          <video
            ref={previewRef}
            src={src}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-1 text-center font-mono text-[11px] tabular-nums text-white/75">
          {preview ? fmt(preview.time) : ""}
        </p>
      </div> */}

      {/* ── Centre play/pause overlay ────────────────────────────────────────── */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-200",
          playing ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Ring + icon — flex centered, no translate hack needed */}
        <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform duration-150 hover:scale-110 active:scale-95">
          <IcoPlay size={52} />
        </span>
      </button>

      {/* ── Control panel ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 transition-opacity duration-250",
          controlsActive ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >

        {/* ── Gradient backdrop ────────────────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* ── Inner controls ───────────────────────────────────────────────── */}
        <div className="relative px-3.5 pb-3 pt-10">
          {/* Progress bar */}
          <div
            ref={barRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="group/bar relative mb-3.5 flex items-center cursor-pointer"
            style={{ height: 14 }}
            onMouseDown={onBarMouseDown}
            // onMouseMove={onBarMouseMove}
            // onMouseLeave={onBarMouseLeave}
          >
            {/* Track */}
            <div className="absolute inset-x-0 rounded-full bg-white/20 transition-all duration-150 group-hover/bar:h-[5px] h-[3px] top-1/2 -translate-y-1/2" />
            {/* Buffered */}
            <div
              className="absolute rounded-full bg-white/30 transition-all duration-150 group-hover/bar:h-[5px] h-[3px] top-1/2 -translate-y-1/2 left-0"
              style={{ width: `${buffered * 100}%` }}
            />
            {/* Played */}
            <div
              className="absolute rounded-full bg-accent transition-all duration-150 group-hover/bar:h-[5px] h-[3px] top-1/2 -translate-y-1/2 left-0"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Scrubber dot */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-md transition-all duration-150",
                dragging
                  ? "h-4 w-4 opacity-100"
                  : "h-3 w-3 opacity-0 group-hover/bar:opacity-100",
              )}
              style={{ left: `${progress * 100}%` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-8 w-8 items-center justify-center text-white/85 hover:text-white transition-colors"
            >
              {playing ? <IcoPause size={18} /> : <IcoPlay size={18} />}
            </button>

            {/* Volume — mute toggle + expanding slider */}
            <div
              className="flex items-center"
              onMouseEnter={() => setShowVolBar(true)}
              onMouseLeave={() => setShowVolBar(false)}
            >
              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-8 w-8 items-center justify-center text-white/85 hover:text-white transition-colors"
              >
                {effectiveVol === 0 ? <IcoVolMute /> : <IcoVolFull />}
              </button>
              {/* Slider — expands on hover */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out flex items-center",
                  showVolBar ? "w-20 opacity-100" : "w-0 opacity-0",
                )}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={effectiveVol}
                  onChange={onVolumeChange}
                  className={cn(
                    "w-20 cursor-pointer appearance-none bg-transparent",
                    // track
                    "[&::-webkit-slider-runnable-track]:h-[5px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/30",
                    // thumb
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-5px]",
                    // firefox
                    "[&::-moz-range-track]:h-[5px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/30",
                    "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0",
                  )}
                />
              </div>
            </div>

            {/* Time */}
            <span className="ml-1 text-[11px] text-white/65 tabular-nums font-mono leading-none flex-1">
              {fmt(currentTime)}<span className="text-white/35"> / </span>{fmt(duration)}
            </span>

            {/* Speed */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((v) => !v); }}
                aria-label="Playback speed"
                className="flex h-8 items-center justify-center px-2 text-[11px] font-semibold text-white/75 hover:text-white transition-colors tracking-wide"
              >
                {speed === 1 ? "1×" : `${speed}×`}
              </button>
              {/* Speed menu */}
              {showSpeedMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-black/90 ring-1 ring-white/10 py-1 min-w-[72px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => applySpeed(s)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-[12px] hover:bg-white/10 transition-colors",
                        speed === s ? "text-accent font-semibold" : "text-white/80",
                      )}
                    >
                      <span>{s === 1 ? "Normal" : `${s}×`}</span>
                      {speed === s && (
                        <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                          <path d="M1.5 5.5L4 8l4.5-5.5" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="flex h-8 w-8 items-center justify-center text-white/85 hover:text-white transition-colors"
            >
              {fullscreen ? <IcoShrink /> : <IcoExpand />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
