import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.{test,spec}.ts", "src/**/{test,spec}.ts"],
  },
});
