"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardPaste,
  ExternalLink,
  Loader2,
  Music,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  CURATED_SPOTIFY_PRESETS,
  buildSpotifySearchUrl,
  parseSpotifyInput,
  readSavedSpotifyItems,
  removeSavedSpotifyItem,
  saveSpotifyItem,
  spotifyTypeLabel,
  validateSpotifyViaOEmbed,
  type SpotifyItem,
} from "@/lib/spotify";

interface SpotifyPickerProps {
  selected: SpotifyItem | null;
  onSelect: (item: SpotifyItem) => void;
  compact?: boolean;
}

function CoverThumb({
  src,
  alt,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-[7px] bg-[#EFE9FF] text-[#351080]"
        aria-hidden="true"
      >
        <Music size={Math.max(13, Math.round(size * 0.42))} strokeWidth={2.2} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-[7px] object-cover outline-1 -outline-offset-1 outline-black/10"
    />
  );
}

export default function SpotifyPicker({
  selected,
  onSelect,
  compact = false,
}: SpotifyPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [clipboardHint, setClipboardHint] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedItems, setSavedItems] = useState<SpotifyItem[]>([]);

  useEffect(() => {
    setSavedItems(readSavedSpotifyItems());
  }, []);

  const handleImport = async (overrideText?: string) => {
    const raw = (overrideText ?? inputValue).trim();
    setClipboardHint("");
    setErrorText("");
    setIsValidating(true);

    try {
      const result = await validateSpotifyViaOEmbed(raw);
      if (!result.ok) {
        setErrorText(result.message);
        return;
      }
      const nextSaved = saveSpotifyItem(result.item);
      setSavedItems(nextSaved);
      onSelect(result.item);
      setInputValue("");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePaste = async () => {
    setErrorText("");
    setClipboardHint("");

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.readText !== "function"
    ) {
      setClipboardHint(
        "Browser tidak mendukung akses clipboard otomatis. Tempel manual dengan Ctrl+V / Cmd+V."
      );
      return;
    }

    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setClipboardHint("Clipboard kosong. Salin link Spotify terlebih dahulu.");
        return;
      }
      setInputValue(text);
      if (parseSpotifyInput(text)) {
        await handleImport(text);
      } else {
        setClipboardHint("Teks ditempel. Klik Import atau pastikan link berasal dari Spotify.");
      }
    } catch {
      setClipboardHint(
        "Izin clipboard ditolak browser. Tempel link langsung di kotak input (Ctrl+V / Cmd+V)."
      );
    }
  };

  const handleChooseItem = (item: SpotifyItem, persistToSaved = false) => {
    setErrorText("");
    setClipboardHint("");
    if (persistToSaved) {
      setSavedItems(saveSpotifyItem(item));
    }
    onSelect(item);
  };

  const handleRemoveSaved = (uri: string) => {
    setSavedItems(removeSavedSpotifyItem(uri));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPresets = useMemo(() => {
    if (!normalizedQuery) return CURATED_SPOTIFY_PRESETS;
    return CURATED_SPOTIFY_PRESETS.filter(
      (p) =>
        p.title.toLowerCase().includes(normalizedQuery) ||
        p.subtitle.toLowerCase().includes(normalizedQuery) ||
        p.type.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredSaved = useMemo(() => {
    if (!normalizedQuery) return savedItems;
    return savedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.type.toLowerCase().includes(normalizedQuery)
    );
  }, [savedItems, normalizedQuery]);

  const noFilterMatches =
    normalizedQuery.length > 0 &&
    filteredPresets.length === 0 &&
    filteredSaved.length === 0;

  return (
    <div className="space-y-3">
      {/* 1. Import link / URI / embed code */}
      <div>
        <div className="flex items-stretch gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (errorText) setErrorText("");
              if (clipboardHint) setClipboardHint("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (!isValidating) void handleImport();
              }
            }}
            placeholder="Tempel link, URI, atau <iframe embed> Spotify…"
            aria-label="Link, URI, atau kode embed Spotify"
            style={{ fontSize: "10.5px" }}
            className={`min-w-0 flex-1 rounded-[9px] border bg-white px-3 py-2 !text-[10.5px] text-[#2A1163] placeholder:text-[#9A90AD] outline-none transition-[border-color] duration-150 focus:border-[#351080] ${
              errorText
                ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                : "border-[#DFD9EC]"
            }`}
          />

          <button
            type="button"
            onClick={() => void handlePaste()}
            disabled={isValidating}
            aria-label="Paste Spotify link from clipboard"
            title="Tempel dari clipboard"
            className="inline-flex shrink-0 items-center gap-1 rounded-[9px] border border-[#DFD9EC] bg-white px-2.5 py-2 text-[10px] font-bold text-[#351080] transition-[background-color,border-color,transform] duration-150 hover:border-[#C7BBE3] hover:bg-[#F5F1FC] motion-safe:enabled:active:scale-[0.96]"
          >
            <ClipboardPaste size={12} strokeWidth={2.2} aria-hidden="true" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={isValidating || !inputValue.trim()}
            style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "10px" }}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-[9px] border-0 bg-[#351080] px-3 py-2 text-[10px] !font-bold !text-white transition-[background-color,transform] duration-150 hover:bg-[#43189E] motion-safe:enabled:active:scale-[0.96]"
          >
            {isValidating ? (
              <Loader2
                size={12}
                strokeWidth={2.4}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : null}
            <span>{isValidating ? "Cek…" : "Import"}</span>
          </button>
        </div>

        {errorText && (
          <p
            role="alert"
            className="mt-1.5 mb-0 rounded-[8px] border border-[#F5DCE6] bg-[#FDF2F6] px-2.5 py-1.5 text-[10px] leading-[1.45] font-medium text-[#9F3D69]"
          >
            {errorText}
          </p>
        )}

        {!errorText && clipboardHint && (
          <p
            role="status"
            className="mt-1.5 mb-0 rounded-[8px] border border-[#E5DDF5] bg-[#F7F3FF] px-2.5 py-1.5 text-[10px] leading-[1.45] text-[#5A5070]"
          >
            {clipboardHint}
          </p>
        )}
      </div>

      {/* 2. Selected Spotify Preview Card */}
      {selected && !compact && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#D8CCF2] bg-[#F6F2FF] p-2.5">
          <CoverThumb src={selected.thumbnailUrl} alt={selected.title} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-[#FFF238]">
                <Check size={9} strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="truncate text-[11px] font-bold text-[#2A1163]">
                {selected.title}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-[#6B5E86]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#18863E]">
                <span
                  aria-hidden="true"
                  className="inline-block h-[6px] w-[6px] rounded-full bg-[#1DB954]"
                />
                Spotify
              </span>
              <span aria-hidden="true">·</span>
              <span>{spotifyTypeLabel(selected.type)}</span>
            </div>
          </div>
          <a
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka ${selected.title} di Spotify`}
            title="Buka di Spotify"
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] border border-[#DFD6F5] bg-white text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#EFE9FF] motion-safe:active:scale-[0.96]"
          >
            <ExternalLink size={12} strokeWidth={2.2} aria-hidden="true" />
          </a>
        </div>
      )}

      {/* 3. Quick Search Shortcut (filter presets/saved + open Spotify search) */}
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            size={12}
            strokeWidth={2.2}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#8E83A5]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter preset / saved atau cari…"
            aria-label="Filter playlist tersimpan atau cari di Spotify"
            style={{ fontSize: "10px" }}
            className="w-full rounded-[8px] border border-[#E6E0F2] bg-[#FAF8FF] py-1.5 pr-2.5 pl-7 !text-[10px] text-[#2A1163] placeholder:text-[#9A90AD] outline-none transition-[border-color,background-color] duration-150 focus:border-[#351080] focus:bg-white"
          />
        </div>

        <a
          href={buildSpotifySearchUrl(searchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-[#DFD9EC] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#351080] transition-[background-color,border-color,transform] duration-150 hover:border-[#C7BBE3] hover:bg-[#F5F1FC] motion-safe:active:scale-[0.96]"
        >
          <span>Cari di Spotify</span>
          <ExternalLink size={10} strokeWidth={2.3} aria-hidden="true" />
        </a>
      </div>

      {/* Scrollable list container for Saved + Presets */}
      <div
        className={`space-y-3 overflow-y-auto overscroll-contain pr-0.5 ${
          compact ? "max-h-[220px]" : "max-h-[195px]"
        }`}
      >
        {/* 4. Saved / Recent List */}
        {filteredSaved.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9.5px] font-bold tracking-[0.04em] text-[#6B5E86] uppercase">
                Saved &amp; Recent ({filteredSaved.length})
              </span>
            </div>
            <ul role="list" className="m-0 flex list-none flex-col gap-1.5 p-0">
              {filteredSaved.map((item) => {
                const isSelected = selected?.uri === item.uri;
                return (
                  <li key={item.uri} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleChooseItem(item, true)}
                      aria-pressed={isSelected}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-2 py-1.5 text-left transition-[background-color,border-color,transform] duration-150 motion-safe:enabled:active:scale-[0.96] ${
                        isSelected
                          ? "border-[#351080] bg-[#F3EDFF]"
                          : "border-[#EAE4F3] bg-white hover:border-[#CFC4E8] hover:bg-[#FAF8FF]"
                      }`}
                    >
                      <CoverThumb
                        src={item.thumbnailUrl}
                        alt={item.title}
                        size={28}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10.5px] font-bold text-[#2A1163]">
                          {item.title}
                        </div>
                        <div className="text-[9px] text-[#7B728E]">
                          {spotifyTypeLabel(item.type)}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-[#FFF238]">
                          <Check size={9} strokeWidth={3} aria-hidden="true" />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveSaved(item.uri)}
                      aria-label={`Hapus ${item.title} dari daftar tersimpan`}
                      title="Hapus dari daftar"
                      className="flex h-[28px] w-[26px] shrink-0 items-center justify-center rounded-[8px] border border-transparent bg-transparent text-[#8F84A8] transition-[background-color,color,transform] duration-150 hover:bg-[#FDF2F6] hover:text-[#9F3D69] motion-safe:enabled:active:scale-[0.96]"
                    >
                      <X size={12} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 5. Quick Pick Curated Public Study Playlists */}
        {filteredPresets.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[9.5px] font-bold tracking-[0.04em] text-[#6B5E86] uppercase">
              <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
              <span>Quick Pick Study Playlists</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {filteredPresets.map((preset) => {
                const isSelected = selected?.uri === preset.uri;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleChooseItem(preset, false)}
                    aria-pressed={isSelected}
                    className={`flex min-w-0 items-center gap-2 rounded-[10px] border p-2 text-left transition-[background-color,border-color,transform] duration-150 motion-safe:enabled:active:scale-[0.96] ${
                      isSelected
                        ? "border-[#351080] bg-[#F3EDFF]"
                        : "border-[#EAE4F3] bg-white hover:border-[#CFC4E8] hover:bg-[#FAF8FF]"
                    }`}
                  >
                    <CoverThumb
                      src={preset.thumbnailUrl}
                      alt={preset.title}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-bold text-[#2A1163]">
                        {preset.title}
                      </div>
                      <div className="truncate text-[8.5px] text-[#7B728E]">
                        {preset.subtitle}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-[#FFF238]">
                        <Check size={9} strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty filter state */}
        {noFilterMatches && (
          <div
            role="status"
            className="rounded-[10px] border border-dashed border-[#DDD4EE] bg-[#FAF8FF] px-3 py-3 text-center text-[10px] text-[#6B5E86]"
          >
            Tidak ada preset atau saved yang cocok dengan &ldquo;{searchQuery}&rdquo;.
            Klik <strong>Cari di Spotify</strong> lalu salin &amp; Paste link-nya di atas.
          </div>
        )}
      </div>
    </div>
  );
}
