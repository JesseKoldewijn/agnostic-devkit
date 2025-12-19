import { defineConfig } from "wxt";
import { resolve } from "node:path";
import solid from "@wxt-dev/module-solid";
import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";

// Check if we're running in coverage mode
const isCoverage = process.env.CI_COVERAGE === "true";

export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-solid"],
	manifest: {
		name: "Agnostic Devkit for Google Chrome",
		description: "A platform agnostic devkit for web development",
		permissions: [
			"scripting",
			"storage",
			"activeTab",
			"tabs",
			"notifications",
			"sidePanel",
			"cookies",
		],
		host_permissions: ["*://*/*"],
		web_accessible_resources: [
			{
				resources: ["*"],
				matches: ["<all_urls>"],
			},
		],
		side_panel: {
			default_path: "sidepanel.html",
		},
		options_page: "options.html",
	},
	imports: false,
	vite: () => ({
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
			},
		},
		plugins: [
			tailwindcss(),
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
		build: {
			// Generate source maps for coverage
			sourcemap: isCoverage ? "inline" : false,
		},
	}),
});

