import { useState, type ReactNode } from "react";

/* Lightweight markdown renderer tuned for notes:
 * headings, lists, checkboxes, code blocks (with copy), inline code,
 * bold/italic/strike, quotes, and horizontal rules.
 */

function CodeBlock({ lang, body }: { lang: string; body: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group my-3 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-selection hover:text-neon"
        >
          {copied ? "copiado ✓" : "copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-6">
        <code>{body}</code>
      </pre>
    </div>
  );
}

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|"[^"]*"|\([^)]*\))/g;

function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN);
  return parts.map((part, i) => {
    if (/^`.*`$/.test(part))
      return (
        <code key={i} className="rounded bg-card px-1 py-0.5 text-[0.85em] text-gold">
          {part.slice(1, -1)}
        </code>
      );
    if (/^\*\*.*\*\*$/.test(part))
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    if (/^\*.*\*$/.test(part))
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    if (/^~~.*~~$/.test(part))
      return (
        <del key={i} className="text-muted-foreground">
          {part.slice(2, -2)}
        </del>
      );
    if (/^".*"$/.test(part))
      return (
        <span key={i} className="text-gold">
          {part}
        </span>
      );
    if (/^\(.*\)$/.test(part))
      return (
        <span key={i} className="text-neon">
          {part}
        </span>
      );
    return <span key={i}>{part}</span>;
  });
}

type Block =
  | { type: "code"; lang: string; body: string }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: { checked: boolean | null; text: string }[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const at = (n: number): string => (n < lines.length ? (lines[n] ?? "") : "");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = at(i);

    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !at(i).trim().startsWith("```")) {
        body.push(at(i));
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, body: body.join("\n") });
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1]!.length,
        text: heading[2] ?? "",
      });
      i++;
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(at(i))) {
        quote.push(at(i).replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: { checked: boolean | null; text: string }[] = [];
      while (i < lines.length) {
        const check = at(i).match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/);
        if (check) {
          items.push({
            checked: check[1]!.toLowerCase() === "x",
            text: check[2] ?? "",
          });
          i++;
          continue;
        }
        const u = at(i).match(/^\s*[-*+]\s+(.*)$/);
        const o = at(i).match(/^\s*\d+[.)]\s+(.*)$/);
        if (u) {
          items.push({ checked: null, text: u[1] ?? "" });
          i++;
          continue;
        }
        if (o) {
          items.push({ checked: null, text: o[1] ?? "" });
          i++;
          continue;
        }
        break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para: string[] = [line.trim()];
    i++;
    while (
      i < lines.length &&
      at(i).trim() &&
      !/^\s*(#{1,6})\s+/.test(at(i)) &&
      !/^\s*>\s?/.test(at(i)) &&
      !/^\s*[-*+]\s+/.test(at(i)) &&
      !/^\s*\d+[.)]\s+/.test(at(i)) &&
      !at(i).trim().startsWith("```") &&
      !/^\s*(---+|\*\*\*+|___+)\s*$/.test(at(i))
    ) {
      para.push(at(i).trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  if (blocks.length === 0) {
    return <span className="text-muted-foreground">nota vazia.</span>;
  }

  return (
    <div className="space-y-2 text-sm leading-7">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "code":
            return <CodeBlock key={i} lang={block.lang} body={block.body} />;
          case "heading":
            return (
              <div
                key={i}
                className={
                  block.level === 1
                    ? "mt-3 text-lg font-bold text-note"
                    : block.level === 2
                      ? "mt-2 text-base font-bold text-note"
                      : "mt-2 text-sm font-bold text-note"
                }
              >
                <Inline text={block.text} />
              </div>
            );
          case "list":
            return (
              <ul key={i} className="space-y-1 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-1 shrink-0 text-muted-foreground">
                      {item.checked === null ? (
                        block.ordered ? (
                          `${j + 1}.`
                        ) : (
                          "›"
                        )
                      ) : item.checked ? (
                        <span className="text-neon">▣</span>
                      ) : (
                        <span>▢</span>
                      )}
                    </span>
                    <span className={item.checked ? "text-muted-foreground line-through" : ""}>
                      <Inline text={item.text} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-gold/60 pl-3 text-muted-foreground italic"
              >
                <Inline text={block.text} />
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="my-3 border-border" />;
          case "paragraph":
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

export function previewText(text: string): string {
  return (
    text
      .split("\n")
      .map((s) =>
        s
          .replace(/^#{1,6}\s+/, "")
          .replace(/^>\s?/, "")
          .trim(),
      )
      .find((s) => s.length > 0) ?? ""
  );
}
