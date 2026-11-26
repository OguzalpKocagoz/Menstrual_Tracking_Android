import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Yalnızca saf modüller test edilir (src/core, src/lib/rules);
// React Native ve SQLite Node'da çalışmaz.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
