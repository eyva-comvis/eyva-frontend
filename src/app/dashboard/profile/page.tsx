"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import {
  AVATAR_OPTIONS,
  DEFAULT_USER_PROFILE,
  getUserProfile,
  updateUserProfile,
  logoutUser,
} from "@/services/api/profile";
import type { AvatarPath, UserProfile } from "@/types/profile";
import ProfileAvatarSelector from "@/components/profile/ProfileAvatarSelector";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";
import LogoutConfirmModal from "@/components/profile/LogoutConfirmModal";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPath>(
    DEFAULT_USER_PROFILE.avatarSrc
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getUserProfile().then((loadedProfile) => {
      if (!isMounted) return;
      setProfile(loadedProfile);
      setSelectedAvatar(loadedProfile.avatarSrc);
      setIsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectAvatar = (src: AvatarPath) => {
    setSelectedAvatar(src);
    if (typeof window !== "undefined") {
      localStorage.setItem("eyva_avatar", src);
    }
  };

  const handleSaveProfile = async (newUsername: string) => {
    const updated = await updateUserProfile({
      username: newUsername,
      avatarSrc: selectedAvatar,
    });
    setProfile(updated);
  };

  const handleConfirmLogout = async () => {
    await logoutUser();
    setIsLogoutModalOpen(false);
    router.push("/login");
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFEF9 50%, #FFFCE8 100%)",
      }}
      className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] text-[#2A1163]"
    >
      {/* Central Profile Content Container */}
      <main className="mx-auto flex w-full max-w-[760px] flex-col px-6 py-8 sm:px-10 sm:py-10">
        {/* Page Header + Back to Home Button */}
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="m-0 text-[24px] font-extrabold tracking-tight text-[#2A1163]">
              Your Profile
            </h1>
            <p className="m-0 mt-0.5 text-[11.5px] text-[#7B728E]">
              Customize your companion avatar and personal study identity
            </p>
          </div>

          <Link
            href="/dashboard/home"
            style={{
              color: "#351080",
              fontWeight: 700,
              fontSize: "11px",
            }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E3DCF2] bg-white px-3.5 py-1.5 !text-[11px] !font-bold !text-[#351080] shadow-2xs transition hover:bg-[#FAF8FF]"
          >
            <ArrowLeft size={12.5} strokeWidth={2.3} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* 1. Profile Avatar Card */}
        <ProfileAvatarSelector
          currentUsername={profile.username}
          selectedAvatar={selectedAvatar}
          options={AVATAR_OPTIONS}
          onSelectAvatar={handleSelectAvatar}
        />

        {/* 2 & 3. Username + Email Address Card */}
        {isLoaded && (
          <ProfileInfoForm
            key={profile.username}
            currentUsername={profile.username}
            email={profile.email}
            hasAvatarChanged={selectedAvatar !== profile.avatarSrc}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {/* 4. Logout Section Card */}
        <section
          aria-label="Session & Account Logout"
          className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[20px] border border-[#F2DCE6] bg-[#FFFBFD] p-5 sm:flex-row sm:items-center sm:px-7 sm:py-5 shadow-[0_6px_24px_rgba(45,10,115,0.03)]"
        >
          <div>
            <h2 className="m-0 text-[14.5px] font-extrabold text-[#2A1163]">
              Done studying for today?
            </h2>
            <p className="m-0 mt-0.5 text-[11px] text-[#7B728E]">
              You can safely log out of your Eyva account anytime and pick up
              right where you left off.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            style={{
              color: "#9F3D69",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="inline-flex h-[38px] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#E8BBD0] bg-[#FDF2F6] px-5 !text-[11.5px] !font-bold !text-[#9F3D69] transition hover:border-[#D99BB8] hover:bg-[#FAE5EE] active:scale-[0.99]"
          >
            <LogOut size={13.5} strokeWidth={2.3} />
            <span>Logout</span>
          </button>
        </section>
      </main>

      {/* Confirmation Dialog before Logout */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
