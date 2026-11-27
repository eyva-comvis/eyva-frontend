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

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 block w-full px-4 pt-3.5 sm:px-6">
        <div
          className={`pointer-events-auto mx-auto flex w-full max-w-[1120px] items-center justify-between rounded-full px-4 py-2.5 sm:px-6 transition-[background,border-color,box-shadow] duration-250 ${
            scrolled ? "eyva-glass-nav-scrolled" : "eyva-glass-nav"
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
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#3C2869] transition-[background-color,color,box-shadow] duration-150 hover:bg-white/70 hover:text-[#351080] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
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
                className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#351080]/95 px-5 py-2 text-[13px] !font-bold !text-white shadow-[0_6px_18px_rgba(53,16,128,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-[background-color,transform,box-shadow] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full px-4 py-2 text-[13px] font-bold text-[#351080] transition-[background-color,transform,box-shadow] duration-150 hover:bg-white/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  style={{ color: "#FFFFFF", fontWeight: 700 }}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#351080]/95 px-5 py-2 text-[13px] !font-bold !text-white shadow-[0_6px_18px_rgba(53,16,128,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-[background-color,transform,box-shadow] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
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
            className="eyva-glass-inset inline-flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#351080] transition-[background-color,transform] duration-150 hover:bg-white/85 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] md:hidden"
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
              className="eyva-glass-sheet pointer-events-auto absolute inset-x-4 top-full z-50 mx-auto mt-2.5 max-w-[1120px] rounded-[22px] p-4 sm:inset-x-6 md:hidden"
            >
              <nav aria-label="Mobile Landing Navigation" className="flex flex-col gap-1">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-[12px] px-3.5 text-[14px] font-semibold text-[#2A1163] transition-colors duration-150 hover:bg-white/75"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-3 flex flex-col gap-2 border-t border-[#351080]/10 pt-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard/home"
                    onClick={() => setMobileOpen(false)}
                    style={{ color: "#FFFFFF", fontWeight: 700 }}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[#351080] px-4 text-[13.5px] !font-bold !text-white shadow-[0_6px_16px_rgba(53,16,128,0.24)]"
                  >
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="eyva-glass-inset flex min-h-[44px] w-full items-center justify-center rounded-[12px] px-4 text-[13.5px] font-bold text-[#351080]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      style={{ color: "#FFFFFF", fontWeight: 700 }}
                      className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[#351080] px-4 text-[13.5px] !font-bold !text-white shadow-[0_6px_16px_rgba(53,16,128,0.24)]"
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
