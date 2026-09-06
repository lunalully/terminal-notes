import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlus2, Palette, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Menu, SearchInput, SectionLabel, Shell, type MenuItem } from "@/components/terminal";
import { NoteCard, sortItems, SORT_OPTIONS, type SortKey } from "@/components/notes";
import {
  actions,
  CATEGORY_COLORS,
  CATEGORY_PRESETS,
  lastEditedNoteId,
  noteTitle,
  TEMPLATES,
  timeAgo,
  useLibrary,
  type CategoryColor,
} from "@/lib/store";

export const Route = createFileRoute("/area/$areaId/")({
  head: () => ({
    meta: [
      { title: "Categoria — NO EXCUSES" },
      { name: "description", content: "Notas de uma categoria dentro do NO EXCUSES." },
      { property: "og:title", content: "Categoria — NO EXCUSES" },
      { property: "og:description", content: "Notas rápidas organizadas por categoria." },
    ],
  }),
  component: AreaPage,
});

const COLOR_ORDER: CategoryColor[] = [
  "yellow",
  "blue",
  "purple",
  "green",
  "red",
  "gray",
  "orange",
  "pink",
];

function AreaPage() {
  const { areaId } = Route.useParams();
  const library = useLibrary();
  const navigate = useNavigate();
  const area = library.areas.find((a) => a.id === areaId);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const items = useMemo(() => {
    if (!area) return [];
    let res = area.notes.map((note) => ({ area, note }));
    const q = query.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (i) =>
          noteTitle(i.note).toLowerCase().includes(q) ||
          i.note.content.toLowerCase().includes(q) ||
          i.note.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return sortItems(res, sort);
  }, [area, query, sort]);

  if (!area) {
    return (
      <Shell back={() => navigate({ to: "/" })}>
        <p className="text-sm text-muted-foreground">categoria não encontrada.</p>
      </Shell>
    );
  }

  const newNote = (content?: string) => {
    const id = actions.createNote(area.id, content ? { content } : {});
    navigate({ to: "/area/$areaId/$noteId", params: { areaId: area.id, noteId: id } });
  };

  const settingItems: MenuItem[] = [
    {
      label: "Renomear",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => {
        const name = window.prompt("Novo nome da categoria", area.name);
        if (name?.trim()) actions.renameArea(area.id, name);
      },
    },
    {
      label: "Aplicar preset",
      icon: <Palette className="h-4 w-4" />,
      onClick: () => {
        const preset = CATEGORY_PRESETS.find(
          (p) => p.name.toLowerCase() === area.name.toLowerCase(),
        );
        if (preset) actions.updateArea(area.id, { icon: preset.icon, color: preset.color });
      },
    },
    ...COLOR_ORDER.map((color) => ({
      label: `cor ${color}`,
      icon: (
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[color] }} />
      ),
      onClick: () => actions.updateArea(area.id, { color }),
    })),
    {
      label: "Excluir categoria",
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        if (
          window.confirm(`Excluir a categoria "${area.name}" e suas ${area.notes.length} notas?`)
        ) {
          actions.deleteArea(area.id);
          navigate({ to: "/" });
        }
      },
    },
  ];

  return (
    <Shell
      back={() => navigate({ to: "/" })}
      crumbs={
        <span className="inline-flex items-center gap-1.5">
          <span>{area.icon}</span>
          <span>{area.name}</span>
        </span>
      }
      right={<Menu items={settingItems} trigger={<Settings className="h-4 w-4" />} />}
    >
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="buscar nesta categoria..."
        className="mb-3"
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionLabel>
          {area.notes.length} notas · editado {timeAgo(area.updatedAt)}
        </SectionLabel>
        <Menu
          align="right"
          triggerClassName="h-auto w-auto gap-1 px-1 py-1 text-xs"
          trigger={
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {SORT_OPTIONS.find((s) => s.key === sort)?.label} ▾
            </span>
          }
          items={SORT_OPTIONS.map((s) => ({ label: s.label, onClick: () => setSort(s.key) }))}
        />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => newNote()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nova nota
        </button>
        <Menu
          align="right"
          triggerClassName="h-11 w-11 rounded-lg border border-border hover:text-neon"
          trigger={<FilePlus2 className="h-4 w-4" />}
          items={TEMPLATES.map((t) => ({
            label: `${t.icon} ${t.name}`,
            onClick: () => newNote(t.content),
          }))}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
          {query ? "nenhum resultado." : "nenhuma nota ainda."}
        </div>
      ) : (
        <div className="animate-fade-in">
          {items.map((item) => (
            <NoteCard
              key={item.note.id}
              item={item}
              areas={library.areas}
              active={item.note.id === lastEditedNoteId(library)}
              onOpen={(it) =>
                navigate({
                  to: "/area/$areaId/$noteId",
                  params: { areaId: it.area.id, noteId: it.note.id },
                })
              }
            />
          ))}
        </div>
      )}
    </Shell>
  );
}
