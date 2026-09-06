import { Check, ChevronLeft, Search, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, type Area, type CategoryColor } from "@/lib/store";

export function FedoraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 14"
      className={cn("h-4 w-7 shrink-0 text-gold", className)}
      aria-hidden="true"
    >
      <path
        d="M6 8c0-4 1.5-6 6-6s6 2 6 6c3 .6 5 1.7 5 2.9C23 12.6 18.1 14 12 14S1 12.6 1 10.9C1 9.7 3 8.6 6 8Z"
        fill="currentColor"
      />
      <path d="M5 9.2h14" stroke="var(--background)" strokeWidth="1.4" />
    </svg>
  );
}

export function Shell({
  back,
  crumbs,
  right,
  children,
}: {
  back?: () => void;
  crumbs?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-4 pb-32 sm:px-6">
        <header className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-1.5">
            {back ? (
              <button
                type="button"
                onClick={back}
                aria-label="voltar"
                className="mr-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-selection hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <Link to="/" className="flex items-center gap-2">
              <FedoraMark />
              <span className="text-sm font-bold tracking-[0.25em]">NO EXCUSES</span>
            </Link>
            {crumbs ? (
              <span className="ml-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate">{crumbs}</span>
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-0.5">{right}</div>
          </div>
        </header>
        <main className="pt-4">{children}</main>
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
      &gt; {children}
    </div>
  );
}

export function TextButton({
  onClick,
  children,
  danger,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-muted-foreground transition-colors hover:underline",
        danger ? "hover:text-destructive" : "hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  children,
  label,
  active,
  danger,
  className,
}: {
  onClick?: () => void;
  children: ReactNode;
  label?: string;
  active?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-selection hover:text-foreground",
        active && "text-gold",
        danger && "hover:text-destructive",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "pesquisar...",
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors focus-within:border-neon/50",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="limpar"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

export function Menu({
  items,
  trigger,
  align = "right",
  triggerClassName,
  onOpenChange,
}: {
  items: MenuItem[];
  trigger: ReactNode;
  align?: "left" | "right";
  triggerClassName?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(open);
    if (!open) return;

    const measure = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor || !menu) return;
      const rect = anchor.getBoundingClientRect();
      const width = menu.offsetWidth;
      const padding = 8;
      const maxLeft = window.innerWidth - width - padding;
      let left = align === "right" ? rect.right - width : rect.left;
      left = Math.max(padding, Math.min(left, maxLeft));
      setPos({ top: rect.bottom + 4, left });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, align, onOpenChange]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-selection hover:text-foreground",
          triggerClassName,
        )}
      >
        {trigger}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                opacity: pos ? 1 : 0,
                visibility: pos ? "visible" : "hidden",
              }}
              className="animate-pop z-[9999] min-w-[12rem] rounded-lg border border-border bg-popover p-1 shadow-xl"
            >
              {items.map((item) => (
                <button
                  type="button"
                  role="menuitem"
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    item.onClick?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-selection",
                    item.danger && "text-destructive hover:text-destructive",
                  )}
                >
                  {item.icon ? <span className="text-muted-foreground">{item.icon}</span> : null}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function CategoryBadge({
  area,
  className,
}: {
  area: Pick<Area, "name" | "icon" | "color">;
  className?: string;
}) {
  const color = CATEGORY_COLORS[area.color] ?? CATEGORY_COLORS.gray;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span>{area.icon}</span>
      <span>{area.name}</span>
    </span>
  );
}

export function ColorDot({ color }: { color: CategoryColor }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: CATEGORY_COLORS[color] ?? CATEGORY_COLORS.gray }}
    />
  );
}

export function Chip({
  label,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  color?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-neon/50 bg-selection text-foreground"
          : "border-border/60 text-muted-foreground hover:text-foreground",
      )}
    >
      {color ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {icon ? <span>{icon}</span> : null}
      {label}
    </button>
  );
}

export function InlineCreate({
  label,
  placeholder,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  onSubmit: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm text-muted-foreground hover:text-neon"
      >
        + {label}
      </button>
    );
  }

  return (
    <form
      className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:border-neon/50"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
        setValue("");
        setOpen(false);
      }}
    >
      <span className="text-gold">$</span>
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground"
        aria-label="confirmar"
      >
        <Check className="h-4 w-4" />
      </button>
    </form>
  );
}
