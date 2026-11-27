"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import {
  EYVA_EASE,
  EYVA_SPRING,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  TactileButton,
} from "@/components/motion/MotionPrimitives";
import { errorMessage } from "@/services/api/client";
import { getUserProfile, updateUserProfile } from "@/services/api/profile";

function ChooseAvatarPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<"female" | "male" | null>(
    null
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((p) => setUsername(p.username))
      .catch(() => setUsername(localStorage.getItem("eyva_username") || "there"));
  }, []);

  const handleGetIn = async () => {
    if (!selectedAvatar || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      await updateUserProfile({
        avatarSrc: selectedAvatar === "female" ? "/images/FemaleAva.svg" : "/images/MaleAva.svg",
      });
      router.replace("/dashboard/home");
    } catch (err) {
      setError(errorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-10">
      <PageTransition className="flex w-full flex-col items-center">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="m-0 mb-2 text-[34px] font-bold tracking-tight text-[#2A1163]">
            Hello{username ? `, ${username}` : ""}!
          </h1>
          <p className="m-0 text-[13.5px] text-[#7B728E]">
            Feel free to choose your avatar.
          </p>
        </div>

        {/* Avatar Options */}
        <StaggerContainer
          className="mb-12 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14"
          stagger={0.09}
        >
          {(
            [
              {
                key: "female",
                label: "Choose Female Avatar",
                alt: "Female Avatar",
                src: "/images/FemaleAva.svg",
              },
              {
                key: "male",
                label: "Choose Male Avatar",
                alt: "Male Avatar",
                src: "/images/MaleAva.svg",
              },
            ] as const
          ).map((option) => {
            const isSelected = selectedAvatar === option.key;
            return (
              <StaggerItem key={option.key}>
                <motion.button
                  type="button"
                  onClick={() => setSelectedAvatar(option.key)}
                  aria-label={option.label}
                  aria-pressed={isSelected}
                  whileHover={
                    prefersReduced ? undefined : { y: -5, scale: 1.02 }
                  }
                  whileTap={prefersReduced ? undefined : { scale: 0.96 }}
                  transition={EYVA_SPRING}
                  className={`group relative overflow-hidden rounded-[22px] border-0 bg-transparent p-0 transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#351080] ${
                    isSelected
                      ? "ring-4 ring-[#351080] shadow-[0_16px_36px_rgba(53,16,128,0.2)]"
                      : "hover:shadow-[0_12px_28px_rgba(53,16,128,0.12)]"
                  }`}
                >
                  <Image
                    src={option.src}
                    alt={option.alt}
                    width={285}
                    height={285}
                    priority
                    className="block h-[250px] w-[250px] object-cover sm:h-[285px] sm:w-[285px]"
                  />

                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.75, y: 4 }}
                        transition={EYVA_SPRING}
                        className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full border border-[#351080]/15 bg-[#FFF238] px-3 py-1 text-[11px] font-extrabold text-[#351080] shadow-[0_4px_12px_rgba(42,17,99,0.2)]"
                      >
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                        <span>Selected</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Get in Button */}
        <TactileButton
          type="button"
          onClick={handleGetIn}
          disabled={!selectedAvatar}
          style={{
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "13px",
            opacity: selectedAvatar ? 1 : 0.75,
          }}
          className={`group flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-[13px] !font-bold !text-white transition-[background-color,box-shadow,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
            selectedAvatar
              ? "bg-[#351080] shadow-[0_4px_0_#24085E] hover:bg-[#43189E]"
              : "cursor-not-allowed bg-[#6A519B] shadow-[0_4px_0_#351080]"
          }`}
        >
          <span>{isSaving ? "Saving…" : "Get in"}</span>
          <span
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          >
            →
          </span>
        </TactileButton>

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: EYVA_EASE }}
              className="m-0 mt-4 rounded-[9px] border border-[#F5DCE6] bg-[#FDF2F6] px-3.5 py-2 text-[11.5px] font-medium text-[#9F3D69]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </PageTransition>
    </main>
  );
}

export default function ChooseAvatarRoute() {
  return (
    <AuthGate require="user">
      <ChooseAvatarPage />
    </AuthGate>
  );
}
