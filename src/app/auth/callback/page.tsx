"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, saveTokens } from "@/lib/authStorage";
import { refreshSession } from "@/services/api/client";
import { landingPathAfterLogin } from "@/services/api/profile";

interface CallbackOutcome {
  redirect?: string;
  error?: string;
}

// Satu proses bersama agar React StrictMode (dev) tidak menghapus #hash dua kali saat mount ganda
let callbackTask: Promise<CallbackOutcome> | null = null;

/**
 * Supabase mengembalikan pengguna ke sini setelah login Google, dengan token di bagian # URL.
 * Token disimpan sementara lalu diverifikasi lewat backend (/auth/refresh); bila gagal, token dihapus bersih.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!callbackTask) {
      const params = new URLSearchParams(
        window.location.hash.slice(1) || window.location.search.slice(1)
      );
      // Hapus token dari address bar dan riwayat browser
      window.history.replaceState(null, "", window.location.pathname);

      const failure = params.get("error_description") || params.get("error");
      const access = params.get("access_token");
      const refresh = params.get("refresh_token");

      callbackTask = (async (): Promise<CallbackOutcome> => {
        if (failure || !access || !refresh) {
          return {
            error: failure
              ? failure.replace(/\+/g, " ")
              : "Google sign-in did not finish. Please try again.",
          };
        }

        saveTokens({ access_token: access, refresh_token: refresh });
        try {
          // Tukar sekali lewat backend: mendapat session_expires_at dan memastikan token diterima server
          if (!(await refreshSession())) {
            clearAuth();
            return {
              error: "We couldn't confirm your Google sign-in. Please try again.",
            };
          }
          return { redirect: await landingPathAfterLogin() };
        } catch {
          clearAuth();
          return {
            error: "We couldn't confirm your Google sign-in. Please try again.",
          };
        }
      })();
    }

    callbackTask.then((result) => {
      if (cancelled) return;
      callbackTask = null;
      if (result.error) {
        setError(result.error);
      } else if (result.redirect) {
        router.replace(result.redirect);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10 text-center">
      {error ? (
        <div className="w-full max-w-[420px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 shadow-[0_14px_40px_rgba(53,16,128,0.06)]">
          <h1 className="m-0 mb-2 text-[22px] font-bold text-[#2A1163]">Sign-in failed</h1>
          <p className="m-0 mb-5 text-[12.5px] text-[#7B728E]">{error}</p>
          <Link
            href="/login"
            style={{ color: "#FFFFFF" }}
            className="inline-flex rounded-full bg-[#351080] px-6 py-2.5 text-[13px] font-bold !text-white transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96]"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <p className="m-0 text-[13px] font-semibold text-[#351080]" role="status">
          Signing you in…
        </p>
      )}
    </main>
  );
}
