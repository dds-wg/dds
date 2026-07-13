import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clusteringApi = env.CLUSTERING_API_URL ?? "http://localhost:8000";
  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      host: "0.0.0.0",
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": clusteringApi,
      },
    },
  };
});
