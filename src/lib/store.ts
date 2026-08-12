import { useSyncExternalStore } from "react";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
};

export type Area = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  notes: Note[];
};

export type Library = {
  version: number;
  areas: Area[];
};

const STORAGE_KEY = "no-excuses.library.v1";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const seed = (): Library => ({
  version: 1,
  areas: [
    { id: uid(), name: "C", createdAt: Date.now(), updatedAt: Date.now(), notes: [] },
    { id: uid(), name: "CYBERSEGURANÇA", createdAt: Date.now(), updatedAt: Date.now(), notes: [] },
    { id: uid(), name: "LINUX", createdAt: Date.now(), updatedAt: Date.now(), notes: [] },
  ],
});

let state: Library = { version: 1, areas: [] };
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function emit() {
  for (const l of listeners) l();
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Library;
      if (parsed && Array.isArray(parsed.areas)) {
        state = { version: 1, areas: parsed.areas };
        return;
      }
    }
  } catch {
    /* corrupted data -> reseed */
  }
  state = seed();
  persist();
}

function set(next: Library) {
  state = next;
  persist();
  emit();
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const emptyLibrary: Library = { version: 1, areas: [] };

export function useLibrary(): Library {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state;
    },
    () => emptyLibrary,
  );
}

export const actions = {
  createArea(name: string) {
    const now = Date.now();
    const area: Area = { id: uid(), name: name.trim(), createdAt: now, updatedAt: now, notes: [] };
    set({ ...state, areas: [...state.areas, area] });
    return area.id;
  },
  renameArea(areaId: string, name: string) {
    set({
      ...state,
      areas: state.areas.map((a) =>
        a.id === areaId ? { ...a, name: name.trim(), updatedAt: Date.now() } : a,
      ),
    });
  },
  deleteArea(areaId: string) {
    set({ ...state, areas: state.areas.filter((a) => a.id !== areaId) });
  },
  createNote(areaId: string, title: string) {
    const now = Date.now();
    const note: Note = {
      id: uid(),
      title: title.trim(),
      content: "",
      createdAt: now,
      updatedAt: now,
      tags: [],
    };
    set({
      ...state,
      areas: state.areas.map((a) =>
        a.id === areaId ? { ...a, notes: [note, ...a.notes], updatedAt: now } : a,
      ),
    });
    return note.id;
  },
  updateNote(areaId: string, noteId: string, patch: Partial<Pick<Note, "title" | "content">>) {
    const now = Date.now();
    set({
      ...state,
      areas: state.areas.map((a) =>
        a.id !== areaId
          ? a
          : {
              ...a,
              updatedAt: now,
              notes: a.notes.map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: now } : n)),
            },
      ),
    });
  },
  deleteNote(areaId: string, noteId: string) {
    set({
      ...state,
      areas: state.areas.map((a) =>
        a.id !== areaId ? a : { ...a, notes: a.notes.filter((n) => n.id !== noteId) },
      ),
    });
  },
  exportJSON(): string {
    return JSON.stringify(state, null, 2);
  },
  importJSON(raw: string) {
    const parsed = JSON.parse(raw) as Library;
    if (!parsed || !Array.isArray(parsed.areas)) throw new Error("invalid backup");
    set({ version: 1, areas: parsed.areas });
  },
};

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(ts).toLocaleDateString();
}
