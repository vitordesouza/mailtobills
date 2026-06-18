import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
  resolve: {
    alias: {
      "@mailtobills/types": `${repoRoot}/packages/types/src/index.ts`,
    },
  },
  ssr: {
    noExternal: ["convex-test"],
  },
});
