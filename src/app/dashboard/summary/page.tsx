"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";

export default function SummaryPage() {
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");
  const [sessionTitle, setSessionTitle] = useState("Study Session");
  const [selectedFeeling, setSelectedFeeling] = useState<
    "good" | "okay" | "tough" | null
  >(null);
  const [popupPhase, setPopupPhase] = useState<
    "idle" | "entering" | "morphing" | "pulling" | "landed"
  >("idle");
  const [collapseOthers, setCollapseOthers] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [pullVector, setPullVector] = useState({ x: 0, y: 0 });

  const targetSlotRef = useRef<HTMLButtonElement | null>(null);

  const handleSelectFeeling = (feeling: "good" | "okay" | "tough") => {
    // User can only choose once
    if (selectedFeeling !== null) return;

    setSelectedFeeling(feeling);
    setPopupPhase("entering");

    // Smoothly collapse the other two unselected cards while popup is open
    setTimeout(() => {
      setCollapseOthers(true);
    }, 180);

    // Phase 2: Softly dissolve the popup frame & text into the floating expression card
    setTimeout(() => {
      if (targetSlotRef.current && typeof window !== "undefined") {
        const rect = targetSlotRef.current.getBoundingClientRect();
        const slotCenterX = rect.left + rect.width / 2;
        const slotCenterY = rect.top + rect.height / 2;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        setPullVector({
          x: slotCenterX - viewportCenterX,
          y: slotCenterY - viewportCenterY,
        });
      }
      setPopupPhase("morphing");
    }, 2050);

    // Phase 3: Smoothly pull the floating expression card directly into the target slot
    setTimeout(() => {
      if (targetSlotRef.current && typeof window !== "undefined") {
        const rect = targetSlotRef.current.getBoundingClientRect();
        const slotCenterX = rect.left + rect.width / 2;
        const slotCenterY = rect.top + rect.height / 2;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        setPullVector({
          x: slotCenterX - viewportCenterX,
          y: slotCenterY - viewportCenterY,
        });
      }
      setPopupPhase("pulling");
    }, 2400);

    // Phase 4: Expression docks seamlessly into the reflection card slot
    setTimeout(() => {
      setPopupPhase("landed");
    }, 3150);

    // Phase 5: Smoothly reveal "Start another session" and "View history" buttons
    setTimeout(() => {
      setShowActionButtons(true);
    }, 3320);
  };

  const feelingMeta = {
    good: {
      label: "Good",
      image: "/images/eyva_good.svg",
      message: "Yay! Glad you did good this time.",
      subtext: "Keep riding that wonderful momentum!",
      badgeBg: "border-[#351080] bg-[#FFFCE0]",
      popupRing: "border-[#EDE49A] bg-[#FFFEF5]",
      animClass: "eyva-dance-happy",
    },
    okay: {
      label: "Okay",
      image: "/images/eyva_okay.svg",
      message: "Nice! Steady progress still counts.",
      subtext: "Showing up and doing your best is already a win.",
      badgeBg: "border-[#351080] bg-[#FAF8F2]",
      popupRing: "border-[#E5DEC9] bg-[#FFFEFA]",
      animClass: "eyva-dance-okay",
    },
    tough: {
      label: "Tough",
      image: "/images/eyva_tough.svg",
      message: "Aww, hang in there! You still made it through.",
      subtext: "Tough sessions happen. Be gentle with yourself and rest up!",
      badgeBg: "border-[#351080] bg-[#EEF5FA]",
      popupRing: "border-[#D5E3F0] bg-[#FAFCFF]",
      animClass: "eyva-dance-tough",
    },
  } as const;

  useEffect(() => {
    const savedAvatar = localStorage.getItem("eyva_avatar");
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }

    const savedConfig = localStorage.getItem("eyva_session_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.title) {
          setSessionTitle(parsed.title);
        }
      } catch {
        // Use default
      }
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF2] pl-6 pr-8 pt-6 pb-12 sm:pr-12 text-[#351080]">
      {/* TOP BAR: LOGO LEFT & AVATAR RIGHT (Exact same coordinates as Home & FocusSession) */}
      <div className="flex items-start justify-between">
        <Link href="/dashboard/home" aria-label="EYVA Home">
          <Image
            src="/images/eyva_icon.svg"
            alt="EYVA Smart Study Companion"
            width={108}
            height={52}
            priority
            className="h-auto w-[108px]"
          />
        </Link>

        <Link
          href="/dashboard/profile"
          aria-label="Edit Profile"
          className="relative inline-block transition-transform hover:scale-105"
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
          <span className="absolute -bottom-0.5 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-white bg-[#EDE6FA] text-[#351080] shadow-xs">
            <Settings size={10} strokeWidth={2.5} />
          </span>
        </Link>
      </div>

      {/* HEADER CENTER */}
      <div className="mt-2 mb-7 text-center">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
          <span>SESSION WRAPPED UP</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#351080"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="m12 13 2 2 4-4" />
          </svg>
        </div>

        <h1 className="m-0 mt-1.5 text-[30px] font-bold tracking-tight text-[#2A1163]">
          You did beyond great!
        </h1>
        <p className="m-0 mt-1.5 text-[11px] text-[#7B728E]">
          Every little effort counts. Here&apos;s your session at a glance
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-[920px] flex flex-col gap-5">
        {/* 1. YOU WORKED ON CARD */}
        <section className="flex items-center justify-between rounded-[16px] border border-[#EAE4F3] bg-white px-6 py-4 shadow-[0_4px_14px_rgba(45,10,115,0.06)]">
          <div className="flex items-center gap-4">
            {/* Document Check Icon */}
            <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center text-[#5C3D99]">
              <svg
                width="24"
                height="28"
                viewBox="0 0 24 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M14 1H4C2.34315 1 1 2.34315 1 4V24C1 25.6569 2.34315 27 4 27H20C21.6569 27 23 25.6569 23 24V10L14 1Z"
                  fill="#624794"
                />
                <path
                  d="M14 1V8C14 9.10457 14.8954 10 16 10H23L14 1Z"
                  fill="#D4C4FF"
                />
                <path
                  d="M8.5 17.5L11 20L16 15"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <div className="text-[9px] font-semibold tracking-[0.06em] text-[#7B728E] uppercase">
                YOU WORKED ON
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[#2A1163]">
                {sessionTitle}
              </div>
              <div className="mt-0.5 text-[10.5px] text-[#7B728E]">
                Session ended by you
              </div>
            </div>
          </div>

          <span className="text-[10.5px] font-bold text-[#2A1163]">
            Just now
          </span>
        </section>

        {/* 2. THREE STAT CARDS */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: TOTAL YAWNS */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] p-5 shadow-[0_4px_14px_rgba(45,10,115,0.06)]">
            <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
              TOTAL YAWNS
            </div>

            <div className="my-3.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1 text-[#2A1163]">
                <strong className="text-[28px] font-extrabold leading-none">
                  2
                </strong>
                <span className="text-[12px] font-bold">X</span>
              </div>

              {/* Solid Purple Yawning Icon */}
              <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#351080] text-white">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Left sleepy closed eye */}
                  <path
                    d="M6.5 9.5C7.3 10.8 9.2 10.8 10 9.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Right sleepy closed eye */}
                  <path
                    d="M14 9.5C14.8 10.8 16.7 10.8 17.5 9.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Wide open yawning mouth */}
                  <ellipse
                    cx="12"
                    cy="15.8"
                    rx="3.2"
                    ry="4"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <div className="text-[10px] text-[#6E6285]">
              Your yawns detected
            </div>
          </div>

          {/* Card 2: DROWSINESS ALERTS */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] p-5 shadow-[0_4px_14px_rgba(45,10,115,0.06)]">
            <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
              DROWSINESS ALERTS
            </div>

            <div className="my-3.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1 text-[#2A1163]">
                <strong className="text-[28px] font-extrabold leading-none">
                  2
                </strong>
                <span className="text-[12px] font-bold">X</span>
              </div>

              {/* Solid Purple Exclamation Icon */}
              <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#351080] text-white">
                <span className="text-[16px] font-extrabold leading-none">
                  !
                </span>
              </div>
            </div>

            <div className="text-[10px] text-[#6E6285]">
              Gentle reminders along the way
            </div>
          </div>

          {/* Card 3: BREAK TIME */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] p-5 shadow-[0_4px_14px_rgba(45,10,115,0.06)]">
            <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
              BREAK TIME
            </div>

            <div className="my-3.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1 text-[#2A1163]">
                <strong className="text-[28px] font-extrabold leading-none">
                  5
                </strong>
                <span className="text-[12px] font-bold">min</span>
              </div>

              {/* Solid Purple Coffee Cup Icon */}
              <div className="flex h-[32px] w-[36px] items-center justify-center text-[#351080]">
                <svg
                  width="34"
                  height="32"
                  viewBox="2 5 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 6H17V14C17 17.3137 14.3137 20 11 20H9C5.68629 20 3 17.3137 3 14V6Z"
                    fill="#351080"
                  />
                  <path
                    d="M17 8H19C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H17"
                    stroke="#351080"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="text-[10px] text-[#6E6285]">
              Time spent resting
            </div>
          </div>
        </section>

        {/* 3. A MOMENT TO REFLECT CARD */}
        <section className="flex flex-col justify-between gap-4 rounded-[16px] border border-[#EAE4F3] bg-white px-6 py-4 shadow-[0_4px_14px_rgba(45,10,115,0.06)] sm:flex-row sm:items-center">
          <div>
            <div className="text-[9px] font-semibold tracking-[0.06em] text-[#7B728E] uppercase">
              A MOMENT TO REFLECT
            </div>
            <div className="mt-0.5 text-[14px] font-bold text-[#2A1163]">
              How did this session feel?
            </div>
            <div className="mt-0.5 text-[10.5px] text-[#7B728E]">
              This is just for your own reflection. No right or wrong answer.
            </div>
          </div>

          {/* Feeling Options: Good, Okay, Tough */}
          <div className="flex items-center">
            {(["good", "okay", "tough"] as const).map((feeling, idx) => {
              const isSelected = selectedFeeling === feeling;
              const isHiddenOther = collapseOthers && !isSelected;
              const isFlyingInPopup =
                isSelected &&
                (popupPhase === "entering" ||
                  popupPhase === "morphing" ||
                  popupPhase === "pulling");

              const defaultStyle =
                feeling === "good"
                  ? "border-[#EDE6C8] bg-[#FFFDF0] hover:border-[#351080]/50"
                  : feeling === "okay"
                    ? "border-[#E8E4DC] bg-[#FCFBF7] hover:border-[#351080]/50"
                    : "border-[#DCE6F0] bg-[#F4F8FB] hover:border-[#351080]/50";

              return (
                <div
                  key={feeling}
                  className={`overflow-hidden transition-all duration-500 ease-out ${
                    isHiddenOther
                      ? "ml-0 max-w-0 scale-75 opacity-0"
                      : idx > 0 && !collapseOthers
                        ? "ml-3 max-w-[66px] opacity-100"
                        : "ml-0 max-w-[66px] opacity-100"
                  }`}
                >
                  <button
                    ref={isSelected ? targetSlotRef : undefined}
                    type="button"
                    disabled={selectedFeeling !== null}
                    onClick={() => handleSelectFeeling(feeling)}
                    className={`flex h-[62px] w-[66px] flex-col items-center justify-center gap-1 rounded-[10px] border transition-colors duration-300 ${
                      isSelected
                        ? isFlyingInPopup
                          ? "border-dashed border-[#351080]/25 bg-[#F5F1FF]/40 opacity-30 cursor-default"
                          : `${feelingMeta[feeling].badgeBg} ring-2 ring-[#351080]/20 cursor-default`
                        : defaultStyle
                    }`}
                  >
                    <Image
                      src={feelingMeta[feeling].image}
                      alt={feelingMeta[feeling].label}
                      width={34}
                      height={30}
                      className={`h-auto w-[34px] transition-opacity duration-200 ${
                        isFlyingInPopup ? "opacity-0" : "opacity-100"
                      }`}
                    />
                    <span
                      style={{ fontSize: "8.5px", fontWeight: 700 }}
                      className={`!text-[8.5px] !font-bold text-[#2A1163] transition-opacity duration-200 ${
                        isFlyingInPopup ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {feelingMeta[feeling].label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. BOTTOM ACTION BUTTONS (Revealed smoothly after expression docks into card) */}
        <div
          className={`mt-3 flex items-center justify-center gap-4 transition-all duration-600 ease-out ${
            showActionButtons
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
          aria-hidden={!showActionButtons}
        >
          <Link
            href="/dashboard/home"
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="flex h-[42px] min-w-[172px] items-center justify-center gap-2 rounded-[9px] bg-[#624794] px-5 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition hover:bg-[#553B87] active:translate-y-[1px]"
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
            <span>Start another session</span>
          </Link>

          <Link
            href="/dashboard/history"
            style={{
              color: "#2A1163",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="flex h-[42px] min-w-[172px] items-center justify-center rounded-[9px] border border-[#EAE4F3] bg-white px-5 text-[11.5px] !font-bold !text-[#2A1163] shadow-xs transition hover:bg-[#FAF8FF] active:translate-y-[1px]"
          >
            View history
          </Link>
        </div>
      </div>

      {/* =========================================================
          POPUP REFLECTION REACTION -> MORPH -> PULLED INTO SLOT
      ========================================================= */}
      {(popupPhase === "entering" ||
        popupPhase === "morphing" ||
        popupPhase === "pulling") &&
        selectedFeeling && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-600 ease-out ${
              popupPhase === "entering"
                ? "bg-[#351080]/20 backdrop-blur-[4px]"
                : popupPhase === "morphing"
                  ? "bg-[#351080]/12 backdrop-blur-[2px]"
                  : "bg-transparent backdrop-blur-none pointer-events-none"
            }`}
          >
            {/* LAYER 1: Full Popup Card (Visible during 'entering', softly dissolves during 'morphing') */}
            <div
              className={`flex w-full max-w-[340px] flex-col items-center rounded-[22px] border-2 px-7 py-8 text-center shadow-[0_20px_60px_rgba(42,17,99,0.24)] transition-all duration-350 ease-out ${
                feelingMeta[selectedFeeling].popupRing
              } ${
                popupPhase === "entering"
                  ? "eyva-popup-enter opacity-100 scale-100"
                  : "pointer-events-none opacity-0 scale-90"
              }`}
            >
              {/* Animated EYVA Character Container */}
              <div className="relative mb-3 flex h-[92px] w-[108px] items-center justify-center">
                {selectedFeeling === "good" && (
                  <>
                    <span className="eyva-sparkle-1 absolute -top-1 left-2 text-[16px] text-[#E6B800]">
                      ✦
                    </span>
                    <span className="eyva-sparkle-2 absolute top-1 right-1 text-[14px] text-[#624794]">
                      ★
                    </span>
                    <span className="eyva-sparkle-1 absolute bottom-2 -left-1 text-[12px] text-[#624794]">
                      ✦
                    </span>
                  </>
                )}
                {selectedFeeling === "okay" && (
                  <>
                    <span className="eyva-sparkle-1 absolute top-0 left-2 text-[14px] text-[#624794]">
                      ✦
                    </span>
                    <span className="eyva-sparkle-2 absolute top-2 right-2 text-[13px] text-[#8E7AB5]">
                      •
                    </span>
                  </>
                )}
                {selectedFeeling === "tough" && (
                  <>
                    <span className="eyva-sparkle-1 absolute -top-1 right-3 text-[15px] text-[#8A64D6]">
                      ♥
                    </span>
                    <span className="eyva-sparkle-2 absolute top-2 left-2 text-[12px] text-[#7BA7D7]">
                      ✦
                    </span>
                  </>
                )}

                <div className={feelingMeta[selectedFeeling].animClass}>
                  <Image
                    src={feelingMeta[selectedFeeling].image}
                    alt={feelingMeta[selectedFeeling].label}
                    width={78}
                    height={68}
                    className="h-auto w-[78px] drop-shadow-[0_8px_14px_rgba(53,16,128,0.16)]"
                  />
                </div>
              </div>

              <span className="mb-2 inline-block rounded-full bg-[#EFE9FF] px-3 py-0.5 text-[9.5px] font-bold tracking-[0.06em] text-[#351080] uppercase">
                {feelingMeta[selectedFeeling].label} Session
              </span>

              <div className="text-[17px] font-extrabold leading-snug text-[#2A1163]">
                {feelingMeta[selectedFeeling].message}
              </div>

              <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-[#6E6285]">
                {feelingMeta[selectedFeeling].subtext}
              </p>
            </div>

            {/* LAYER 2: Exact 66x62px Expression Badge that emerges in center and glides 1:1 into targetSlotRef */}
            <div
              style={{
                transform:
                  popupPhase === "entering"
                    ? "translate3d(0px, -18px, 0) scale(1.9)"
                    : popupPhase === "morphing"
                      ? "translate3d(0px, 0px, 0) scale(1.75)"
                      : `translate3d(${pullVector.x}px, ${pullVector.y}px, 0) scale(1)`,
                opacity: popupPhase === "entering" ? 0 : 1,
                transition:
                  popupPhase === "morphing"
                    ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease-out"
                    : popupPhase === "pulling"
                      ? "transform 0.75s cubic-bezier(0.22, 1, 0.32, 1), box-shadow 0.75s ease-out"
                      : "none",
              }}
              className={`fixed left-1/2 top-1/2 -ml-[33px] -mt-[31px] flex h-[62px] w-[66px] flex-col items-center justify-center gap-1 rounded-[10px] border ${
                feelingMeta[selectedFeeling].badgeBg
              } ${
                popupPhase === "pulling"
                  ? "ring-2 ring-[#351080]/20 shadow-[0_6px_18px_rgba(42,17,99,0.12)]"
                  : "ring-2 ring-[#351080]/25 shadow-[0_16px_38px_rgba(42,17,99,0.22)]"
              }`}
            >
              <Image
                src={feelingMeta[selectedFeeling].image}
                alt={feelingMeta[selectedFeeling].label}
                width={34}
                height={30}
                className="h-auto w-[34px]"
              />
              <span
                style={{ fontSize: "8.5px", fontWeight: 700 }}
                className="!text-[8.5px] !font-bold text-[#2A1163]"
              >
                {feelingMeta[selectedFeeling].label}
              </span>
            </div>
          </div>
        )}

      {/* Keyframe Animations for Popup & EYVA Dance */}
      <style jsx global>{`
        @keyframes eyvaPopupIn {
          0% {
            opacity: 0;
            transform: scale(0.72) translateY(12px);
          }
          65% {
            opacity: 1;
            transform: scale(1.03) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Happy Dance (Good): Joyful bounce + side-to-side groove */
        @keyframes eyvaDanceHappy {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          20% {
            transform: translateY(-10px) rotate(-9deg) scale(1.06, 0.96);
          }
          40% {
            transform: translateY(0) rotate(0deg) scale(0.96, 1.05);
          }
          60% {
            transform: translateY(-10px) rotate(9deg) scale(1.06, 0.96);
          }
          80% {
            transform: translateY(-3px) rotate(-4deg) scale(1.02);
          }
        }

        /* Calm Groove (Okay): Gentle side-to-side sway & nod */
        @keyframes eyvaDanceOkay {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-5px) rotate(-5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg) scale(1.03);
          }
          75% {
            transform: translateY(-5px) rotate(5deg);
          }
        }

        /* Comforting Bob (Tough): Soft warm pulse & gentle tilt */
        @keyframes eyvaDanceTough {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          35% {
            transform: translateY(-4px) rotate(-4deg) scale(1.04);
          }
          70% {
            transform: translateY(-2px) rotate(4deg) scale(1.02);
          }
        }

        @keyframes eyvaSparkleFloat {
          0%,
          100% {
            transform: translateY(0) scale(0.9);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-6px) scale(1.2);
            opacity: 1;
          }
        }

        .eyva-popup-enter {
          animation: eyvaPopupIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .eyva-dance-happy {
          animation: eyvaDanceHappy 0.85s ease-in-out infinite;
        }
        .eyva-dance-okay {
          animation: eyvaDanceOkay 1.1s ease-in-out infinite;
        }
        .eyva-dance-tough {
          animation: eyvaDanceTough 1.3s ease-in-out infinite;
        }
        .eyva-sparkle-1 {
          animation: eyvaSparkleFloat 1s ease-in-out infinite;
        }
        .eyva-sparkle-2 {
          animation: eyvaSparkleFloat 1.2s ease-in-out 0.3s infinite;
        }
      `}</style>
    </div>
  );
}
