import { useSyncExternalStore } from "react";

export type CategoryColor =
  "yellow" | "blue" | "purple" | "green" | "red" | "gray" | "orange" | "pink";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
};

export type Area = {
  id: string;
  name: string;
  icon: string;
  color: CategoryColor;
  createdAt: number;
  updatedAt: number;
  notes: Note[];
};

export type Library = {
  version: number;
  areas: Area[];
};

export type Template = {
  name: string;
  icon: string;
  content: string;
};

export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  yellow: "#eab308",
  blue: "#38bdf8",
  purple: "#a78bfa",
  green: "#4ade80",
  red: "#f87171",
  gray: "#9ca3af",
  orange: "#fb923c",
  pink: "#f9a8d4",
};

export const CATEGORY_PRESETS: {
  name: string;
  icon: string;
  color: CategoryColor;
}[] = [
  { name: "Cybersegurança", icon: "🛰️", color: "yellow" },
  { name: "Linux", icon: "🐧", color: "blue" },
  { name: "Programação C", icon: "💾", color: "purple" },
  { name: "Go", icon: "🐹", color: "green" },
  { name: "Pentest", icon: "🎯", color: "red" },
  { name: "Cheatsheet", icon: "📋", color: "gray" },
  { name: "Estudos", icon: "📚", color: "orange" },
  { name: "Pessoal", icon: "🩷", color: "pink" },
];

const CATEGORY_INDEX: Record<string, { name: string; icon: string; color: CategoryColor }> =
  Object.fromEntries(CATEGORY_PRESETS.map((p) => [p.name.toLowerCase(), p]));

const TEMPLATE_PENTEST = [
  "🎯 **Alvo:**",
  "🌐 **Domínio:**",
  "🛰️ **IP:**",
  "📋 **Escopo:**",
  "",
  "## Reconhecimento",
  "",
  "Subdomínios:",
  "",
  "Portas:",
  "",
  "Diretórios:",
  "",
  "Observações:",
].join("\n");

const TEMPLATE_LINUX = [
  "## Comando",
  "",
  "```bash",
  "",
  "```",
  "",
  "**Descrição:**",
  "",
  "**Exemplo:**",
  "",
  "Observações:",
].join("\n");

const TEMPLATE_AULA = [
  "## Assunto",
  "",
  "**Resumo:**",
  "",
  "## Comandos",
  "",
  "## Dúvidas",
  "",
].join("\n");

export const TEMPLATES: Template[] = [
  { name: "Pentest", icon: "🎯", content: TEMPLATE_PENTEST },
  { name: "Linux", icon: "🐧", content: TEMPLATE_LINUX },
  { name: "Aula", icon: "📚", content: TEMPLATE_AULA },
];

const STORAGE_KEY = "no-excuses.library.v1";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const isColor = (c: unknown): c is CategoryColor => typeof c === "string" && c in CATEGORY_COLORS;

function resolveCategory(name: string) {
  const key = name.trim().toLowerCase();
  if (key === "c") return CATEGORY_PRESETS.find((p) => p.name === "Programação C");
  return CATEGORY_INDEX[key] ?? null;
}

const seed = (): Library => ({
  version: 1,
  areas: [
    { name: "Cybersegurança", icon: "🛰️", color: "yellow" },
    { name: "Linux", icon: "🐧", color: "blue" },
    { name: "Programação C", icon: "💾", color: "purple" },
  ].map((c) => ({
    id: uid(),
    name: c.name,
    icon: c.icon,
    color: c.color as CategoryColor,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    notes: [],
  })),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLibrary(raw: any): Library {
  const areas: Area[] = (Array.isArray(raw?.areas) ? raw.areas : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => {
      const preset = resolveCategory(String(a?.name ?? ""));
      return {
        id: String(a?.id ?? uid()),
        name: String(a?.name ?? "Nova área"),
        icon: typeof a?.icon === "string" && a.icon ? a.icon : (preset?.icon ?? "📝"),
        color: isColor(a?.color) ? a.color : (preset?.color ?? "gray"),
        createdAt: Number(a?.createdAt ?? Date.now()),
        updatedAt: Number(a?.updatedAt ?? Date.now()),
        notes: (Array.isArray(a?.notes) ? a.notes : []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (n: any) => ({
            id: String(n?.id ?? uid()),
            title: String(n?.title ?? ""),
            content: String(n?.content ?? ""),
            createdAt: Number(n?.createdAt ?? Date.now()),
            updatedAt: Number(n?.updatedAt ?? Date.now()),
            tags: Array.isArray(n?.tags) ? n.tags.map(String) : [],
            favorite: Boolean(n?.favorite),
            pinned: Boolean(n?.pinned),
          }),
        ),
      };
    },
  );
  return { version: 1, areas };
}

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
        state = normalizeLibrary(parsed);
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

function updateArea(areaId: string, fn: (a: Area) => Area) {
  set({
    ...state,
    areas: state.areas.map((a) => (a.id === areaId ? fn(a) : a)),
  });
}

function updateNote(areaId: string, noteId: string, fn: (n: Note) => Note) {
  updateArea(areaId, (a) => ({
    ...a,
    updatedAt: Date.now(),
    notes: a.notes.map((n) => (n.id === noteId ? fn(n) : n)),
  }));
}

function resolveAreaId(preferred?: string): string {
  if (preferred && state.areas.some((a) => a.id === preferred)) return preferred;
  if (state.areas.length === 0) {
    return actions.createArea("Geral", "📝", "gray");
  }
  const byUpdated = [...state.areas].sort((a, b) => b.updatedAt - a.updatedAt);
  const target = byUpdated[0];
  if (target) return target.id;
  return state.areas[0]!.id;
}

export const actions = {
  createArea(name: string, icon = "📝", color: CategoryColor = "gray") {
    const now = Date.now();
    const area: Area = {
      id: uid(),
      name: name.trim() || "Nova área",
      icon,
      color,
      createdAt: now,
      updatedAt: now,
      notes: [],
    };
    set({ ...state, areas: [...state.areas, area] });
    return area.id;
  },
  renameArea(areaId: string, name: string) {
    updateArea(areaId, (a) => ({ ...a, name: name.trim() || a.name }));
  },
  updateArea(areaId: string, patch: Partial<Pick<Area, "name" | "icon" | "color">>) {
    updateArea(areaId, (a) => ({ ...a, ...patch }));
  },
  deleteArea(areaId: string) {
    set({ ...state, areas: state.areas.filter((a) => a.id !== areaId) });
  },

  quickCreateNote(
    opts?: { title?: string; content?: string },
    preferredAreaId?: string,
  ): { areaId: string; noteId: string } {
    const targetId = resolveAreaId(preferredAreaId);
    const now = Date.now();
    const note: Note = {
      id: uid(),
      title: opts?.title ?? "",
      content: opts?.content ?? "",
      createdAt: now,
      updatedAt: now,
      tags: [],
      favorite: false,
      pinned: false,
    };
    updateArea(targetId, (a) => ({
      ...a,
      notes: [note, ...a.notes],
    }));
    return { areaId: targetId, noteId: note.id };
  },

  createNote(areaId: string | undefined, opts?: { title?: string; content?: string }): string {
    return this.quickCreateNote(opts, areaId).noteId;
  },

  updateNote(
    areaId: string,
    noteId: string,
    patch: Partial<Pick<Note, "title" | "content" | "favorite" | "pinned" | "tags">>,
  ) {
    const now = Date.now();
    updateArea(areaId, (a) => ({
      ...a,
      notes: a.notes.map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: now } : n)),
    }));
  },

  toggleFavorite(areaId: string, noteId: string) {
    updateNote(areaId, noteId, (n) => ({ ...n, favorite: !n.favorite }));
  },
  togglePinned(areaId: string, noteId: string) {
    updateNote(areaId, noteId, (n) => ({ ...n, pinned: !n.pinned }));
  },

  deleteNote(areaId: string, noteId: string) {
    updateArea(areaId, (a) => ({ ...a, notes: a.notes.filter((n) => n.id !== noteId) }));
  },

  duplicateNote(areaId: string, noteId: string) {
    const area = state.areas.find((a) => a.id === areaId);
    const note = area?.notes.find((n) => n.id === noteId);
    if (!area || !note) return;
    const now = Date.now();
    const copy: Note = {
      ...note,
      id: uid(),
      title: note.title ? `${note.title} (cópia)` : "sem título",
      createdAt: now,
      updatedAt: now,
    };
    updateArea(areaId, (a) => ({ ...a, notes: [copy, ...a.notes] }));
    return copy.id;
  },

  moveNote(areaId: string, noteId: string, targetAreaId: string) {
    if (areaId === targetAreaId) return;
    const source = state.areas.find((a) => a.id === areaId);
    const note = source?.notes.find((n) => n.id === noteId);
    if (!source || !note) return;
    const now = Date.now();
    set({
      ...state,
      areas: state.areas.map((a) => {
        if (a.id === areaId)
          return { ...a, notes: a.notes.filter((n) => n.id !== noteId), updatedAt: now };
        if (a.id === targetAreaId)
          return { ...a, notes: [{ ...note, updatedAt: now }, ...a.notes], updatedAt: now };
        return a;
      }),
    });
  },

  exportJSON(): string {
    return JSON.stringify(state, null, 2);
  },
  importJSON(raw: string) {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.areas)) throw new Error("backup inválido");
    set(normalizeLibrary(parsed));
  },
};

export function allNotes(lib: Library): { area: Area; note: Note }[] {
  return lib.areas.flatMap((area) => area.notes.map((note) => ({ area, note })));
}

export function lastEditedNoteId(lib: Library): string | null {
  let best: Note | null = null;
  for (const a of lib.areas)
    for (const n of a.notes) if (!best || n.updatedAt > best.updatedAt) best = n;
  return best?.id ?? null;
}

export function noteCount(lib: Library): number {
  return lib.areas.reduce((acc, a) => acc + a.notes.length, 0);
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function firstLine(text: string): string {
  const line = text
    .split("\n")
    .map((s) =>
      s
        .replace(/^#{1,6}\s+/, "")
        .replace(/^>\s?/, "")
        .trim(),
    )
    .find((s) => s.length > 0);
  return line ?? "";
}

export function noteTitle(note: Note): string {
  return note.title.trim() || firstLine(note.content) || "sem título";
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days} dias`;
  return new Date(ts).toLocaleDateString("pt-BR");
}
