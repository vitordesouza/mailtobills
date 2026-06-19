import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
  resolve: {
    alias: {
      "@mailtobills/domain": `${repoRoot}/packages/domain/src/index.ts`,
    },
  },
  ssr: {
    noExternal: ["convex-test"],
  },
});
