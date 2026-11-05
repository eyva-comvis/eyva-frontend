"use client";

import { useRef } from "react";

interface OtpInputProps {
  digits: string[];
  onChange: (digits: string[]) => void;
  idPrefix?: string;
}

/** Kotak kode verifikasi per digit (gaya sama dengan halaman Forgot password). Mendukung tempel kode sekaligus. */
export default function OtpInput({ digits, onChange, idPrefix = "otp" }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const length = digits.length;

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    onChange(updated);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!pasted) return;
    onChange(Array.from({ length }, (_, i) => pasted[i] || ""));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="grid gap-2 sm:gap-2.5" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`${idPrefix}-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          aria-label={`Verification digit ${index + 1}`}
          style={{ fontWeight: 700, fontSize: "16px" }}
          className="h-[48px] w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] text-center !text-[16px] !font-bold text-[#2A1163] outline-none transition focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/15"
        />
      ))}
    </div>
  );
}
