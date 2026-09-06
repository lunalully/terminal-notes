import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  CopyPlus,
  Eye,
  Pencil,
  Pin,
  Plus,
  Share2,
  Star,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Shell, Menu, type MenuItem, CategoryBadge } from "@/components/terminal";
import { Markdown } from "@/lib/markdown";
import { actions, countWords, noteTitle, timeAgo, useLibrary } from "@/lib/store";

export const Route = createFileRoute("/area/$areaId/$noteId")({
  head: () => ({
    meta: [
      { title: "Nota — NO EXCUSES" },
      { name: "description", content: "Leia e edite sua anotação de estudo no NO EXCUSES." },
      { property: "og:title", content: "Nota — NO EXCUSES" },
      { property: "og:description", content: "Editor de notas minimalista com autosave local." },
    ],
  }),
  component: NotePage,
});

type SaveStatus = "idle" | "saving" | "saved";

function NotePage() {
  const { areaId, noteId } = Route.useParams();
  const library = useLibrary();
  const navigate = useNavigate();
  const area = library.areas.find((a) => a.id === areaId);
  const note = area?.notes.find((n) => n.id === noteId);

  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [status, setStatus] = useState<SaveStatus>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note && draft === null) {
      const d = { title: note.title, content: note.content };
      draftRef.current = d;
      setDraft(d);
      const focusField = note.title.trim() ? "content" : "title";
      const t = setTimeout(() => {
        if (focusField === "title") titleRef.current?.focus();
        else contentRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [note, draft]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const wordCount = useMemo(() => countWords(draft?.content ?? ""), [draft?.content]);

  if (!area || !note || !draft) {
    return (
      <Shell back={() => navigate({ to: "/" })}>
        <p className="text-sm text-muted-foreground">nota não encontrada.</p>
      </Shell>
    );
  }

  const autosave = (next: { title: string; content: string }) => {
    draftRef.current = next;
    setDraft(next);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      actions.updateNote(area.id, note.id, next);
      setStatus("saved");
    }, 400);
  };

  const createNext = () => {
    if (draftRef.current) {
      actions.updateNote(area.id, note.id, draftRef.current);
      if (timer.current) clearTimeout(timer.current);
    }
    const { noteId: nextId } = actions.quickCreateNote({}, area.id);
    navigate({
      to: "/area/$areaId/$noteId",
      params: { areaId: area.id, noteId: nextId },
      replace: true,
    });
  };

  const applyChange = (next: string, caret: number, target: "title" | "content") => {
    autosave({ ...draft, [target]: next });
    requestAnimationFrame(() => {
      const el = target === "title" ? titleRef.current : contentRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = val.indexOf("\n", start);
    const end = lineEnd === -1 ? val.length : lineEnd;
    const line = val.slice(lineStart, end);
    if (line.startsWith(prefix)) return;
    const next = val.slice(0, lineStart) + prefix + line + val.slice(end);
    applyChange(next, lineStart + prefix.length + line.length, "content");
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end) || placeholder;
    const next = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    applyChange(next, start + before.length + sel.length + after.length, "content");
  };

  const insertCodeBlock = () => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    const block = sel ? "```\n" + sel + "\n```" : "```bash\n\n```";
    const caret = sel ? start + block.length : start + "```bash\n".length;
    const next = ta.value.slice(0, start) + block + ta.value.slice(end);
    applyChange(next, caret, "content");
  };

  const tools: { glyph: string; title: string; run: () => void }[] = [
    { glyph: "#", title: "Título", run: () => insertLinePrefix("# ") },
    { glyph: "-", title: "Lista", run: () => insertLinePrefix("- ") },
    { glyph: "[ ]", title: "Checkbox", run: () => insertLinePrefix("- [ ] ") },
    { glyph: "</>", title: "Bloco de código", run: insertCodeBlock },
    { glyph: "*", title: "Itálico", run: () => wrapSelection("*", "*", "texto") },
    { glyph: ">", title: "Citação", run: () => insertLinePrefix("> ") },
  ];

  const share = async () => {
    const text = `# ${noteTitle(note)}\n\n${note.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: noteTitle(note), text });
      } catch {
        /* cancelled */
      }
    } else {
      void navigator.clipboard.writeText(text);
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: note.favorite ? "Desfavoritar" : "Favoritar",
      icon: <Star className="h-4 w-4" />,
      onClick: () => actions.toggleFavorite(area.id, note.id),
    },
    {
      label: note.pinned ? "Desafixar" : "Fixar",
      icon: <Pin className="h-4 w-4" />,
      onClick: () => actions.togglePinned(area.id, note.id),
    },
    {
      label: "Duplicar",
      icon: <CopyPlus className="h-4 w-4" />,
      onClick: () => actions.duplicateNote(area.id, note.id),
    },
    {
      label: "Copiar",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => navigator.clipboard.writeText(`# ${noteTitle(note)}\n\n${note.content}`),
    },
    {
      label: "Compartilhar",
      icon: <Share2 className="h-4 w-4" />,
      onClick: share,
    },
    {
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        if (window.confirm("Excluir esta nota?")) {
          actions.deleteNote(area.id, note.id);
          navigate({ to: "/area/$areaId", params: { areaId: area.id }, replace: true });
        }
      },
    },
  ];

  return (
    <Shell
      back={() => navigate({ to: "/area/$areaId", params: { areaId: area.id } })}
      crumbs={
        <span className="inline-flex items-center gap-1.5">
          <span>{area.icon}</span>
          <span>{noteTitle(note) || "sem título"}</span>
        </span>
      }
      right={
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => actions.toggleFavorite(area.id, note.id)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-gold"
            aria-label="favoritar"
          >
            <Star className={note.favorite ? "h-4 w-4 fill-current text-gold" : "h-4 w-4"} />
          </button>
          <button
            type="button"
            onClick={() => actions.togglePinned(area.id, note.id)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-neon"
            aria-label="fixar"
          >
            <Pin className={note.pinned ? "h-4 w-4 fill-current text-neon" : "h-4 w-4"} />
          </button>
          <Menu items={menuItems} trigger={<MoreVertical className="h-4 w-4" />} />
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge area={area} />
          <span className="text-[11px] text-muted-foreground/70">
            editado {timeAgo(note.updatedAt)}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/70">
          {status === "saving" ? (
            <span className="text-gold">salvando...</span>
          ) : status === "saved" ? (
            <span className="text-neon">salvo ✓</span>
          ) : (
            <span className="text-muted-foreground/50">local</span>
          )}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={
              mode === "write"
                ? "flex items-center gap-1.5 rounded-md bg-selection px-2.5 py-1 text-xs text-foreground"
                : "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground"
            }
          >
            <Pencil className="h-3.5 w-3.5" />
            escrever
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={
              mode === "preview"
                ? "flex items-center gap-1.5 rounded-md bg-selection px-2.5 py-1 text-xs text-foreground"
                : "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground"
            }
          >
            <Eye className="h-3.5 w-3.5" />
            ler
          </button>
        </div>
        <button
          type="button"
          onClick={createNext}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-neon"
        >
          <Plus className="h-3.5 w-3.5" />
          nova nota
        </button>
      </div>

      {mode === "write" ? (
        <>
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => autosave({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createNext();
              }
            }}
            placeholder="título"
            className="w-full bg-transparent text-lg font-bold text-note outline-none placeholder:text-muted-foreground/40"
          />
          <textarea
            ref={contentRef}
            value={draft.content}
            onChange={(e) => autosave({ ...draft, content: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                createNext();
              }
            }}
            placeholder="escreva aqui — markdown suportado..."
            spellCheck={false}
            className="mt-3 min-h-[55vh] w-full resize-none bg-transparent text-sm leading-7 outline-none placeholder:text-muted-foreground/50"
          />
        </>
      ) : (
        <div className="min-h-[55vh]">
          <h1 className="text-lg font-bold text-note">&gt; {noteTitle(note) || "sem título"}</h1>
          <div className="mt-3">
            <Markdown text={draft.content} />
          </div>
        </div>
      )}

      <div className="sticky bottom-16 flex justify-between gap-1 rounded-xl border border-border bg-background/95 p-1 backdrop-blur sm:bottom-6">
        <div className="flex gap-1">
          {tools.map((t) => (
            <button
              key={t.title}
              type="button"
              title={t.title}
              onClick={() => {
                if (mode !== "write") setMode("write");
                requestAnimationFrame(() => contentRef.current?.focus());
                t.run();
              }}
              className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-sm text-muted-foreground transition-colors hover:bg-selection hover:text-neon"
            >
              {t.glyph}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={createNext}
          aria-label="nova nota"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neon transition-colors hover:bg-selection"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/60">
        <span>
          {wordCount} palavras · {draft.content.length} caracteres
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-neon/70" />
          salvo localmente
        </span>
      </div>
    </Shell>
  );
}
