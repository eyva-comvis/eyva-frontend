"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChooseAvatarPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Username");
  const [selectedAvatar, setSelectedAvatar] = useState<"female" | "male" | null>(
    null
  );

  useEffect(() => {
    const savedUsername = localStorage.getItem("eyva_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleGetIn = () => {
    if (!selectedAvatar) return;
    localStorage.setItem(
      "eyva_avatar",
      selectedAvatar === "female"
        ? "/images/FemaleAva.svg"
        : "/images/MaleAva.svg"
    );
    router.push("/dashboard/home");
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-4 py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="m-0 mb-2 text-[34px] font-bold tracking-tight text-[#2A1163]">
          Hello, {username}!
        </h1>
        <p className="m-0 text-[13.5px] text-[#7B728E]">
          Feel free to choose your avatar.
        </p>
      </div>

      {/* Avatar Options */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14 mb-12">
        {/* Female Avatar */}
        <button
          type="button"
          onClick={() => setSelectedAvatar("female")}
          aria-label="Choose Female Avatar"
          className={`group relative overflow-hidden p-0 border-0 bg-transparent transition-all duration-200 ${
            selectedAvatar === "female"
              ? "ring-4 ring-[#351080] scale-[1.02] shadow-[0_14px_34px_rgba(53,16,128,0.18)]"
              : "hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(53,16,128,0.1)]"
          }`}
        >
          <Image
            src="/images/FemaleAva.svg"
            alt="Female Avatar"
            width={285}
            height={285}
            priority
            className="block h-[250px] w-[250px] sm:h-[285px] sm:w-[285px] object-cover"
          />
        </button>

        {/* Male Avatar */}
        <button
          type="button"
          onClick={() => setSelectedAvatar("male")}
          aria-label="Choose Male Avatar"
          className={`group relative overflow-hidden p-0 border-0 bg-transparent transition-all duration-200 ${
            selectedAvatar === "male"
              ? "ring-4 ring-[#351080] scale-[1.02] shadow-[0_14px_34px_rgba(53,16,128,0.18)]"
              : "hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(53,16,128,0.1)]"
          }`}
        >
          <Image
            src="/images/MaleAva.svg"
            alt="Male Avatar"
            width={285}
            height={285}
            priority
            className="block h-[250px] w-[250px] sm:h-[285px] sm:w-[285px] object-cover"
          />
        </button>
      </div>

      {/* Get in Button */}
      <button
        type="button"
        onClick={handleGetIn}
        disabled={!selectedAvatar}
        style={{
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "13px",
          opacity: selectedAvatar ? 1 : 0.75,
        }}
        className={`flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-[13px] !font-bold !text-white transition-all ${
          selectedAvatar
            ? "bg-[#351080] shadow-[0_4px_0_#24085E] hover:bg-[#43189E] active:translate-y-[1px]"
            : "bg-[#6A519B] shadow-[0_4px_0_#351080] cursor-not-allowed"
        }`}
      >
        <span>Get in</span>
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}
