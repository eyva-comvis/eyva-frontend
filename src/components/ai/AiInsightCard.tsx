"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { InsightResult } from "@/services/api/sessions";

interface AiInsightCardProps {
  eyebrow: string;
  title: string;
  /** Dipanggil sekali saat kartu tampil. */
  load: () => Promise<InsightResult>;
  className?: string;
}

/** Kartu saran AI (LLM backend). Bila LLM tidak tersedia, backend mengirim teks cadangan berbasis aturan. */
export default function AiInsightCard({ eyebrow, title, load, className = "" }: AiInsightCardProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [insight, setInsight] = useState<InsightResult | null>(null);

  useEffect(() => {
    let alive = true;
    load()
      .then((r) => {
        if (!alive) return;
        setInsight(r);
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
    // load hanya dipanggil sekali per kartu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "error") return null;

  return (
    <section
      aria-live="polite"
      aria-busy={state === "loading"}
      className={`rounded-[16px] border border-[#EAE4F3] bg-white px-6 py-4 shadow-[0_4px_14px_rgba(45,10,115,0.06)] ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[#351080]">
          <Sparkles size={18} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-semibold tracking-[0.06em] text-[#7B728E] uppercase">{eyebrow}</div>
          <div className="mt-0.5 text-[14px] font-bold text-[#2A1163]">{title}</div>
          {state === "loading" ? (
            <div className="mt-2 flex flex-col gap-1.5" aria-label="Loading">
              <span className="h-[9px] w-full animate-pulse rounded-full bg-[#F2ECFF]" />
              <span className="h-[9px] w-[85%] animate-pulse rounded-full bg-[#F2ECFF]" />
              <span className="h-[9px] w-[60%] animate-pulse rounded-full bg-[#F2ECFF]" />
            </div>
          ) : (
            <>
              <p className="m-0 mt-1.5 text-[11.5px] leading-[1.6] text-[#4D4166]">{insight?.text}</p>
              <p className="m-0 mt-2 text-[9.5px] text-[#9A90AD]">
                {insight?.source === "llm" ? "Written by AI from your session numbers." : "Quick tip from your session numbers."}{" "}
                Visual indications only, not a diagnosis.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
