import type { SavedKit } from "./types";

const KEY = "cartcue_kits";

export function loadKits(): SavedKit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedKit[]) : [];
  } catch {
    return [];
  }
}

export function saveKit(kit: SavedKit) {
  try {
    if (typeof window === "undefined") return;
    const kits = loadKits();
    kits.unshift(kit);
    window.localStorage.setItem(KEY, JSON.stringify(kits.slice(0, 100)));
  } catch {}
}

export function deleteKit(id: string) {
  try {
    if (typeof window === "undefined") return;
    const kits = loadKits().filter((k) => k.id !== id);
    window.localStorage.setItem(KEY, JSON.stringify(kits));
  } catch {}
}

export function getKitById(id: string): SavedKit | undefined {
  return loadKits().find((k) => k.id === id);
}

// FIX FOR RENDER ERROR: saved/page.tsx expects getSavedKits
export function getSavedKits(): SavedKit[] {
  return loadKits();
}

// Aliases so both old and new names work
export const getKits = loadKits;
export const listKits = loadKits;
