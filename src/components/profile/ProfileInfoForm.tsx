"use client";

import { useState } from "react";
import { User, Mail, Lock, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { ApiError, errorMessage } from "@/services/api/client";
import { USERNAME_HINT, USERNAME_PATTERN } from "@/lib/validation";

interface ProfileInfoFormProps {
  currentUsername: string;
  email: string;
  hasAvatarChanged: boolean;
  onSaveProfile: (newUsername: string) => Promise<void>;
}

export default function ProfileInfoForm({
  currentUsername,
  email,
  hasAvatarChanged,
  onSaveProfile,
}: ProfileInfoFormProps) {
  const [usernameInput, setUsernameInput] = useState(currentUsername);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();

    if (!trimmed) {
      setValidationError("Username cannot be empty. Please enter a name.");
      setSaveSuccess(false);
      return;
    }

    if (!USERNAME_PATTERN.test(trimmed)) {
      setValidationError(USERNAME_HINT);
      setSaveSuccess(false);
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      await onSaveProfile(trimmed);
      setUsernameInput(trimmed);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3500);
    } catch (err) {
      setValidationError(
        err instanceof ApiError && err.status === 409
          ? "That username is already taken. Please try another one."
          : errorMessage(err)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty =
    usernameInput.trim() !== currentUsername || hasAvatarChanged;

  return (
    <section
      aria-label="Account Details"
      className="mt-5 rounded-[20px] border border-[#EAE4F3] bg-white p-6 sm:p-7 shadow-[0_6px_24px_rgba(45,10,115,0.05)]"
    >
      <div className="mb-5">
        <h2 className="m-0 text-[17px] font-extrabold tracking-tight text-[#2A1163]">
          Personal Information
        </h2>
        <p className="m-0 mt-0.5 text-[11px] text-[#7B728E]">
          Update how Eyva greets you on your dashboard home page
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* 1. Username Field (Editable) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="profile-username"
              className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#2A1163]"
            >
              <User size={13.5} strokeWidth={2.2} className="text-[#351080]" />
              <span>Username</span>
            </label>
            <span className="text-[10px] font-medium text-[#7B728E]">
              Current:{" "}
              <strong className="font-bold text-[#351080]">
                {currentUsername}
              </strong>
            </span>
          </div>

          <input
            id="profile-username"
            type="text"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              if (validationError) setValidationError(null);
              if (saveSuccess) setSaveSuccess(false);
            }}
            placeholder="Enter your username"
            style={{ fontSize: "12px" }}
            className={`w-full rounded-[11px] border bg-white px-4 py-2.5 !text-[12px] font-medium text-[#2A1163] outline-none transition ${
              validationError
                ? "border-[#D9385A] focus:border-[#D9385A] ring-2 ring-[#D9385A]/10"
                : "border-[#DFD8EE] focus:border-[#351080] focus:ring-2 focus:ring-[#351080]/10"
            }`}
          />

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7B728E]">
            <span>
              Displayed in{" "}
              <strong className="font-semibold text-[#4A367A]">
                &ldquo;Hello, {usernameInput.trim() || "Username"}!&rdquo;
              </strong>{" "}
              on your Home dashboard.
            </span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div
              role="alert"
              className="mt-2 flex items-center gap-1.5 rounded-[9px] border border-[#F5D0DC] bg-[#FDF2F6] px-3 py-2 text-[10.5px] font-semibold text-[#A3365C]"
            >
              <AlertCircle size={13} strokeWidth={2.2} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* 2. Email Address Field (Read-Only) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="profile-email"
              className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#2A1163]"
            >
              <Mail size={13.5} strokeWidth={2.2} className="text-[#351080]" />
              <span>Email Address</span>
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EFFA] px-2.5 py-0.5 text-[9.5px] font-semibold text-[#6E6285]">
              <Lock size={10} strokeWidth={2.2} />
              <span>Read-only</span>
            </span>
          </div>

          <input
            id="profile-email"
            type="email"
            value={email}
            readOnly
            disabled
            style={{ fontSize: "12px" }}
            className="w-full cursor-not-allowed rounded-[11px] border border-[#EAE4F3] bg-[#F7F5FB] px-4 py-2.5 !text-[12px] font-medium text-[#6E6285] outline-none"
          />

          <p className="m-0 mt-1.5 text-[10px] text-[#7B728E]">
            Your email address is used as your primary account identity and
            cannot be edited.
          </p>
        </div>

        {/* Save Feedback + Save Changes Button */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[#F1ECF9] pt-4 sm:flex-row sm:items-center">
          <div className="min-h-[20px]">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE9FF] px-3 py-1 text-[10.5px] font-bold text-[#351080]">
                <CheckCircle2 size={13} strokeWidth={2.3} />
                <span>Changes saved! Your greeting & avatar are updated.</span>
              </span>
            ) : (
              <span className="text-[10.5px] text-[#7B728E]">
                {isDirty
                  ? "You have unsaved profile changes."
                  : "Your profile is up to date."}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "11.5px",
            }}
            className="inline-flex h-[40px] items-center justify-center gap-2 rounded-[10px] border-0 bg-[#351080] px-6 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#220856] transition hover:bg-[#43189E] active:translate-y-[1px] disabled:opacity-60"
          >
            <Save size={14} strokeWidth={2.2} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
