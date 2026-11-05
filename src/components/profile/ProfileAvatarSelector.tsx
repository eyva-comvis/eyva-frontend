"use client";

import Image from "next/image";
import { Check, Sparkles } from "lucide-react";
import type { AvatarOption, AvatarPath } from "@/types/profile";

interface ProfileAvatarSelectorProps {
  currentUsername: string;
  selectedAvatar: AvatarPath;
  options: AvatarOption[];
  onSelectAvatar: (src: AvatarPath) => void;
}

export default function ProfileAvatarSelector({
  currentUsername,
  selectedAvatar,
  options,
  onSelectAvatar,
}: ProfileAvatarSelectorProps) {
  return (
    <section
      aria-label="Profile Avatar"
      className="rounded-[20px] border border-[#EAE4F3] bg-white p-6 sm:p-7 shadow-[0_6px_24px_rgba(45,10,115,0.05)]"
    >
      {/* Top Showcase: Current Large Avatar + Personal Greeting */}
      <div className="flex flex-col items-center gap-4 border-b border-[#F1ECF9] pb-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative">
          <div className="h-[104px] w-[104px] overflow-hidden rounded-full border-[3px] border-[#351080] bg-[#F9E8FF] shadow-[0_10px_26px_rgba(53,16,128,0.16)]">
            <Image
              src={selectedAvatar}
              alt={`${currentUsername} Avatar`}
              width={104}
              height={104}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <span
            title="Your Study Companion Avatar"
            className="absolute -right-1 bottom-0.5 flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-white bg-[#FFF238] text-[#351080] shadow-xs"
          >
            <Sparkles size={14} strokeWidth={2.3} />
          </span>
        </div>

        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EFE9FF] px-3 py-0.5 text-[9.5px] font-bold tracking-[0.06em] text-[#351080] uppercase">
            Study Companion Profile
          </span>
          <h2 className="m-0 mt-1.5 text-[22px] font-extrabold tracking-tight text-[#2A1163]">
            {currentUsername}
          </h2>
          <p className="m-0 mt-0.5 text-[11px] text-[#7B728E]">
            Pick the avatar that feels most like you during your focus sessions.
          </p>
        </div>
      </div>

      {/* Avatar Picker Grid */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[12.5px] font-bold text-[#2A1163]">
              Choose Your Avatar
            </div>
            <div className="text-[10.5px] text-[#7B728E]">
              Click an avatar below, then save your changes
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selectedAvatar === option.src;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectAvatar(option.src)}
                aria-pressed={isSelected}
                className={`group relative flex items-center gap-4 rounded-[16px] border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#351080] bg-[#F5F1FF] ring-2 ring-[#351080]/20 shadow-[0_6px_18px_rgba(53,16,128,0.08)]"
                    : "border-[#EAE4F3] bg-[#FDFCFF] hover:border-[#351080]/45 hover:bg-[#FAF7FF]"
                }`}
              >
                {/* Avatar Thumbnail */}
                <div
                  className={`h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[14px] border-2 transition-transform group-hover:scale-[1.03] ${
                    isSelected ? "border-[#351080]" : "border-[#E3DBF2]"
                  }`}
                >
                  <Image
                    src={option.src}
                    alt={option.label}
                    width={68}
                    height={68}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Label & Tagline */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ fontSize: "13px", fontWeight: 700 }}
                      className="!text-[13px] !font-bold text-[#2A1163]"
                    >
                      {option.label}
                    </span>
                  </div>
                  <p className="m-0 mt-0.5 text-[10.5px] leading-snug text-[#6E6285]">
                    {option.tagline}
                  </p>

                  {/* Selected / Click to select status pill */}
                  <div className="mt-2">
                    {isSelected ? (
                      <span
                        style={{ fontSize: "9.5px", fontWeight: 700 }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#FFF238] px-2.5 py-0.5 !text-[9.5px] !font-bold text-[#2A1163]"
                      >
                        <Check size={11} strokeWidth={2.6} />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <span
                        style={{ fontSize: "9.5px", fontWeight: 600 }}
                        className="inline-flex items-center rounded-full bg-[#EFEAF7] px-2.5 py-0.5 !text-[9.5px] !font-semibold text-[#6E6285] group-hover:bg-[#E4DCF5] group-hover:text-[#351080]"
                      >
                        Click to choose
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
