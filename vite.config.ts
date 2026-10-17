import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
// biome-ignore lint/style/noNodejsImportProtocol: <explanation>
import manifest from "./manifest.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  return {
    plugins: [react(), crx({ manifest }), tailwindcss()],
    ...(isDevelopment && {
      server: {
        port: 5173,
        strictPort: true,
        hmr: {
          port: 5173,
        },
      },
    }),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
