import { defineConfig } from "vite";

export default defineConfig({
  root: "src/board",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
  },
});
