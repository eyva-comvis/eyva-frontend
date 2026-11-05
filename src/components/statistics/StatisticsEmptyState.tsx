"use client";

import Image from "next/image";
import Link from "next/link";

export default function StatisticsEmptyState() {
  return (
    <section
      aria-label="No Statistics Available"
      className="mt-6 flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#DCD0F2] bg-[#FAF8FF] px-6 py-12 text-center shadow-[0_4px_14px_rgba(45,10,115,0.03)]"
    >
      <div className="mb-4 rounded-[18px] bg-[#FFF238] px-6 py-4 shadow-xs">
        <Image
          src="/images/eyva_start.svg"
          alt="EYVA Mascot"
          width={120}
          height={100}
          className="h-auto w-[115px]"
        />
      </div>

      <h2 className="m-0 text-[20px] font-extrabold tracking-tight text-[#2A1163]">
        Your journey starts here!
      </h2>
      <p className="m-0 mt-1.5 max-w-[340px] text-[11.5px] leading-relaxed text-[#7B728E]">
        Complete your first study session to see your progress.
      </p>

      <Link
        href="/dashboard/home"
        style={{
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "11.5px",
        }}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#351080] px-6 py-2.5 text-[11.5px] !font-bold !text-white shadow-[0_4px_10px_rgba(53,16,128,0.22)] transition hover:bg-[#43189E]"
      >
        <svg
          width="10"
          height="12"
          viewBox="0 0 12 14"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
        </svg>
        <span>Start your first session</span>
      </Link>
    </section>
  );
}
