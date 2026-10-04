import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(root, "src"),
      // Next swaps this marker package for an empty module on the server; tests run on the server side too.
      "server-only": path.join(root, "src/test/empty.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
