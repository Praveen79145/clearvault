import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,          // allow the e2b preview host
    proxy: {
      // Browser calls stay same-origin; Vite forwards them to the Express API
      "/api": { target: "http://127.0.0.1:4000", changeOrigin: true },
    },
  },
});
