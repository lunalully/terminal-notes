import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, FilePlus2, Plus, Settings, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  Chip,
  ColorDot,
  Menu,
  SearchInput,
  SectionLabel,
  Shell,
  type MenuItem,
} from "@/components/terminal";
import { NoteCard, sortItems, SORT_OPTIONS, type SortKey } from "@/components/notes";
import {
  actions,
  allNotes,
  CATEGORY_COLORS,
  CATEGORY_PRESETS,
  lastEditedNoteId,
  noteCount,
  noteTitle,
  TEMPLATES,
  useLibrary,
} from "@/lib/store";

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
        content: "Crie notas rápidas. Funciona offline, direto no navegador.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const library = useLibrary();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const importRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    let res = allNotes(library);
    if (filter) res = res.filter((i) => i.area.id === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (i) =>
          noteTitle(i.note).toLowerCase().includes(q) ||
          i.note.content.toLowerCase().includes(q) ||
          i.note.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.area.name.toLowerCase().includes(q),
      );
    }
    return sortItems(res, sort);
  }, [library, query, filter, sort]);

  const activeId = lastEditedNoteId(library);

  const newNote = (content?: string) => {
    const { areaId, noteId } = actions.quickCreateNote(
      content ? { content } : {},
      filter ?? undefined,
    );
    navigate({ to: "/area/$areaId/$noteId", params: { areaId, noteId } });
  };

  const templateItems: MenuItem[] = TEMPLATES.map((t) => ({
    label: `${t.icon} ${t.name}`,
    onClick: () => newNote(t.content),
  }));

  const addCategoryItems: MenuItem[] = [
    ...CATEGORY_PRESETS.filter(
      (p) => !library.areas.some((a) => a.name.toLowerCase() === p.name.toLowerCase()),
    ).map((p) => ({
      label: `${p.icon} ${p.name}`,
      icon: <ColorDot color={p.color} />,
      onClick: () => actions.createArea(p.name, p.icon, p.color),
    })),
    {
      label: "Personalizada...",
      onClick: () => {
        const name = window.prompt("Nome da categoria");
        if (name?.trim()) actions.createArea(name);
      },
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      label: "Exportar backup",
      icon: <Download className="h-4 w-4" />,
      onClick: () => {
        const blob = new Blob([actions.exportJSON()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `no-excuses-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    },
    {
      label: "Importar backup",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => importRef.current?.click(),
    },
  ];

  return (
    <Shell right={<Menu items={settingsItems} trigger={<Settings className="h-4 w-4" />} />}>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              actions.importJSON(String(reader.result));
            } catch {
              window.alert("Arquivo de backup inválido.");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="buscar por título, conteúdo, tag ou comando..."
        className="mb-3"
      />

      <div className="mb-1 flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip label="Todas" active={filter === null} onClick={() => setFilter(null)} />
        {library.areas.map((area) => (
          <Chip
            key={area.id}
            label={area.name}
            icon={area.icon}
            color={CATEGORY_COLORS[area.color]}
            active={filter === area.id}
            onClick={() => setFilter(filter === area.id ? null : area.id)}
          />
        ))}
        <Menu
          align="left"
          triggerClassName="h-7 w-7 rounded-full border border-dashed border-border/60 hover:bg-selection hover:text-neon"
          trigger={<span className="text-xs">+</span>}
          items={addCategoryItems}
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionLabel>NOTES ({items.length})</SectionLabel>
        <div className="flex items-center gap-1">
          <Menu
            align="right"
            triggerClassName="h-auto w-auto gap-1 px-1 py-1 text-xs"
            trigger={
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {SORT_OPTIONS.find((s) => s.key === sort)?.label} ▾
              </span>
            }
            items={SORT_OPTIONS.map((s) => ({
              label: s.label,
              onClick: () => setSort(s.key),
            }))}
          />
        </div>
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
          items={templateItems}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
          {query || filter ? "nenhum resultado." : "nenhuma nota ainda — crie a primeira."}
        </div>
      ) : (
        <div className="animate-fade-in">
          {items.map((item) => (
            <NoteCard
              key={item.note.id}
              item={item}
              areas={library.areas}
              active={item.note.id === activeId}
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

      <p className="mt-6 text-xs text-muted-foreground/70">
        {noteCount(library)} notas · salvo localmente · favoritar ⭐ deslizar → · excluir deslizar ←
      </p>
    </Shell>
  );
}
