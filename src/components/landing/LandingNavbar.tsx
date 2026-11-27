"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { EYVA_EASE } from "@/components/motion/MotionPrimitives";

interface LandingNavbarProps {
  isLoggedIn: boolean;
}

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#privacy", label: "Privacy" },
] as const;

export default function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-[10px] focus:bg-[#351080] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:!text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 block w-full px-4 pt-3 sm:px-6">
        <div
          className={`mx-auto flex w-full max-w-[1120px] items-center justify-between rounded-full border px-4 py-2.5 sm:px-6 transition-[background-color,border-color,box-shadow] duration-200 ${
            scrolled
              ? "border-[#DDD3F2] bg-white/88 backdrop-blur-md shadow-[0_10px_30px_rgba(45,10,115,0.08)]"
              : "border-[#ECE6F7] bg-[#FFFEF9]/95"
          }`}
        >
          {/* Brand Mark */}
          <Link
            href="/"
            aria-label="EYVA Home"
            className="inline-flex shrink-0 items-center rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
          >
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA Smart Study Companion"
              width={102}
              height={48}
              priority
              className="h-auto w-[96px] sm:w-[102px]"
            />
          </Link>

          {/* Desktop Anchor Links */}
          <nav
            aria-label="Landing Page Sections"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#4A3875] transition-[background-color,color] duration-150 hover:bg-[#F2ECFF] hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth / Dashboard Actions */}
          <div className="hidden items-center gap-2.5 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard/home"
                style={{ color: "#FFFFFF", fontWeight: 700 }}
                className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#351080] px-5 py-2 text-[13px] !font-bold !text-white shadow-[0_3px_0_#220856] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full px-4 py-2 text-[13px] font-bold text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#F2ECFF] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  style={{ color: "#FFFFFF", fontWeight: 700 }}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#351080] px-5 py-2 text-[13px] !font-bold !text-white shadow-[0_3px_0_#220856] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  Start Focusing Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger (44x44 touch target) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="eyva-mobile-landing-menu"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#E5DFEE] bg-white text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#F2ECFF] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] md:hidden"
          >
            {mobileOpen ? (
              <X size={18} strokeWidth={2.3} aria-hidden="true" />
            ) : (
              <Menu size={18} strokeWidth={2.3} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Sheet (overlays content without CLS) */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="eyva-mobile-landing-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: EYVA_EASE }}
              className="absolute inset-x-4 top-full z-50 mx-auto mt-2 max-w-[1120px] rounded-[20px] border border-[#DDD3F2] bg-white p-4 shadow-[0_16px_40px_rgba(45,10,115,0.12)] sm:inset-x-6 md:hidden"
            >
              <nav aria-label="Mobile Landing Navigation" className="flex flex-col gap-1">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-[12px] px-3.5 text-[14px] font-semibold text-[#2A1163] transition-colors duration-150 hover:bg-[#F2ECFF]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-3 flex flex-col gap-2 border-t border-[#EFEAF7] pt-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard/home"
                    onClick={() => setMobileOpen(false)}
                    style={{ color: "#FFFFFF", fontWeight: 700 }}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[#351080] px-4 text-[13.5px] !font-bold !text-white"
                  >
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-[#DFD6F2] bg-[#FAF8FF] px-4 text-[13.5px] font-bold text-[#351080]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      style={{ color: "#FFFFFF", fontWeight: 700 }}
                      className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[#351080] px-4 text-[13.5px] !font-bold !text-white"
                    >
                      Start Focusing Free
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
