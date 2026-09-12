import { defineConfig } from 'vite'

// A14 two-repo wiring: the mounted API repo (peek-test-api) starts
// best-effort on the offset loopback port — primary entry port 5173 +
// 100 — so the composed app is served only when both repos are present.
// When peek-test-app runs as a single-repo preview the proxy target is
// down and /api/hello degrades to an "unavailable" card; / stays healthy.
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: { '/api': 'http://127.0.0.1:5273' },
  },
  preview: { host: true, port: 4173, allowedHosts: true },
})
