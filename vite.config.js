import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePrerender from "vite-plugin-prerender";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Renderer = vitePrerender.PuppeteerRenderer;
const localChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === "win32" ? localChromePath : undefined);
const shouldPrerender = process.env.SKIP_PRERENDER !== "true";

export default defineConfig({
  plugins: [
    react(),
    shouldPrerender &&
      vitePrerender({
        staticDir: path.join(__dirname, "dist"),
        routes: ["/", "/menu", "/branches", "/contact", "/404"],
        renderer: new Renderer({
          headless: true,
          executablePath,
          inject: { isPrerender: true },
          maxConcurrentRoutes: 1,
          renderAfterTime: 2000,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }),
      }),
  ].filter(Boolean),
  server: {
    proxy: {
      "/__/auth": {
        target: "https://santafi.firebaseapp.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase")) return "firebase";
          if (id.includes("framer-motion")) return "framer-motion";
          if (id.includes("react-router")) return "router";
          if (id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
        },
      },
    },
  },
});
