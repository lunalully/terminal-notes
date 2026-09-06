# NO EXCUSES — guia para agentes

Este é um app de notas em estilo terminal (hacker/cyberpunk minimalista), feito com
TanStack Start + React + Tailwind CSS v4. Os dados ficam 100% no `localStorage`
(não há backend).

## Comandos

- `npm run dev` — servidor de desenvolvimento (porta 8080)
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npx tsc --noEmit` — checagem de tipos

## Estrutura

- `src/lib/store.ts` — modelo de dados (notas, categorias) + persistência em localStorage
- `src/lib/markdown.tsx` — renderizador markdown com botão copiar código
- `src/components/terminal.tsx` — primitivos de UI (Shell, Menu, badges, busca)
- `src/components/notes.tsx` — cartões de nota com gestos e ordenação
- `src/routes/*` — rotas (biblioteca, categoria, editor)

## Regras

- Não usar backend; tudo é local.
- Manter a estética terminal: fundo preto, azul neon, amarelo dourado, fonte monoespaçada.
- Não fazer `force push` nem reescrever histórico publicado.