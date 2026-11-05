"use client";

import { LogOut, X } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/25 px-4 backdrop-blur-[3px]"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[390px] rounded-[20px] border border-[#EAE4F3] bg-white p-6 text-center shadow-[0_18px_46px_rgba(45,10,115,0.16)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
          className="absolute top-4 right-4 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#F6F3FB] text-[#6E6285] transition hover:bg-[#EAE3F7] hover:text-[#351080]"
        >
          <X size={15} strokeWidth={2.2} />
        </button>

        {/* Icon Badge */}
        <div className="mx-auto mb-3.5 flex h-[48px] w-[48px] items-center justify-center rounded-full border border-[#F5D0DC] bg-[#FDF2F6] text-[#9F3D69]">
          <LogOut size={21} strokeWidth={2.2} />
        </div>

        <h3
          id="logout-modal-title"
          className="m-0 text-[18px] font-extrabold tracking-tight text-[#2A1163]"
        >
          Ready to wrap up for now?
        </h3>

        <p className="m-0 mt-1.5 text-[11.5px] leading-relaxed text-[#6E6285]">
          Are you sure you want to log out of your Eyva account? Your study
          sessions and companion preferences are safely saved.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            style={{
              color: "#351080",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="flex h-[40px] flex-1 items-center justify-center rounded-[10px] border border-[#DFD8EE] bg-white px-4 !text-[11.5px] !font-bold !text-[#351080] transition hover:bg-[#FAF7FF]"
          >
            Stay Logged In
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="flex h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border-0 bg-[#9F3D69] px-4 !text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#722447] transition hover:bg-[#8A3259] active:translate-y-[1px]"
          >
            <LogOut size={13.5} strokeWidth={2.3} />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
