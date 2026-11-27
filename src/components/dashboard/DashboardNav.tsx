"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home as HomeIcon, History, BarChart2, Settings } from "lucide-react";
import { EYVA_SPRING } from "@/components/motion/MotionPrimitives";

const NAV_ITEMS = [
  { href: "/dashboard/home", label: "Home", Icon: HomeIcon },
  { href: "/dashboard/history", label: "History", Icon: History },
  { href: "/dashboard/statistics", label: "Statistics", Icon: BarChart2 },
] as const;

export function DashboardSidebar({ blurred = false }: { blurred?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary Dashboard Navigation"
      className={`fixed inset-y-0 left-0 z-20 hidden w-[198px] flex-col justify-between border-r border-[#EAE5F2] bg-white px-4 pt-6 pb-0 transition-[filter] duration-200 md:flex ${
        blurred ? "blur-[4px] pointer-events-none select-none" : ""
      }`}
    >
      <div>
        {/* Brand Logo */}
        <div className="mb-8 px-2">
          <Link
            href="/dashboard/home"
            aria-label="EYVA Dashboard Home"
            className="inline-block rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
          >
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA Smart Study Companion"
              width={108}
              height={52}
              priority
              className="h-auto w-[108px]"
            />
          </Link>
        </div>

        {/* Shared-layout animated sidebar pills */}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                style={{
                  color: isActive ? "#FFFFFF" : "#351080",
                  fontWeight: 700,
                  fontSize: "12.5px",
                }}
                className={`group relative flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                  isActive
                    ? "!text-white"
                    : "!text-[#351080] hover:bg-[#F5F1FC]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="eyva-sidebar-active-pill"
                    transition={EYVA_SPRING}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#351080] shadow-[0_4px_12px_rgba(53,16,128,0.22)]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center transition-transform duration-150 group-hover:translate-x-0.5">
                  <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Leaf Decoration at Bottom Left */}
      <div className="mt-auto flex justify-center overflow-hidden pt-4">
        <Image
          src="/images/leaf_for_homepage.svg"
          alt=""
          width={118}
          height={208}
          className="h-auto w-[115px] translate-y-1 pointer-events-none select-none"
        />
      </div>
    </aside>
  );
}

export function DashboardTopBar({ avatarSrc }: { avatarSrc: string }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center justify-between md:justify-end">
        {/* Mobile Brand Logo */}
        <div className="md:hidden">
          <Link
            href="/dashboard/home"
            aria-label="EYVA Dashboard Home"
            className="inline-block rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
          >
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA Smart Study Companion"
              width={98}
              height={46}
              priority
              className="h-auto w-[98px]"
            />
          </Link>
        </div>

        {/* Top Right Profile Avatar with Gear Icon */}
        <Link
          href="/dashboard/profile"
          aria-label="Edit Profile"
          className="relative inline-block rounded-full transition-transform duration-150 hover:scale-105 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
        >
          <div className="h-[38px] w-[38px] overflow-hidden rounded-full border-2 border-[#351080] bg-[#F9E8FF]">
            <Image
              src={avatarSrc}
              alt="User Avatar"
              width={38}
              height={38}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -right-0.5 -bottom-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-white bg-[#EDE6FA] text-[#351080] shadow-xs">
            <Settings size={10} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </Link>
      </div>

      {/* Mobile Navigation Pills (< md) with shared layoutId */}
      <nav
        aria-label="Mobile Dashboard Navigation"
        className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[#EFEAF7] pb-3 md:hidden"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              style={{
                color: isActive ? "#FFFFFF" : "#351080",
                fontWeight: 700,
                fontSize: "11.5px",
              }}
              className={`relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] !font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                isActive ? "!text-white" : "!text-[#351080] hover:bg-[#F5F1FC]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="eyva-mobile-nav-pill"
                  transition={EYVA_SPRING}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[#351080]"
                />
              )}
              <Icon
                size={14}
                strokeWidth={2.2}
                aria-hidden="true"
                className="relative z-10"
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
