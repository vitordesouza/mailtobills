import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": root,
      "@mailtobills/domain": `${repoRoot}/packages/domain/src/index.ts`,
      "server-only": `${root}/test/server-only.ts`,
    },
  },
});
