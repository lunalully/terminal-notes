import {
  Check,
  Copy,
  CopyPlus,
  FolderInput,
  MoreVertical,
  Pin,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/terminal";
import {
  actions,
  CATEGORY_COLORS,
  firstLine,
  noteTitle,
  timeAgo,
  type Area,
  type Note,
} from "@/lib/store";

export type NoteItem = { area: Area; note: Note };

export type SortKey = "recent" | "oldest" | "alpha" | "category" | "favorite";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mais recentes" },
  { key: "oldest", label: "Mais antigas" },
  { key: "alpha", label: "Alfabética" },
  { key: "category", label: "Categoria" },
  { key: "favorite", label: "Favoritas" },
];

export function sortItems(items: NoteItem[], key: SortKey): NoteItem[] {
  const list = [...items];
  list.sort((a, b) => {
    switch (key) {
      case "recent":
        return b.note.updatedAt - a.note.updatedAt;
      case "oldest":
        return a.note.updatedAt - b.note.updatedAt;
      case "alpha":
        return noteTitle(a.note).localeCompare(noteTitle(b.note));
      case "category":
        return a.area.name.localeCompare(b.area.name) || b.note.updatedAt - a.note.updatedAt;
      case "favorite":
        return (
          Number(b.note.favorite) - Number(a.note.favorite) || b.note.updatedAt - a.note.updatedAt
        );
    }
  });
  return list.sort((a, b) => Number(b.note.pinned) - Number(a.note.pinned));
}

const LEFT_REVEAL = 104;
const RIGHT_REVEAL = 64;

function buildMarkdown(note: Note, area: Area): string {
  return [`# ${noteTitle(note)}`, "", `Categoria: ${area.name}`, "", note.content].join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function NoteCard({
  item,
  areas,
  active,
  onOpen,
}: {
  item: NoteItem;
  areas: Area[];
  active: boolean;
  onOpen: (item: NoteItem) => void;
}) {
  const { area, note } = item;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPage, setMenuPage] = useState<"main" | "move">("main");
  const [copied, setCopied] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const suppressClick = useRef(false);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseDx = useRef(0);

  useEffect(() => {
    if (!menuOpen) return;

    const measure = () => {
      const rect = menuAnchorRef.current?.getBoundingClientRect();
      const panel = menuPanelRef.current;
      if (!rect || !panel) return;
      const width = panel.offsetWidth;
      const padding = 8;
      let left = rect.right - width;
      left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));
      setMenuPos({ top: rect.bottom + 4, left });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuPanelRef.current?.contains(t) || menuAnchorRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
    axis.current = null;
    suppressClick.current = false;
    baseDx.current = dx;

    longPress.current = setTimeout(() => {
      suppressClick.current = true;
      setMenuPage("main");
      setMenuOpen(true);
    }, 500);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const deltaX = e.clientX - start.current.x;
    const deltaY = e.clientY - start.current.y;

    if (!axis.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      axis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
      if (axis.current === "h") {
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        clearLongPress();
      }
    }

    if (axis.current !== "h") return;
    setDragging(true);
    clearLongPress();
    setDx(clamp(baseDx.current + deltaX, -RIGHT_REVEAL, LEFT_REVEAL));
  };

  const onPointerUp = () => {
    clearLongPress();
    if (axis.current === "h" && Math.abs(dx - baseDx.current) > 4) {
      suppressClick.current = true;
      if (dx > LEFT_REVEAL * 0.5) setDx(LEFT_REVEAL);
      else if (dx < -RIGHT_REVEAL * 0.5) setDx(-RIGHT_REVEAL);
      else setDx(0);
    }
    setDragging(false);
    start.current = null;
    axis.current = null;
  };

  const clearLongPress = () => {
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const openCopy = async () => {
    const ok = await copyText(buildMarkdown(note, area));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const share = async () => {
    const text = buildMarkdown(note, area);
    if (navigator.share) {
      try {
        await navigator.share({ title: noteTitle(note), text });
      } catch {
        /* cancelled */
      }
    } else {
      void openCopy();
    }
  };

  return (
    <div
      className={cn(
        "relative mb-2 overflow-hidden rounded-xl border transition-colors",
        active ? "border-neon/40" : "border-border/70",
      )}
    >
      <div className="absolute inset-y-0 left-0 flex gap-0.5 rounded-xl">
        <button
          type="button"
          onClick={() => actions.toggleFavorite(area.id, note.id)}
          className={cn(
            "flex w-[52px] items-center justify-center text-muted-foreground transition-colors hover:text-gold",
            note.favorite && "text-gold",
          )}
          aria-label="favoritar"
        >
          <Star className={cn("h-4 w-4", note.favorite && "fill-current")} />
        </button>
        <button
          type="button"
          onClick={() => actions.togglePinned(area.id, note.id)}
          className={cn(
            "flex w-[52px] items-center justify-center text-muted-foreground transition-colors hover:text-neon",
            note.pinned && "text-neon",
          )}
          aria-label="fixar"
        >
          <Pin className={cn("h-4 w-4", note.pinned && "fill-current")} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex rounded-xl bg-destructive/80">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Excluir esta nota?")) actions.deleteNote(area.id, note.id);
          }}
          className="flex w-[64px] items-center justify-center text-destructive-foreground transition-colors hover:bg-destructive"
          aria-label="excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={cardRef}
        className="relative cursor-pointer bg-background"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 0.18s ease",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (suppressClick.current) return;
          if (dx !== 0) {
            setDx(0);
            return;
          }
          onOpen(item);
        }}
      >
        <div className="px-3.5 py-3">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none">{area.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-bold text-foreground">{noteTitle(note)}</h3>
                {note.favorite ? (
                  <Star className="h-3 w-3 shrink-0 fill-current text-gold" />
                ) : null}
                {note.pinned ? <Pin className="h-3 w-3 shrink-0 fill-current text-neon" /> : null}
              </div>
              {firstLine(note.content) ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {firstLine(note.content)}
                </p>
              ) : null}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              {copied ? (
                <span className="flex h-8 w-8 items-center justify-center text-neon">
                  <Check className="h-4 w-4" />
                </span>
              ) : (
                <button
                  ref={menuAnchorRef}
                  type="button"
                  aria-label="menu"
                  onClick={() => {
                    setMenuPage("main");
                    setMenuOpen((v) => !v);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-selection hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <CategoryBadge area={area} />
            <span className="text-[11px] text-muted-foreground/70">
              editado {timeAgo(note.updatedAt)}
            </span>
          </div>
        </div>

        {menuOpen
          ? createPortal(
              <div
                ref={menuPanelRef}
                role="menu"
                style={{
                  position: "fixed",
                  top: menuPos?.top ?? 0,
                  left: menuPos?.left ?? 0,
                  opacity: menuPos ? 1 : 0,
                  visibility: menuPos ? "visible" : "hidden",
                }}
                className="animate-pop z-[9999] min-w-[13rem] rounded-lg border border-border bg-popover p-1 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {menuPage === "main" ? (
                  <>
                    <MenuButton
                      onClick={() => {
                        actions.toggleFavorite(area.id, note.id);
                        setMenuOpen(false);
                      }}
                      icon={<Star className="h-4 w-4" />}
                      label={note.favorite ? "Desfavoritar" : "Favoritar"}
                    />
                    <MenuButton
                      onClick={() => {
                        actions.togglePinned(area.id, note.id);
                        setMenuOpen(false);
                      }}
                      icon={<Pin className="h-4 w-4" />}
                      label={note.pinned ? "Desafixar" : "Fixar"}
                    />
                    <MenuButton
                      onClick={() => {
                        actions.duplicateNote(area.id, note.id);
                        setMenuOpen(false);
                      }}
                      icon={<CopyPlus className="h-4 w-4" />}
                      label="Duplicar"
                    />
                    <MenuButton
                      onClick={() => setMenuPage("move")}
                      icon={<FolderInput className="h-4 w-4" />}
                      label="Mover categoria"
                    />
                    <MenuButton
                      onClick={openCopy}
                      icon={<Copy className="h-4 w-4" />}
                      label="Copiar"
                    />
                    <MenuButton
                      onClick={share}
                      icon={<Share2 className="h-4 w-4" />}
                      label="Compartilhar"
                    />
                    <div className="my-1 border-t border-border" />
                    <MenuButton
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        if (window.confirm("Excluir esta nota?"))
                          actions.deleteNote(area.id, note.id);
                      }}
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Excluir"
                    />
                  </>
                ) : (
                  <>
                    <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Mover para
                    </div>
                    {areas
                      .filter((a) => a.id !== area.id)
                      .map((a) => (
                        <MenuButton
                          key={a.id}
                          onClick={() => {
                            actions.moveNote(area.id, note.id, a.id);
                            setMenuOpen(false);
                          }}
                          icon={
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: CATEGORY_COLORS[a.color] }}
                            />
                          }
                          label={`${a.icon} ${a.name}`}
                        />
                      ))}
                  </>
                )}
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-selection",
        danger && "text-destructive hover:text-destructive",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}
