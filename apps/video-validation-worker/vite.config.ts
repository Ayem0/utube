import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  build: {
    target: "esnext",
    ssr: true,
    lib: {
      entry: "src/worker.ts",
      formats: ["es"],
    },
  },
});

export default config;
