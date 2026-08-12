import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

export function Shell({ crumbs, children }: { crumbs?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 font-mono text-foreground sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-baseline gap-2">
          <FedoraMark />
          <Link to="/" className="text-lg font-bold tracking-[0.25em] text-foreground">
            NO EXCUSES
          </Link>
          {crumbs ? <span className="text-muted-foreground">/ {crumbs}</span> : null}
        </header>
        <div className="mt-3 mb-6 border-t border-border" />
        {children}
      </div>
    </div>
  );
}

export function FedoraMark() {
  return (
    <svg viewBox="0 0 24 14" className="h-4 w-7 shrink-0 text-accent" aria-hidden="true">
      <path
        d="M6 8c0-4 1.5-6 6-6s6 2 6 6c3 .6 5 1.7 5 2.9C23 12.6 18.1 14 12 14S1 12.6 1 10.9C1 9.7 3 8.6 6 8Z"
        fill="currentColor"
      />
      <path d="M5 9.2h14" stroke="var(--background)" strokeWidth="1.4" />
    </svg>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-4 text-sm text-muted-foreground">&gt; {children}</div>;
}

export function Row({
  label,
  meta,
  to,
  params,
  color = "area",
  actions,
}: {
  label: string;
  meta?: string;
  to: string;
  params?: Record<string, string>;
  color?: "area" | "note";
  actions?: ReactNode;
}) {
  return (
    <div className="group flex items-center justify-between gap-3 border-b border-border/60 py-2">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={to as any}
        params={params}
        className="min-w-0 flex-1 truncate hover:bg-selection"
      >
        <span className="text-muted-foreground">[ </span>
        <span className={color === "area" ? "text-area" : "text-note"}>{label}</span>
        <span className="text-muted-foreground"> ]</span>
        {meta ? <span className="ml-2 text-xs text-muted-foreground">{meta}</span> : null}
      </Link>
      {actions ? (
        <div className="flex shrink-0 gap-3 text-xs text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function TextButton({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? "text-destructive hover:underline"
          : "text-muted-foreground hover:text-foreground hover:underline"
      }
    >
      {children}
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
        className="mt-4 text-sm text-muted-foreground hover:text-accent"
      >
        + {label}
      </button>
    );
  }

  return (
    <form
      className="mt-4 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
        setValue("");
        setOpen(false);
      }}
    >
      <span className="text-accent">$</span>
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
      />
    </form>
  );
}

/** Highlights "quoted" and (parenthesised) fragments. */
export function Highlighted({ text }: { text: string }) {
  const parts = text.split(/("[^"]*"|\([^)]*\))/g);
  return (
    <>
      {parts.map((part, i) =>
        /^".*"$|^\(.*\)$/s.test(part) ? (
          <span key={i} className="text-accent">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
