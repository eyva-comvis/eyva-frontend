"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  buildSpotifyEmbedUrl,
  spotifyTypeLabel,
  type SpotifyItem,
} from "@/lib/spotify";

interface SpotifyPlaybackUpdateEvent {
  data?: {
    isPaused?: boolean;
    isBuffering?: boolean;
    duration?: number;
    position?: number;
  };
}

interface SpotifyEmbedController {
  loadUri: (uri: string, preferVideo?: boolean, startAt?: number) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  destroy?: () => void;
  addListener: (
    event: string,
    cb: (event: SpotifyPlaybackUpdateEvent) => void
  ) => void;
}

interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

const SPOTIFY_IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";
const IFRAME_API_TIMEOUT_MS = 5500;

let cachedIFrameApi: SpotifyIFrameAPI | null = null;
let apiLoadPromise: Promise<SpotifyIFrameAPI> | null = null;

/** Muat Spotify Embed IFrame API sekali per sesi halaman (SSR-safe & StrictMode-safe). */
function loadSpotifyIFrameApi(): Promise<SpotifyIFrameAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR"));
  }
  if (cachedIFrameApi) {
    return Promise.resolve(cachedIFrameApi);
  }
  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    let settled = false;
    const finishResolve = (api: SpotifyIFrameAPI) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cachedIFrameApi = api;
      resolve(api);
    };
    const finishReject = (reason: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      apiLoadPromise = null;
      reject(reason);
    };

    const timer = setTimeout(() => {
      finishReject(new Error("Spotify IFrame API timeout"));
    }, IFRAME_API_TIMEOUT_MS);

    const prevHandler = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api: SpotifyIFrameAPI) => {
      prevHandler?.(api);
      finishResolve(api);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SPOTIFY_IFRAME_API_SRC}"]`
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = SPOTIFY_IFRAME_API_SRC;
      script.async = true;
      script.onerror = () => {
        finishReject(new Error("Failed to load Spotify IFrame API"));
      };
      document.body.appendChild(script);
    }
  });

  return apiLoadPromise;
}

export interface SpotifyEmbedHandle {
  pause: () => void;
  togglePlay: () => void;
}

interface SpotifyEmbedPlayerProps {
  item: SpotifyItem;
  paused: boolean;
  compactOnly?: boolean;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

const SpotifyEmbedPlayer = forwardRef<SpotifyEmbedHandle, SpotifyEmbedPlayerProps>(
  function SpotifyEmbedPlayer(
    { item, paused, compactOnly = false, onPlaybackChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const controllerRef = useRef<SpotifyEmbedController | null>(null);
    const loadedUriRef = useRef<string | null>(null);
    const onPlaybackRef = useRef(onPlaybackChange);
    onPlaybackRef.current = onPlaybackChange;
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    const supportsExpand =
      !compactOnly && (item.type === "playlist" || item.type === "album");
    const [expanded, setExpanded] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const embedHeight = supportsExpand && expanded ? 352 : 152;
    const embedHeightRef = useRef(embedHeight);
    embedHeightRef.current = embedHeight;

    // Reset expand saat beralih ke track/episode agar selalu compact 152px
    useEffect(() => {
      if (!supportsExpand && expanded) {
        setExpanded(false);
      }
    }, [supportsExpand, expanded]);

    useImperativeHandle(
      ref,
      () => ({
        pause: () => {
          try {
            controllerRef.current?.pause();
          } catch {
            // abaikan bila iframe belum siap
          }
          onPlaybackRef.current?.(false);
        },
        togglePlay: () => {
          try {
            controllerRef.current?.togglePlay();
          } catch {
            // abaikan bila iframe belum siap
          }
        },
      }),
      []
    );

    // Inisialisasi Spotify Embed IFrame API sekali saat mount (fallback ke <iframe> bila gagal/timeout)
    useEffect(() => {
      if (useFallback) return;
      let cancelled = false;
      const container = containerRef.current;
      if (!container) return;

      setIsLoading(true);
      const readyFallbackTimer = setTimeout(() => {
        if (!cancelled) setIsLoading(false);
      }, 2400);

      loadSpotifyIFrameApi()
        .then((IFrameAPI) => {
          if (cancelled || !containerRef.current) return;
          containerRef.current.innerHTML = "";
          const mountNode = document.createElement("div");
          containerRef.current.appendChild(mountNode);

          IFrameAPI.createController(
            mountNode,
            {
              uri: item.uri,
              width: "100%",
              height: embedHeightRef.current,
            },
            (controller) => {
              if (cancelled) {
                try {
                  controller.pause();
                  controller.destroy?.();
                } catch {
                  // abaikan
                }
                return;
              }
              controllerRef.current = controller;
              loadedUriRef.current = item.uri;

              const iframeEl = containerRef.current?.querySelector("iframe");
              if (iframeEl) {
                iframeEl.style.borderRadius = "12px";
                iframeEl.style.display = "block";
                iframeEl.style.width = "100%";
                iframeEl.title = `Spotify player: ${item.title}`;
              }

              controller.addListener("ready", () => {
                if (!cancelled) setIsLoading(false);
              });

              controller.addListener("playback_update", (ev) => {
                if (cancelled) return;
                const playing = ev?.data?.isPaused === false;
                onPlaybackRef.current?.(playing);
              });

              if (pausedRef.current) {
                try {
                  controller.pause();
                } catch {
                  // abaikan
                }
              }
              setIsLoading(false);
            }
          );
        })
        .catch(() => {
          if (!cancelled) {
            setUseFallback(true);
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
        clearTimeout(readyFallbackTimer);
        const ctrl = controllerRef.current;
        controllerRef.current = null;
        loadedUriRef.current = null;
        if (ctrl) {
          try {
            ctrl.pause();
            ctrl.destroy?.();
          } catch {
            // abaikan
          }
        }
        if (container) {
          container.innerHTML = "";
        }
        onPlaybackRef.current?.(false);
      };
      // Sengaja hanya saat mount / fallback toggle agar loadUri menangani ganti playlist tanpa remount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useFallback]);

    // Ganti URI secara mulus saat user mengganti playlist/lagu di tengah sesi
    useEffect(() => {
      if (useFallback) return;
      const ctrl = controllerRef.current;
      if (!ctrl || loadedUriRef.current === item.uri) return;
      loadedUriRef.current = item.uri;
      try {
        ctrl.loadUri(item.uri);
      } catch {
        // fallback remount bila loadUri gagal
        setUseFallback(true);
      }
    }, [item.uri, useFallback]);

    // Sesuaikan tinggi iframe secara langsung saat user toggle compact <-> tracklist
    useEffect(() => {
      if (useFallback) return;
      const iframeEl = containerRef.current?.querySelector("iframe");
      if (iframeEl) {
        iframeEl.height = String(embedHeight);
        iframeEl.style.height = `${embedHeight}px`;
      }
    }, [embedHeight, useFallback]);

    // Sinkronisasi pause dari lifecycle sesi (Pause, Alert 2 -> Break, End Session)
    useEffect(() => {
      if (!paused) return;
      try {
        controllerRef.current?.pause();
      } catch {
        // abaikan
      }
      onPlaybackRef.current?.(false);
    }, [paused]);

    return (
      <div className="space-y-2">
        {/* Embed Container */}
        <div
          className="relative overflow-hidden rounded-[12px] bg-[#F5F1FC]"
          style={{ minHeight: embedHeight }}
          aria-busy={isLoading}
        >
          {isLoading && (
            <div
              role="status"
              aria-label="Memuat pemutar Spotify"
              className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-2.5 rounded-[12px] bg-[#F5F1FC] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-[52px] w-[52px] rounded-[8px] bg-[#E5DCF8] motion-safe:animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-[#E5DCF8] motion-safe:animate-pulse" />
                  <div className="h-2.5 w-1/3 rounded-full bg-[#ECE5FB] motion-safe:animate-pulse" />
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E5DCF8] motion-safe:animate-pulse" />
            </div>
          )}

          {useFallback ? (
            <iframe
              key={item.uri}
              src={buildSpotifyEmbedUrl(item.type, item.id)}
              width="100%"
              height={embedHeight}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              onLoad={() => setIsLoading(false)}
              title={`Spotify player: ${item.title}`}
              className="block w-full rounded-[12px] border-0"
            />
          ) : (
            <div ref={containerRef} className="w-full" />
          )}
        </div>

        {/* Footer note + optional tracklist expand toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-[#7B728E]">
          <p className="m-0 leading-[1.4]">
            Login ke akun Spotify di browser untuk memutar lagu penuh.
          </p>

          <div className="flex items-center gap-2">
            {supportsExpand && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-0.5 rounded-[6px] border border-[#E5DFEE] bg-white px-2 py-0.5 text-[9.5px] font-bold text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#F5F1FC] motion-safe:enabled:active:scale-[0.96]"
              >
                <span>{expanded ? "Compact" : `Lihat ${spotifyTypeLabel(item.type).toLowerCase()}`}</span>
                {expanded ? (
                  <ChevronUp size={11} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ChevronDown size={11} strokeWidth={2.4} aria-hidden="true" />
                )}
              </button>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka ${item.title} di Spotify`}
              className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#5C3D99] hover:text-[#351080] hover:underline"
            >
              <span>Spotify</span>
              <ExternalLink size={10} strokeWidth={2.3} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    );
  }
);

export default SpotifyEmbedPlayer;
