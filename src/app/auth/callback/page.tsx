"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveTokens } from "@/lib/authStorage";
import { refreshSession } from "@/services/api/client";
import { landingPathAfterLogin } from "@/services/api/profile";

/**
 * Supabase mengembalikan pengguna ke sini setelah login Google, dengan token di bagian # URL.
 * Token disimpan, lalu dirapikan lewat backend (/auth/refresh) supaya batas umur login berlaku.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
    // Hapus token dari address bar dan riwayat browser
    window.history.replaceState(null, "", window.location.pathname);

    const failure = params.get("error_description") || params.get("error");
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (failure || !access || !refresh) {
      setError(failure ? failure.replace(/\+/g, " ") : "Google sign-in did not finish. Please try again.");
      return;
    }

    (async () => {
      saveTokens({ access_token: access, refresh_token: refresh });
      // Tukar sekali lewat backend: mendapat session_expires_at dan memastikan token diterima server
      if (!(await refreshSession())) {
        setError("We couldn't confirm your Google sign-in. Please try again.");
        return;
      }
      router.replace(await landingPathAfterLogin());
    })();
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
            className="inline-flex rounded-full bg-[#351080] px-6 py-2.5 text-[13px] font-bold !text-white hover:bg-[#43189E]"
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
