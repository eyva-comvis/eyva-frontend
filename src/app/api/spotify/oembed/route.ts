import { NextRequest, NextResponse } from "next/server";
import {
  FORMAT_ERROR_MESSAGE,
  PRIVATE_OR_MISSING_MESSAGE,
  parseSpotifyInput,
  spotifyTypeLabel,
  type SpotifyItem,
} from "@/lib/spotify";

const OEMBED_TIMEOUT_MS = 8000;

interface SpotifyOEmbedPayload {
  title?: unknown;
  thumbnail_url?: unknown;
  provider_name?: unknown;
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "";
  const parsed = parseSpotifyInput(rawUrl);

  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_FORMAT",
        message: FORMAT_ERROR_MESSAGE,
      },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.url)}`;
    const upstream = await fetch(oembedUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (upstream.status === 404 || upstream.status === 400 || upstream.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND_OR_PRIVATE",
          message: PRIVATE_OR_MISSING_MESSAGE,
        },
        { status: 404 }
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "NETWORK",
          message:
            "Spotify sedang sulit dihubungi. Coba lagi sebentar atau pilih playlist preset.",
        },
        { status: 502 }
      );
    }

    const payload = (await upstream.json()) as SpotifyOEmbedPayload;
    const title =
      typeof payload.title === "string" && payload.title.trim()
        ? payload.title.trim()
        : `Spotify ${spotifyTypeLabel(parsed.type)}`;
    const thumbnailUrl =
      typeof payload.thumbnail_url === "string" &&
      /^https?:\/\//i.test(payload.thumbnail_url)
        ? payload.thumbnail_url
        : null;
    const providerName =
      typeof payload.provider_name === "string" && payload.provider_name.trim()
        ? payload.provider_name.trim()
        : "Spotify";

    const item: SpotifyItem = {
      type: parsed.type,
      id: parsed.id,
      uri: parsed.uri,
      url: parsed.url,
      title,
      thumbnailUrl,
      providerName,
    };

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        code: isTimeout ? "TIMEOUT" : "NETWORK",
        message: isTimeout
          ? "Spotify lambat merespons. Coba lagi atau pilih dari preset belajar."
          : "Gagal menghubungi layanan Spotify oEmbed.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
