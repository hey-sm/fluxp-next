# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `packageManager` in `package.json`).

- `pnpm dev` — start Next.js dev server (Turbopack, root pinned in `next.config.ts`)
- `pnpm build` — production build (`next build`)
- `pnpm start` — run production build
- `pnpm lint` / `pnpm lint:fix` — lint with **oxlint** (config in `.oxlintrc.json`, not ESLint)
- `pnpm format` / `pnpm format:check` — format with **oxfmt** (config in `.oxfmtrc.json`)

There is no test runner configured.

## Stack

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui + Base UI + Supabase + Vercel AI SDK + IndexedDB (`idb`) + MDX. TypeScript strict mode, path alias `@/* -> ./*`.

## Architecture

The codebase is two largely independent feature areas (chat + blog) glued together by a shared `app/` shell.

### AI chat module

- **Server route**: `app/api/chat/route.ts` is the streaming chat endpoint, with `app/api/chat/summary/` for conversation summarization (long-context compression).
- **Provider CRUD**: `app/api/providers/` exposes provider config endpoints (`route.ts`, `[id]`, `test/`). Auth is gated server-side via `lib/server/admin-auth.ts`; runtime model assembly happens in `lib/server/provider-model.ts`.
- **Provider drivers**: `lib/ai/claude.ts` and `lib/ai/openai.ts` wrap `@ai-sdk/anthropic` / `@ai-sdk/openai`. Provider switching at the call site is done via `lib/provider-client.ts` + `lib/provider-config.ts`.
- **Persistence is browser-side**: `lib/db/` (`conversations.ts`, `messages.ts`, `conversation-memories.ts`, `index.ts`) is an IndexedDB layer (`idb`). Chat messages and conversation memories live in the user's browser, **not** Supabase.
- **Conversation memory / summarization**: `lib/chat/conversation-memory.ts` handles the rolling summary used to compress long contexts before sending to the model.
- **State**: `lib/store.ts` is a Zustand store. Pending/streaming message helpers in `lib/pending-message.ts` and `lib/message-content.ts`.
- **UI**: `components/chat/` (sidebar, message list, message input, model selector, provider settings sheet). Pages: `app/chat/page.tsx`, `app/chat/[id]/page.tsx`.

### Auth

Supabase Auth (email + password). Three client variants — keep them straight:

- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server (RSC / route handler) client via `@supabase/ssr`
- `lib/supabase/admin.ts` — service-role client; never import from client code

Login UI is embedded in the chat sidebar's settings sheet, not on a dedicated page.

### Blog module

The blog is **file-system driven** from `content/blog/**/*.mdx`. The non-obvious piece is the indexing layer in `lib/blog/mdx.ts`, which is the single source of truth — page components only consume its output. Key behaviors:

- Recursive scan of `content/blog`, skipping `assets/` directories. Only `.md` / `.mdx` are indexed.
- Slug generation pipeline: `pinyin-pro` for CJK → `NFKD` normalize → lowercase → strip → kebab. Final slug priority: `frontmatter.slug` → filename → `document`. Duplicate `segments` are auto-suffixed (`-2`, `-3`).
- Sort: numeric prefix aware (`01.foo.mdx` < `02.bar.mdx` < `10.baz.mdx`), with natural-sort fallback. Don't replace with plain string sort.
- Headings (`h2`/`h3`) are extracted server-side via remark AST (`remark-parse` + `remark-mdx` + `unist-util-visit` + `github-slugger`) so TOC ids match in-page anchors. Don't switch to client-side DOM scraping.
- `getBlogIndex` is wrapped in React `cache(...)` — all blog helpers (`getBlogNavigation`, `getBlogStaticParams`, `getBlogDocBySegments`, `getAdjacentBlogDocs`, `getBlogHomeData`) share one parsed index per render.
- Routing is `app/blog/[...segments]/page.tsx` (catch-all), not `[slug]`, because folder hierarchy maps directly to URL segments and powers the left nav grouping.
- MDX render chain in the detail page uses `next-mdx-remote/rsc` with `remark-gfm`, `rehype-slug`, `rehype-highlight` (highlight.js). The blog has 363+ static pages — `rehype-pretty-code` (Shiki) was previously used but caused per-page build timeouts during `generateStaticParams`, so it was replaced. Highlight.js theme styles live in `app/blog/blog.css` (light = `highlight.js/styles/github.css` import; dark = manual `.dark .hljs-*` overrides). Custom HTML overrides live in `components/blog/MdxComponents.tsx`.
- Hydration gotcha: a paragraph containing only an image is rendered as `div` (not `p`) because `BlogImage` outputs a `figure`, and `<p><figure/></p>` is invalid HTML. Preserve this when touching `BlogParagraph` / `BlogImage`.
- Layout split: `app/blog/layout.tsx` only fetches navigation data and hands it to `BlogShell` (server-side). Interactive nav lives in client components (`BlogShell` + `BlogSidebar`).

### Linting / formatting

- **oxlint**, not ESLint. Plugins enabled: `eslint`, `typescript`, `oxc`, `react`, `jsx-a11y`, `nextjs`, `import`. Categories: `correctness` and `suspicious` are errors; `perf` is warn.
- Per-file rule overrides exist for `components/ui/label.tsx` and `components/chat/ProviderSettingsSheet.tsx` — check `.oxlintrc.json` before touching a11y rules there.
- Formatter is **oxfmt** (`.oxfmtrc.json`).

## Conventions

- Path alias `@/` resolves to repo root, not `src/` (there is no `src/` directory).
- Server-only modules: anything under `lib/server/`, `lib/supabase/admin.ts`, `lib/supabase/server.ts`, and the `app/api/**` routes. Never import these from `components/` or client pages.
- IndexedDB code must be guarded for SSR (no `window`/`indexedDB` access during render).
