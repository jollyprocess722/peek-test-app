---
name: local-dev
description: Bring up and verify the peek-test-app local dev stack (Bun + Vite 6, dev port 5173)
---

# local-dev — peek-test-app onboarding record

Recorded 2026-09-17 by the onboarding worker on sandbox `cmp_gHR9WqGP`
(snapshot `31zeusvu57vexc6thfxo:default`, built 2026-09-17T11:46:08.136Z).

## Verified bring-up sequence

1. **Fix pre-seeded deps (this image only):** the sandbox ships a root-owned
   `node_modules/` and `bun.lock`; `bun install` fails with `EEXIST` until you
   run `sudo chown -R user:user node_modules bun.lock`.
2. **Install:** `bun install` (Bun 1.3.14, Node 20) — 65 packages, vite ^6 only.
3. **Start dev server:**
   `tmux new-session -d -s vite-dev 'bun run dev > /tmp/vite-dev.log 2>&1'`
   Parse the port from the log (`VITE v6.4.3 ready` → **5173**); it binds
   0.0.0.0 with allowedHosts on. No lock files to clean up.
4. **Verify (expected results):**
   - `curl http://localhost:5173/` → 200, HTML shell with `#app` div
   - `/src/main.js` → 200, Vite-transformed module (~8.6 kB)
   - `/api/hello` → **500 ECONNREFUSED 127.0.0.1:5273 is EXPECTED**: the
     optional sibling repo `peek-test-api` is absent, and the UI degrades to an
     amber "Mounted API: unavailable" card. `/` stays healthy — do not chase
     this 500 as a stack failure.
5. **Browser evidence (tooling left in `/tmp/pw`):** Playwright 1.49.1 was
   installed outside the repo (`bun add playwright@1.49.1` in `/tmp/pw`).
   Chromium via `bun run playwright install chromium` — do NOT use
   `--with-deps` on this Debian trixie image (apt fails on ttf-unifont /
   ttf-ubuntu-font-family). Instead install libs directly:
   `sudo apt-get install -y libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 libatspi2.0-0t64 libdbus-1-3 libx11-6 libxcb1 libxext6 libexpat1`
   Then `bun run /tmp/pw/shot.mjs` → screenshot `/tmp/pw/peek-home.png` +
   console capture (h1 text, API card text).
6. **Build proof:** `bun run build` → `dist/` (3 modules). There are no
   lint / typecheck / test scripts in `package.json`.

## Gotchas

- No `.gitignore` in the repo: `bun.lock`, `node_modules/`, `dist/` appear as
  untracked. Stage explicitly (`git add .obvious`); never `git add -A`.
- Ports: dev 5173, preview 4173 (declared, not exercised), proxy target 5273
  (external sibling repo, optional).
- No environment variables required.
- Default branch `main`; merge-commit / squash / rebase all enabled on GitHub.

## Quick health check

```bash
curl -sf http://localhost:5173/ >/dev/null && echo "dev stack healthy"
```
