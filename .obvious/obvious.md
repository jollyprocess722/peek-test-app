# peek-test-app

Tiny **Vite 6 + vanilla JS** single-page app — a dogfood target for peek.dev JIT
previews (trigger a preview from any branch or SHA). No framework, no backend of
its own; the dev server proxies `/api` to an optional sibling service.

## Stack

| Layer | Value |
|---|---|
| Runtime | Node.js 20 (v20.20.2 verified); Bun 1.3.14 is the package manager (`bun.lock` present in worktree, untracked) |
| Build/dev server | Vite ^6.0.0 (resolved 6.4.3) |
| Framework | none — vanilla ES modules |
| Language | JavaScript (no TypeScript, no JSX) |
| External services | none required; optional `peek-test-api` on `127.0.0.1:5273` (separate repo, not part of this checkout) |
| Env vars | none required — no `.env.example`, no `process.env` usage in source |
| Docker | not used |

## Commands

Run from repo root:

```bash
bun install        # install dependencies (single devDep: vite ^6)
bun run dev        # dev server -> http://localhost:5173 (binds 0.0.0.0, allowedHosts on)
bun run build      # production build -> dist/ (verified: 3 modules, ~2.1 kB JS)
bun run preview    # serve dist/ on port 4173 (declared in vite.config.js; not exercised this run)
```

`npm install` / `npm run dev` also work (Node 20 present). There are **no lint,
typecheck, or test scripts** in `package.json` — do not claim coverage that does
not exist.

## Ports

| Port | Purpose | Status |
|---|---|---|
| 5173 | Vite dev server (`server.port`) | verified live during onboarding |
| 4173 | Vite preview of production build (`preview.port`) | declared in config; TODO(confirm) if you depend on it |
| 5273 | `peek-test-api` proxy target (offset port 5173 + 100) | not present in this checkout — see behavior note |

## Codebase map

Tiny repo (single top-level source dir, no sub-apps) — map inlined here per the
onboarding contract instead of a separate `codebase-map.md`.

| Path | Purpose |
|---|---|
| `index.html` | Single-page shell: `#app` mount point + module script tag |
| `src/main.js` | Entire app logic: renders heading + API status card; `fetch('/api/hello')`; green "Mounted API" card on success, amber "unavailable" card on failure (graceful degradation) |
| `vite.config.js` | Dev/preview server config (host, ports, allowedHosts) + `/api` proxy to `http://127.0.0.1:5273` |
| `package.json` | Scripts: dev / build / preview; single devDependency `vite ^6.0.0` |
| `README.md` | Repo purpose + mount-verification notes |
| `dist/` | Build output (untracked — repo has no `.gitignore`) |

## Behavior note: /api proxy (two-repo wiring)

`vite.config.js` proxies `/api` to `http://127.0.0.1:5273` — the mounted
`peek-test-api` repo in two-repo preview setups. In this single-repo checkout
that target is down, which is **expected**: `/api/hello` returns HTTP 500
(`ECONNREFUSED 127.0.0.1:5273`) and the UI shows an amber "Mounted API:
unavailable" card. `/` stays healthy. Do not treat the 500 on `/api/hello` as a
broken dev stack.

## Local Verification Summary

Recorded from the onboarding run (2026-09-17, sandbox `cmp_gHR9WqGP`):

- **Dependencies:** `bun install` clean — 15 installs across 65 packages, no changes; `vite/6.4.3` verified. (Pre-seeded `node_modules` was root-owned; required `sudo chown -R user:user node_modules bun.lock` first.)
- **Dev server:** `bun run dev` under tmux session `vite-dev` → `VITE v6.4.3 ready in 161 ms`; port **5173** parsed from startup output and confirmed listening.
- **Primary flow (browser automation, headless Chromium + Playwright):**
  - `GET /` → HTTP 200; `<h1>Hello from peek-test-app</h1>` rendered
  - API card rendered as "Mounted API: unavailable — Error: HTTP 500" (expected single-repo degradation)
  - Console: `[vite] connecting… / connected.` plus only the expected 500 resource error; no page errors
  - Screenshot: `/tmp/pw/peek-home.png` (900×600 PNG, 20.5 kB)
- **HTTP-level checks:** `/` → 200 (318-byte shell); `/src/main.js` → 200 (8.6 kB transformed module); `/api/hello` → 500 ECONNREFUSED (documented degradation)
- **Production build:** `bun run build` → 3 modules transformed, `dist/index.html` + `dist/assets/index-*.js`, built in 88 ms
- **Lint/typecheck/tests:** none configured in this repo — nothing to run
- **dev_stack_healthy: true**

## Sandbox snapshot

- **Snapshot ID:** `31zeusvu57vexc6thfxo:default` (E2B template — restorable snapshot of sandbox `cmp_gHR9WqGP`, sandboxId `il0dip2jzsdhnrad5801a`)
- **Built at:** 2026-09-17T11:46:08.136Z (ISO-8601)
- **Captured state:** dependencies installed; Vite dev server running on port 5173 in tmux session `vite-dev`; Playwright/Chromium evidence tooling under `/tmp/pw` (incl. screenshot `peek-home.png`)

## Conventions / gotchas

- The repo has **no `.gitignore`**: `bun.lock`, `node_modules/`, `dist/` are untracked. Stage files explicitly (e.g. `git add .obvious`); never `git add -A`.
- `host: true` + `allowedHosts: true` are already set in `vite.config.js` (needed for preview-hostname access).
- Default branch: `main`. GitHub enables merge-commit, squash, and rebase; squash is the preferred default for setup PRs.
