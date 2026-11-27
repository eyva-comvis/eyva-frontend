"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LogOut, X } from "lucide-react";
import {
  EYVA_EASE,
  EYVA_SPRING,
  TactileButton,
} from "@/components/motion/MotionPrimitives";

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
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="logout-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EYVA_EASE }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/25 px-4 backdrop-blur-[3px]"
          onClick={onCancel}
        >
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={EYVA_SPRING}
            className="relative w-full max-w-[390px] rounded-[20px] border border-[#EAE4F3] bg-white p-6 text-center shadow-[0_18px_46px_rgba(45,10,115,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close confirmation dialog"
              className="absolute top-4 right-4 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#F6F3FB] text-[#6E6285] transition-colors duration-150 hover:bg-[#EAE3F7] hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
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
              <TactileButton
                type="button"
                onClick={onCancel}
                style={{
                  color: "#351080",
                  fontWeight: 700,
                  fontSize: "11.5px",
                }}
                className="flex h-[40px] flex-1 items-center justify-center rounded-[10px] border border-[#DFD8EE] bg-white px-4 !text-[11.5px] !font-bold !text-[#351080] transition-colors duration-150 hover:bg-[#FAF7FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                Stay Logged In
              </TactileButton>

              <TactileButton
                type="button"
                onClick={onConfirm}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "11.5px",
                }}
                className="flex h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border-0 bg-[#9F3D69] px-4 !text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#722447] transition-colors duration-150 hover:bg-[#8A3259] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9F3D69]"
              >
                <LogOut size={13.5} strokeWidth={2.3} />
                <span>Yes, Log Out</span>
              </TactileButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
