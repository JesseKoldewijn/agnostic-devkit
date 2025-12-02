import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "node:path";

export default defineConfig({
	plugins: [solidPlugin()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/e2e/**",
			"**/*.spec.ts",
		],
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage/vitest",
			reporter: ["text", "json", "json-summary", "html", "lcov"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/dist/",
			],
		},
	},
});
