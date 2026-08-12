import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Highlighted, Shell, TextButton } from "@/components/terminal";
import { actions, timeAgo, useLibrary } from "@/lib/store";

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

function NotePage() {
  const { areaId, noteId } = Route.useParams();
  const library = useLibrary();
  const navigate = useNavigate();
  const area = library.areas.find((a) => a.id === areaId);
  const note = area?.notes.find((n) => n.id === noteId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (note && draft === null) setDraft({ title: note.title, content: note.content });
  }, [note, draft]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  if (!area || !note || !draft) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">nota não encontrada.</p>
      </Shell>
    );
  }

  const autosave = (next: { title: string; content: string }) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      actions.updateNote(area.id, note.id, next);
      setSavedAt(Date.now());
    }, 400);
  };

  return (
    <Shell
      crumbs={
        <>
          <span className="text-area">{area.name}</span>{" "}
          <span className="text-muted-foreground">/</span>{" "}
          <span className="text-note">{draft.title || "sem título"}</span>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          editado {timeAgo(savedAt ?? note.updatedAt)}
          {savedAt ? " · salvo" : ""}
        </span>
        <div className="flex gap-4">
          <TextButton onClick={() => setEditing((v) => !v)}>
            {editing ? "ler" : "editar"}
          </TextButton>
          <TextButton
            danger
            onClick={() => {
              if (window.confirm("Excluir esta nota?")) {
                actions.deleteNote(area.id, note.id);
                navigate({ to: "/area/$areaId", params: { areaId: area.id } });
              }
            }}
          >
            excluir
          </TextButton>
        </div>
      </div>

      {editing ? (
        <>
          <input
            value={draft.title}
            onChange={(e) => autosave({ ...draft, title: e.target.value })}
            placeholder="título"
            className="w-full bg-transparent text-lg font-bold text-note outline-none"
          />
          <textarea
            value={draft.content}
            onChange={(e) => autosave({ ...draft, content: e.target.value })}
            placeholder="escreva aqui..."
            spellCheck={false}
            className="mt-4 min-h-[60vh] w-full resize-none bg-transparent text-sm leading-7 outline-none placeholder:text-muted-foreground/60"
          />
        </>
      ) : (
        <>
          <h1 className="text-lg font-bold text-note">&gt; {draft.title || "sem título"}</h1>
          <div className="mt-4 text-sm leading-7 whitespace-pre-wrap">
            {draft.content ? (
              <Highlighted text={draft.content} />
            ) : (
              <span className="text-muted-foreground">nota vazia — clique em editar.</span>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
