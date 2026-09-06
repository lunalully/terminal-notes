# NO EXCUSES

Aplicativo de anotações em estilo **terminal hacker**, feito para estudo de
Cybersegurança e programação. Abra o app e saia escrevendo comandos e anotações
em poucos segundos — praticamente sem cliques.

Fundo preto, azul neon, amarelo dourado, fonte monoespaçada. Minimalista, rápido
e 100% offline: tudo fica salvo no `localStorage` do navegador (sem backend).

## Funcionalidades

### Captura instantânea

- **Nova nota em um toque** — a nota já nasce em modo de edição, com o cursor pronto.
- **Autosave** — salva sozinho enquanto você digita (status `salvando...` / `salvo ✓`).
- **Enter cria a próxima nota** — aperte Enter no título (ou `Ctrl/Cmd+Enter` no
  texto) e outra nota é criada na sequência, sem voltar para a lista.

### Organização

- **Categorias coloridas** com ícone: Cybersegurança, Linux, Programação C, Go,
  Pentest, Cheatsheet, Estudos e Pessoal (dá para criar novas e trocar a cor).
- **Favoritos** ⭐ e **fixadas** 📌 (fixadas sempre no topo).
- **Ordenação**: mais recentes, mais antigas, alfabética, por categoria ou favoritas.
- **Busca instantânea** por título, conteúdo, tag ou comando.

### Editor

- Sem botão "editar" — abre já editável.
- **Markdown**: títulos, listas, checkboxes (`- [ ]`), blocos de código, `código
  inline` e citações. Blocos de código têm botão **copiar**.
- **Toolbar** acima do teclado: `# − [ ] </> * >`.
- Modo **ler** para pré-visualizar a nota renderizada.
- **Templates rápidos**: Pentest, Linux e Aula.

### Mobile

- **Deslizar para a direita** → favoritar / fixar.
- **Deslizar para a esquerda** → excluir (com confirmação).
- **Pressionar e segurar** (ou menu ⋯) → duplicar, mover categoria, compartilhar, copiar.

### PWA

Instalável no desktop e no celular, funciona offline depois de carregado
(Service Worker + manifest). Os dados continuam disponíveis sem internet.

## Guia de uso

- Na tela inicial, use a **busca**, os **chips de categoria** e **Nova nota**.
- Toque em uma nota para abrir e já digitar. Enter cria a próxima.
- Use a engrenagem para **exportar/importar backup** (JSON).
- A engrenagem da categoria permite renomear, trocar a cor ou excluir.

## Desenvolvimento

Requer Node.js (ou Bun). Instale e rode:

```sh
npm install   # ou: bun install
npm run dev   # http://localhost:8080
```

> A estética segue um terminal: `"texto"` fica amarelo, `(parênteses)` fica azul
> e `código` é destacado — para manter a leitura agradável de comandos e trechos.