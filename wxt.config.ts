import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";
import { defineConfig } from "wxt";

// Check if we're running in coverage mode
const isCoverage = process.env.CI_COVERAGE === "true";

export default defineConfig({
	outDir: "build-output",
	imports: {
		addons: [],
	},
	manifest: async (env) => {
		const isProduction = env.mode === "production";
		const browserTarget = env.browser;

		const prettyBrowserTarget = browserTarget.charAt(0).toUpperCase() + browserTarget.slice(1);
		const name = `Agnostic Devkit for ${prettyBrowserTarget}${isProduction ? "" : " (Development)"}`;

		return {
			description: "A platform agnostic devkit for web development",
			host_permissions: ["*://*/*"],
			name,
			options_page: "settings.html",
			permissions: [
				"scripting",
				"storage",
				"activeTab",
				"tabs",
				"notifications",
				"sidePanel",
				"cookies",
			],
			side_panel: {
				default_path: "sidepanel.html",
			},
			web_accessible_resources: [
				{
					matches: ["<all_urls>"],
					resources: ["*"],
				},
			],
		};
	},
	modules: ["@wxt-dev/module-solid"],
	srcDir: "src",
	vite: () => ({
		build: {
			// Generate source maps for coverage
			sourcemap: isCoverage ? "inline" : false,
		},
		plugins: [
			tailwindcss(),
			// Add Istanbul instrumentation for E2E coverage
			...(isCoverage
				? [
						istanbul({
							exclude: ["node_modules", "src/test/**/*"],
							extension: [".ts", ".tsx"],
							forceBuildInstrument: true,
							include: "src/**/*",
							requireEnv: false,
						}),
					]
				: []),
		],
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
			},
		},
	}),
});
