export type AvatarPath = "/images/FemaleAva.svg" | "/images/MaleAva.svg";

export interface AvatarOption {
  id: "female" | "male";
  label: string;
  tagline: string;
  src: AvatarPath;
}

export interface UserProfile {
  username: string;
  email: string;
  avatarSrc: AvatarPath;
}
