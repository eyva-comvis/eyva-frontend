/** Sama dengan aturan backend dan database (profiles.username). */
export const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,24}$/;
export const USERNAME_HINT =
  "Username must be 3–24 characters: letters, numbers, underscores, or dots (no spaces).";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
