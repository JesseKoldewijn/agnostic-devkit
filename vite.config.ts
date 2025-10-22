import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import webExtension from "vite-plugin-web-extension";
import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";
import { resolve } from "node:path";

// Check if we're running in coverage mode
const isCoverage = process.env.CI_COVERAGE === "true";

export default defineConfig({
	plugins: [
		solidPlugin(),
		tailwindcss(),
		webExtension({
			manifest: "./src/manifest.json",
			watchFilePaths: ["src/**/*"],
		}),
		// Add Istanbul instrumentation for E2E coverage
		...(isCoverage
			? [
					istanbul({
						include: "src/**/*",
						exclude: ["node_modules", "src/test/**/*"],
						extension: [".ts", ".tsx"],
						requireEnv: false,
						forceBuildInstrument: true,
					}),
				]
			: []),
	],
	resolve: {
		alias: {
			"~": resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		// Generate source maps for coverage
		sourcemap: isCoverage ? "inline" : false,
	},
	publicDir: "public",
});
