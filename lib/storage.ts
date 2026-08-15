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
  const kits = loadKits();
  kits.unshift(kit);
  window.localStorage.setItem(KEY, JSON.stringify(kits));
}

export function deleteKit(id: string) {
  const kits = loadKits().filter((k) => k.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(kits));
}
