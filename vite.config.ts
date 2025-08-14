import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";

// Get git commit hash and build timestamp
const getGitHash = () => {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
};

const getBuildTimestamp = () => {
  return new Date().toISOString();
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __GIT_HASH__: JSON.stringify(getGitHash()),
    __BUILD_TIMESTAMP__: JSON.stringify(getBuildTimestamp()),
  },
});
