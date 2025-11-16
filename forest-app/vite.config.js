import { defineConfig } from "vite";

export default defineConfig({
    root: ".",
    publicDir: "public",
    build: {
        outDir: "dist",
        sourcemap: true,
        rollupOptions: {
            input: {
                main: "./index.html",
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    resolve: {
        alias: {
            "@": "/src",
            "@lib": "/src/../src/lib",
        },
    },
    optimizeDeps: {
        include: ["three"],
    },
    esbuild: {
        target: "es2022",
    },
});
