import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      // Multi-page: the original screen-time board (index) + the family hub (family).
      input: {
        index: "index.html",
        family: "family.html"
      },
      output: {
        // Hashed names avoid collisions between the two entries' shared chunks.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
