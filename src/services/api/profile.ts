import type { AvatarOption, AvatarPath, UserProfile } from "@/types/profile";

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "female",
    label: "Sunny Sprout",
    tagline: "Bright, cheerful & ready to learn",
    src: "/images/FemaleAva.svg",
  },
  {
    id: "male",
    label: "Calm Scholar",
    tagline: "Steady, focused & in the flow",
    src: "/images/MaleAva.svg",
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: "Username",
  email: "username@gmail.com",
  avatarSrc: "/images/MaleAva.svg",
};

/**
 * Loads the current user profile from localStorage (fallback to dummy data).
 * Ready to be swapped with `apiRequest<UserProfile>('/users/me')` when backend is connected.
 */
export async function getUserProfile(): Promise<UserProfile> {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PROFILE;
  }

  const savedUsername =
    localStorage.getItem("eyva_username")?.trim() ||
    DEFAULT_USER_PROFILE.username;
  const rawAvatar = localStorage.getItem("eyva_avatar");
  const avatarSrc: AvatarPath =
    rawAvatar === "/images/FemaleAva.svg" || rawAvatar === "/images/MaleAva.svg"
      ? rawAvatar
      : DEFAULT_USER_PROFILE.avatarSrc;

  const savedEmail = localStorage.getItem("eyva_email")?.trim();
  const derivedEmail =
    savedEmail ||
    `${savedUsername.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}@gmail.com`;

  return {
    username: savedUsername,
    email: derivedEmail,
    avatarSrc,
  };
}

/**
 * Persists updated username and avatar selection so Home ("Hello, Username!")
 * and all dashboard headers reflect the changes immediately.
 */
export async function updateUserProfile(
  updates: Pick<UserProfile, "username" | "avatarSrc">
): Promise<UserProfile> {
  const cleanUsername = updates.username.trim();
  if (typeof window !== "undefined") {
    localStorage.setItem("eyva_username", cleanUsername);
    localStorage.setItem("eyva_avatar", updates.avatarSrc);
  }

  const current = await getUserProfile();
  return {
    ...current,
    username: cleanUsername,
    avatarSrc: updates.avatarSrc,
  };
}

/**
 * Clears active session state on logout while keeping structure ready for backend token revocation.
 */
export async function logoutUser(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("eyva_focus_remaining_seconds");
    localStorage.removeItem("eyva_focus_total_seconds");
  }
}
