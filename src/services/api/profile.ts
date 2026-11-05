import type { AvatarOption, AvatarPath, UserProfile } from "@/types/profile";
import { apiRequest } from "./client";
import { logout } from "./auth";

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
  email: "",
  avatarSrc: "/images/MaleAva.svg",
};

interface ProfileResponse {
  user_id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_selected: boolean;
}

export interface LoadedProfile extends UserProfile {
  /** false = pengguna belum memilih avatar Eyva (mis. baru daftar lewat Google) */
  avatarSelected: boolean;
}

function toProfile(r: ProfileResponse): LoadedProfile {
  const profile: LoadedProfile = {
    username: r.username || r.email?.split("@")[0] || "Friend",
    email: r.email ?? "",
    avatarSrc: r.avatar_selected ? (r.avatar_url as AvatarPath) : DEFAULT_USER_PROFILE.avatarSrc,
    avatarSelected: r.avatar_selected,
  };
  // Cache untuk tampilan cepat saat halaman pertama kali dirender
  try {
    localStorage.setItem("eyva_username", profile.username);
    localStorage.setItem("eyva_avatar", profile.avatarSrc);
    localStorage.setItem("eyva_email", profile.email);
  } catch {
    // abaikan
  }
  return profile;
}

/** Profil tersimpan di cache lokal (tanpa jaringan), untuk render awal. */
export function getCachedProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    return {
      username: localStorage.getItem("eyva_username") || DEFAULT_USER_PROFILE.username,
      email: localStorage.getItem("eyva_email") || "",
      avatarSrc:
        (localStorage.getItem("eyva_avatar") as AvatarPath | null) || DEFAULT_USER_PROFILE.avatarSrc,
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export async function getUserProfile(): Promise<LoadedProfile> {
  return toProfile(await apiRequest<ProfileResponse>("/profile"));
}

export async function updateUserProfile(updates: {
  username?: string;
  avatarSrc?: AvatarPath;
}): Promise<LoadedProfile> {
  const body: Record<string, string> = {};
  if (updates.username !== undefined) body.username = updates.username.trim();
  if (updates.avatarSrc !== undefined) body.avatar_url = updates.avatarSrc;
  return toProfile(
    await apiRequest<ProfileResponse>("/profile", { method: "PATCH", body: JSON.stringify(body) })
  );
}

export async function logoutUser(): Promise<void> {
  await logout();
}

/** Setelah login: ke pemilihan avatar bila belum pernah memilih, selain itu ke Home. */
export async function landingPathAfterLogin(): Promise<string> {
  try {
    const p = await getUserProfile();
    return p.avatarSelected ? "/dashboard/home" : "/choose-avatar";
  } catch {
    return "/dashboard/home";
  }
}
