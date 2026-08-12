import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { InlineCreate, Row, SectionLabel, Shell, TextButton } from "@/components/terminal";
import { actions, timeAgo, useLibrary } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NO EXCUSES — biblioteca de estudos no terminal" },
      {
        name: "description",
        content:
          "Anotações mentais e organização de estudos em uma interface minimalista de terminal, offline e instantânea.",
      },
      { property: "og:title", content: "NO EXCUSES — biblioteca de estudos no terminal" },
      {
        property: "og:description",
        content: "Crie áreas de estudo e notas rápidas. Funciona offline, direto no navegador.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const library = useLibrary();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return library.areas.flatMap((area) =>
      area.notes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            area.name.toLowerCase().includes(q),
        )
        .map((n) => ({ area, note: n })),
    );
  }, [library, query]);

  return (
    <Shell>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="pesquisar notas..."
        className="mb-6 w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-accent"
      />

      {results ? (
        <>
          <SectionLabel>SEARCH ({results.length})</SectionLabel>
          {results.map(({ area, note }) => (
            <Row
              key={note.id}
              label={note.title || "sem título"}
              meta={area.name}
              color="note"
              to="/area/$areaId/$noteId"
              params={{ areaId: area.id, noteId: note.id }}
            />
          ))}
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">nenhum resultado.</p>
          ) : null}
        </>
      ) : (
        <>
          <SectionLabel>STUDY LIBRARY</SectionLabel>
          {library.areas.map((area) => (
            <Row
              key={area.id}
              label={area.name}
              meta={`${area.notes.length} notas`}
              to="/area/$areaId"
              params={{ areaId: area.id }}
              actions={
                <>
                  <TextButton
                    onClick={() => {
                      const name = window.prompt("Novo nome da área", area.name);
                      if (name?.trim()) actions.renameArea(area.id, name);
                    }}
                  >
                    rename
                  </TextButton>
                  <TextButton
                    danger
                    onClick={() => {
                      if (window.confirm(`Excluir a área "${area.name}" e suas notas?`))
                        actions.deleteArea(area.id);
                    }}
                  >
                    del
                  </TextButton>
                </>
              }
            />
          ))}
          {library.areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">nenhuma área ainda.</p>
          ) : null}
          <InlineCreate
            label="NOVA ÁREA"
            placeholder="nome da área"
            onSubmit={(name) => {
              const id = actions.createArea(name);
              navigate({ to: "/area/$areaId", params: { areaId: id } });
            }}
          />
          <p className="mt-10 text-xs text-muted-foreground/70">
            {library.areas.reduce((acc, a) => acc + a.notes.length, 0)} notas · salvo localmente ·
            última atividade{" "}
            {timeAgo(Math.max(0, ...library.areas.map((a) => a.updatedAt)) || Date.now())}
          </p>
        </>
      )}
    </Shell>
  );
}
