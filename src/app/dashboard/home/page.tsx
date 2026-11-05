"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home as HomeIcon,
  History,
  BarChart2,
  Clock,
  Calendar,
  Eye,
  BookOpen,
  ChevronRight,
  Settings,
  X,
  Music,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("Username");
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");

  // Modal State: null | "focus-setup" | "camera-setup"
  const [modalStep, setModalStep] = useState<
    null | "focus-setup" | "camera-setup"
  >(null);

  // Focus Setup Form State
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionTitleError, setSessionTitleError] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [presetMinutes, setPresetMinutes] = useState("");
  const [focusTimeError, setFocusTimeError] = useState("");
  const [soundtrack, setSoundtrack] = useState("Soft Piano");
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem("eyva_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
    const savedAvatar = localStorage.getItem("eyva_avatar");
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }
  }, []);

  const handleContinueToCamera = () => {
    const cleanTitle = sessionTitle.trim();
    const duration = (customMinutes || presetMinutes).trim();
    const numericDuration = Number(duration);

    let hasError = false;

    if (!cleanTitle) {
      setSessionTitleError("Please enter what you are working on first.");
      hasError = true;
    } else {
      setSessionTitleError("");
    }

    if (!duration || Number.isNaN(numericDuration) || numericDuration <= 0) {
      setFocusTimeError(
        "Please type in minutes or choose a preset focus time first."
      );
      hasError = true;
    } else {
      setFocusTimeError("");
    }

    if (hasError) {
      return;
    }

    localStorage.removeItem("eyva_focus_remaining_seconds");
    localStorage.removeItem("eyva_focus_total_seconds");
    localStorage.setItem(
      "eyva_session_config",
      JSON.stringify({
        title: cleanTitle,
        durationMinutes: numericDuration,
        soundtrack,
        musicEnabled,
      })
    );
    setModalStep("camera-setup");
  };

  const handleAllowCameraAndStart = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      // Proceed to focus session even if permission is denied or no webcam found
    }
    setModalStep(null);
    router.push("/dashboard/focus-session");
  };

  return (
    <div className="relative flex min-h-screen w-full bg-white text-[#351080]">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-[198px] flex-col justify-between border-r border-[#EAE5F2] bg-white px-4 pt-6 pb-0 transition-all duration-200 ${
          modalStep ? "blur-[4px] pointer-events-none select-none" : ""
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="mb-8 px-2">
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
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/dashboard/home"
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full bg-[#351080] px-4 py-2.5 text-[12.5px] !font-bold !text-white transition"
            >
              <HomeIcon size={16} strokeWidth={2.2} />
              <span>Home</span>
            </Link>

            <Link
              href="/dashboard/history"
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FC]"
            >
              <History size={16} strokeWidth={2.2} />
              <span>History</span>
            </Link>

            <Link
              href="/dashboard/statistics"
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FC]"
            >
              <BarChart2 size={16} strokeWidth={2.2} />
              <span>Statistics</span>
            </Link>
          </nav>
        </div>

        {/* Leaf Decoration at Bottom Left */}
        <div className="mt-auto flex justify-center overflow-hidden pt-4">
          <Image
            src="/images/leaf_for_homepage.svg"
            alt="Decorative Leaf"
            width={118}
            height={208}
            className="h-auto w-[115px] select-none pointer-events-none translate-y-1"
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        className={`relative ml-[198px] flex-1 px-8 pt-6 pb-12 sm:px-12 transition-all duration-200 ${
          modalStep ? "blur-[4px] pointer-events-none select-none" : ""
        }`}
      >
        {/* Top Right Profile Avatar with Gear Icon */}
        <div className="flex justify-end">
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

        {/* Greeting Section */}
        <div className="mt-1 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[30px] font-bold tracking-tight text-[#2A1163]">
            Hello, {username}!
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            A little progress is still progress. Let&apos;s make this session
            count!
          </p>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-[960px]">
          {/* Yellow Hero Banner */}
          <section className="mx-auto flex max-w-[800px] items-center justify-between rounded-[22px] bg-[#FFF238] px-9 py-6 sm:px-11 sm:py-7">
            <div className="flex flex-col items-start">
              <h2 className="m-0 text-[26px] font-bold tracking-tight text-[#351080]">
                Time to focus
              </h2>
              <p className="m-0 mt-0.5 text-[13px] font-semibold text-[#4B2A88]">
                Study at your own rhytm
              </p>

              <button
                type="button"
                onClick={() => setModalStep("focus-setup")}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "12.5px",
                }}
                className="mt-7 inline-flex items-center gap-2.5 rounded-full border-0 bg-[#351080] px-7 py-3 text-[12.5px] !font-bold !text-white shadow-[0_4px_10px_rgba(53,16,128,0.3)] transition hover:bg-[#43189E] active:scale-[0.99]"
              >
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 12 14"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
                </svg>
                <span>Start session</span>
              </button>
            </div>

            <div className="mr-2 sm:mr-6 shrink-0">
              <Image
                src="/images/eyva_start.svg"
                alt="EYVA Mascot"
                width={175}
                height={145}
                priority
                className="h-auto w-[150px] sm:w-[175px]"
              />
            </div>
          </section>

          {/* Two Purple Stat Cards */}
          <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Total Focus Time */}
            <div className="relative flex min-h-[146px] items-start gap-4 rounded-[18px] bg-[#2D0A73] p-6 text-white">
              <div className="mt-0.5 text-white">
                <Clock size={30} strokeWidth={2} />
              </div>

              <div className="flex flex-col">
                <span className="text-[12.5px] font-normal text-white/90">
                  Total focus time
                </span>
                <strong className="my-1.5 text-[25px] font-bold tracking-tight text-white">
                  2h 30m
                </strong>
                <span className="text-[12px] text-white/85">This week</span>
              </div>

              <span className="absolute right-5 bottom-5 inline-flex items-center gap-0.5 rounded-full bg-[#FFF238] px-2.5 py-1 text-[9.5px] font-extrabold text-[#351080]">
                ↑ 12%
              </span>
            </div>

            {/* Study Sessions */}
            <div className="relative flex min-h-[146px] items-start gap-4 rounded-[18px] bg-[#2D0A73] p-6 text-white">
              <div className="mt-0.5 text-white">
                <Calendar size={30} strokeWidth={2} />
              </div>

              <div className="flex flex-col">
                <span className="text-[12.5px] font-normal text-white/90">
                  Study sessions
                </span>
                <strong className="my-1.5 text-[25px] font-bold tracking-tight text-white">
                  8
                </strong>
                <span className="text-[12px] text-white/85">This week</span>
              </div>

              <span className="absolute right-5 bottom-5 inline-flex items-center gap-0.5 rounded-full bg-[#FFF238] px-2.5 py-1 text-[9.5px] font-extrabold text-[#351080]">
                ↑ 23%
              </span>
            </div>
          </section>

          {/* Your Study Rhythm Card */}
          <section className="mt-4">
            <Link
              href="/dashboard/statistics"
              className="flex w-full items-center gap-3.5 rounded-[14px] bg-[#EFE9FF] px-5 py-3 transition hover:bg-[#E6DCFC]"
            >
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#2D0A73] text-white">
                <Eye size={17} strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="m-0 text-[12px] font-bold leading-snug text-[#2D0A73]">
                  Your study rhytm
                </div>
                <p className="m-0 mt-0.5 text-[10.5px] leading-[1.35] text-[#7B728E]">
                  You&apos;re doing great!
                  <br />
                  Keep taking breaks and listening to your body&apos;s signals.
                </p>
              </div>

              <ChevronRight
                size={16}
                strokeWidth={2.3}
                className="shrink-0 text-[#2D0A73]"
              />
            </Link>
          </section>

          {/* Recent Sessions */}
          <section className="mt-4">
            <div className="mb-2 flex items-center justify-between px-0.5">
              <div className="m-0 text-[11.5px] font-bold text-[#2D0A73]">
                Recent Sessions
              </div>
              <Link
                href="/dashboard/history"
                style={{ color: "#2D0A73" }}
                className="text-[10.5px] font-bold !text-[#2D0A73] hover:underline"
              >
                View all
              </Link>
            </div>

            <Link
              href="/dashboard/history"
              className="flex w-full items-center gap-3.5 rounded-[14px] border border-[#EAE4F3] bg-white px-5 py-3 shadow-[0_3px_10px_rgba(45,10,115,0.06)] transition hover:border-[#D5C8EB]"
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#2D0A73] text-white">
                <BookOpen size={15} strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="m-0 text-[11.5px] font-bold leading-snug text-[#2D0A73]">
                  Study Session
                </div>
                <p className="m-0 mt-0.5 text-[10.5px] text-[#7B728E]">
                  Yesterday · 45 minutes
                </p>
              </div>

              <ChevronRight
                size={16}
                strokeWidth={2.3}
                className="shrink-0 text-[#2D0A73]"
              />
            </Link>
          </section>
        </div>
      </main>

      {/* =========================================================
          MODAL OVERLAY (STEP 1: FOCUS SETUP | STEP 2: CAMERA SETUP)
      ========================================================= */}
      {modalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/18 px-4 py-6">
          {/* STEP 1: LET'S SET YOUR FOCUS */}
          {modalStep === "focus-setup" && (
            <div className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalStep(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-[#E5DFEE] bg-white text-[#6C5B8D] transition hover:bg-[#F5F1FC] hover:text-[#351080]"
              >
                <X size={14} strokeWidth={2.2} />
              </button>

              {/* Yellow Play Icon Box */}
              <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
                <svg
                  width="18"
                  height="20"
                  viewBox="0 0 12 14"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
                </svg>
              </div>

              {/* Eyebrow & Heading */}
              <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
                YOUR NEXT SESSION
              </div>
              <h2 className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]">
                Let&apos;s set your focus
              </h2>
              <p className="m-0 mt-1 text-[10.5px] text-[#7B728E]">
                Choose what you&apos;re working on and make this session yours
              </p>

              {/* What are we working on? */}
              <div className="mt-5">
                <label
                  htmlFor="session-title"
                  className="mb-1.5 block text-[11px] font-bold text-[#2A1163]"
                >
                  What are we working on?
                </label>
                <input
                  id="session-title"
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => {
                    setSessionTitle(e.target.value);
                    if (e.target.value.trim()) {
                      setSessionTitleError("");
                    }
                  }}
                  placeholder="ex: Study Session"
                  style={{ fontSize: "11px" }}
                  className={`w-full rounded-[9px] border bg-white px-3.5 py-2.5 !text-[11px] text-[#2A1163] placeholder:text-[#9A90AD] outline-none transition focus:border-[#351080] ${
                    sessionTitleError
                      ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                      : "border-[#DFD9EC]"
                  }`}
                />
                {sessionTitleError && (
                  <p className="mt-1.5 mb-0 text-[10px] font-semibold text-[#9F3D69]">
                    {sessionTitleError}
                  </p>
                )}
              </div>

              {/* Choose your focus time */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-bold text-[#2A1163]">
                  Choose your focus time
                </label>
                <div className="flex items-center gap-2.5">
                  {/* Type in Minute box */}
                  <div
                    className={`relative flex h-[40px] w-[92px] flex-col items-center justify-center rounded-[9px] border bg-white px-2.5 transition ${
                      focusTimeError
                        ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                        : "border-[#DFD9EC]"
                    }`}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customMinutes}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setCustomMinutes(val);
                        if (val) {
                          setPresetMinutes("");
                          setFocusTimeError("");
                        }
                      }}
                      placeholder="Type in Minute"
                      style={{ fontSize: "9.5px" }}
                      className="w-full border-0 border-b border-[#D6CEE8] bg-transparent pb-0.5 text-center !text-[9.5px] text-[#2A1163] placeholder:!text-[9.5px] placeholder:text-[#9A90AD] outline-none"
                    />
                  </div>

                  {/* Choose dropdown box */}
                  <div
                    className={`relative flex h-[40px] w-[86px] items-center rounded-[9px] border bg-white transition ${
                      focusTimeError
                        ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                        : "border-[#DFD9EC]"
                    }`}
                  >
                    <select
                      value={presetMinutes}
                      onChange={(e) => {
                        setPresetMinutes(e.target.value);
                        if (e.target.value) {
                          setCustomMinutes("");
                          setFocusTimeError("");
                        }
                      }}
                      aria-label="Choose preset focus time"
                      style={{ fontSize: "10.5px" }}
                      className="h-full w-full appearance-none bg-transparent pl-3 pr-6 !text-[10.5px] font-medium text-[#7B728E] outline-none cursor-pointer"
                    >
                      <option value="">Choose</option>
                      <option value="15">15 min</option>
                      <option value="25">25 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="pointer-events-none absolute right-2.5 text-[#7B728E]"
                    />
                  </div>
                </div>
                {focusTimeError && (
                  <p className="mt-1.5 mb-0 text-[10px] font-semibold text-[#9F3D69]">
                    {focusTimeError}
                  </p>
                )}
              </div>

              {/* Focus soundtrack */}
              <div className="mt-4">
                <label
                  htmlFor="focus-soundtrack"
                  className="mb-1.5 block text-[11px] font-bold text-[#2A1163]"
                >
                  Focus soundtrack
                </label>
                <div className="relative flex items-center">
                  <select
                    id="focus-soundtrack"
                    value={soundtrack}
                    onChange={(e) => setSoundtrack(e.target.value)}
                    style={{ fontSize: "11px" }}
                    className="w-full appearance-none rounded-[9px] border border-[#DFD9EC] bg-white px-3.5 py-2.5 pr-9 !text-[11px] text-[#2A1163] outline-none transition focus:border-[#351080] cursor-pointer"
                  >
                    <option value="Soft Piano">Soft Piano</option>
                    <option value="Ambient Rain">Ambient Rain</option>
                    <option value="Lo-Fi Study Beats">Lo-Fi Study Beats</option>
                    <option value="White Noise">White Noise</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 text-[#2A1163]"
                  />
                </div>
              </div>

              {/* Music during focus toggle */}
              <div className="mt-5 flex items-center justify-between border-t border-[#EFEBF7] pt-3.5">
                <div
                  style={{ color: "#6E7F6A" }}
                  className="flex items-center gap-2 text-[10.5px] font-medium !text-[#6E7F6A]"
                >
                  <Music size={13} style={{ color: "#6E7F6A" }} />
                  <span>Music during focus</span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={musicEnabled}
                  onClick={() => setMusicEnabled(!musicEnabled)}
                  style={{
                    backgroundColor: musicEnabled ? "#6E7F6A" : "#D5CEE4",
                  }}
                  className="relative inline-flex h-[18px] w-[34px] shrink-0 items-center rounded-full border-0 transition-colors"
                >
                  <span
                    className={`inline-block h-[13px] w-[13px] transform rounded-full bg-white transition-transform ${
                      musicEnabled ? "translate-x-[17px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>

              {/* Continue to camera setup button */}
              <button
                type="button"
                onClick={handleContinueToCamera}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "11.5px",
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border-0 bg-[#624794] py-3 px-4 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition hover:bg-[#553B87] active:translate-y-[1px]"
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
                <span>Continue to camera setup</span>
              </button>
            </div>
          )}

          {/* STEP 2: CAN WE USE YOUR CAMERA? */}
          {modalStep === "camera-setup" && (
            <div className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalStep(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-[#E5DFEE] bg-white text-[#6C5B8D] transition hover:bg-[#F5F1FC] hover:text-[#351080]"
              >
                <X size={14} strokeWidth={2.2} />
              </button>

              {/* Yellow Shield Check Icon Box */}
              <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
                <svg
                  width="22"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M12 2L4 5.4V11.4C4 16.65 7.41 21.56 12 22.8C16.59 21.56 20 16.65 20 11.4V5.4L12 2ZM10.4 15.6L7.2 12.4L8.61 10.99L10.4 12.77L15.39 7.78L16.8 9.2L10.4 15.6Z" />
                </svg>
              </div>

              {/* Eyebrow & Heading */}
              <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
                BEFORE WE BEGIN
              </div>
              <h2 className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]">
                Can we use your camera?
              </h2>
              <p className="m-0 mt-2 text-[10.5px] leading-[1.6] text-[#7B728E]">
                Loopa needs camera accessfor the focus-check feature.
                <br />
                The camera will be active during this session. The drowsiness
                detection will analyze visual cues to identify possible signs
                of sleepiness and provide timely break reminders.
              </p>

              {/* Lavender Info Box */}
              <div className="mt-4 rounded-[10px] bg-[#F2ECFF] px-3.5 py-3 text-center text-[9.5px] leading-[1.55] text-[#6B5794]">
                Your browser may show its own permission popup after you choose
                &ldquo;Allow camera &amp; start&rdquo;. You can choose not to
                continue if you prefer
              </div>

              {/* Allow camera & start button */}
              <button
                type="button"
                onClick={handleAllowCameraAndStart}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "11.5px",
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border-0 bg-[#624794] py-3 px-4 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition hover:bg-[#553B87] active:translate-y-[1px]"
              >
                <svg
                  width="14"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="#FFF238"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M12 2L4 5.4V11.4C4 16.65 7.41 21.56 12 22.8C16.59 21.56 20 16.65 20 11.4V5.4L12 2ZM10.4 15.6L7.2 12.4L8.61 10.99L10.4 12.77L15.39 7.78L16.8 9.2L10.4 15.6Z" />
                </svg>
                <span>Allow camera &amp; start</span>
              </button>

              {/* Not now button */}
              <button
                type="button"
                onClick={() => setModalStep(null)}
                style={{
                  color: "#624794",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
                className="mt-3 block w-full border-0 bg-transparent py-1 text-center text-[11px] !font-bold !text-[#624794] transition hover:text-[#351080]"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
