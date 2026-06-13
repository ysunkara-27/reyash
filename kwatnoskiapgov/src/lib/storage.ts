import type { SerializableGameState } from "../types";

const storageKey = "election-control-center-state";

export function saveGameState(state: SerializableGameState): void {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function loadGameState(): SerializableGameState | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SerializableGameState;
  } catch {
    return null;
  }
}

export function downloadTextFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
