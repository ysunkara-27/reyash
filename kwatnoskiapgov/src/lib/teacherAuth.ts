const passwordKey = "election-control-center-teacher-password";
const unlockedKey = "election-control-center-teacher-unlocked";
const defaultPassword = "pine";

function safeLocalStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function safeSessionStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function getTeacherPassword(): string {
  const storage = safeLocalStorage();
  const saved = storage?.getItem(passwordKey);
  if (saved === "teacher123") {
    storage?.setItem(passwordKey, defaultPassword);
    return defaultPassword;
  }
  return saved ?? defaultPassword;
}

export function isDefaultTeacherPasswordActive(): boolean {
  return getTeacherPassword() === defaultPassword;
}

export function setTeacherPassword(newPassword: string): void {
  const trimmed = newPassword.trim();
  if (!trimmed) return;
  safeLocalStorage()?.setItem(passwordKey, trimmed);
}

export function isTeacherUnlocked(): boolean {
  return safeSessionStorage()?.getItem(unlockedKey) === "true";
}

export function unlockTeacher(password: string): boolean {
  const unlocked = password === getTeacherPassword();
  if (unlocked) safeSessionStorage()?.setItem(unlockedKey, "true");
  return unlocked;
}

export const unlockTeacword = unlockTeacher;

export function lockTeacher(): void {
  safeSessionStorage()?.removeItem(unlockedKey);
}
