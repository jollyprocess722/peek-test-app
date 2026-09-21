import { defineConfig } from "vite"

// pr-bug probe: this config throws at load time — the PR itself is broken.
export default defineConfig(undefinedVar + 1 as any)
