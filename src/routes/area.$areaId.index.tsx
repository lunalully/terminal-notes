import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { InlineCreate, Row, SectionLabel, Shell, TextButton } from "@/components/terminal";
import { actions, timeAgo, useLibrary } from "@/lib/store";

export const Route = createFileRoute("/area/$areaId/")({
  head: () => ({
    meta: [
      { title: "Área de estudo — NO EXCUSES" },
      { name: "description", content: "Notas de uma área de estudo dentro do NO EXCUSES." },
      { property: "og:title", content: "Área de estudo — NO EXCUSES" },
      { property: "og:description", content: "Notas rápidas organizadas por área de estudo." },
    ],
  }),
  component: AreaPage,
});

function AreaPage() {
  const { areaId } = Route.useParams();
  const library = useLibrary();
  const navigate = useNavigate();
  const area = library.areas.find((a) => a.id === areaId);

  if (!area) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">área não encontrada.</p>
      </Shell>
    );
  }

  return (
    <Shell crumbs={<span className="text-area">{area.name}</span>}>
      <SectionLabel>NOTES</SectionLabel>
      {area.notes.map((note) => (
        <Row
          key={note.id}
          label={note.title || "sem título"}
          meta={timeAgo(note.updatedAt)}
          color="note"
          to="/area/$areaId/$noteId"
          params={{ areaId: area.id, noteId: note.id }}
          actions={
            <TextButton
              danger
              onClick={() => {
                if (window.confirm(`Excluir a nota "${note.title}"?`))
                  actions.deleteNote(area.id, note.id);
              }}
            >
              del
            </TextButton>
          }
        />
      ))}
      {area.notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">nenhuma nota ainda.</p>
      ) : null}
      <InlineCreate
        label="NOVA NOTA"
        placeholder="título da nota"
        onSubmit={(title) => {
          const id = actions.createNote(area.id, title);
          navigate({ to: "/area/$areaId/$noteId", params: { areaId: area.id, noteId: id } });
        }}
      />
    </Shell>
  );
}
