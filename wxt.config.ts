import { execSync } from "node:child_process";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";
import { defineConfig } from "wxt";

// Check if we're running in coverage mode
const isCoverage = process.env.CI_COVERAGE === "true";

export default defineConfig({
	outDir: "build-output",
	webExt: {
		disabled: true,
	},
	imports: {
		addons: [],
	},
	manifest: async (env) => {
		const isProduction = env.mode === "production";
		const browserTarget = env.browser;

		const extensionEnv = process.env.EXTENSION_ENV;
		let nameSuffix = "";
		if (extensionEnv === "canary") {
			nameSuffix = " (Canary)";
		} else if (extensionEnv === "development" || !isProduction) {
			nameSuffix = " (Development)";
		}

		const prettyBrowserTarget = browserTarget.charAt(0).toUpperCase() + browserTarget.slice(1);
		const name = `Agnostic Devkit for ${prettyBrowserTarget}${nameSuffix}`;

		const isDevIcon = extensionEnv === "development" || extensionEnv === "canary" || !isProduction;

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
			icons: {
				16: isDevIcon ? "/icons/icon-16-red.png" : "/icons/icon-16.png",
				48: isDevIcon ? "/icons/icon-48-red.png" : "/icons/icon-48.png",
				128: isDevIcon ? "/icons/icon-128-red.png" : "/icons/icon-128.png",
			},
		};
	},
	modules: ["@wxt-dev/module-solid"],
	srcDir: "src",
	hooks: {
		"build:done": (wxt) => {
			const isWsl = process.env.WSL_DISTRO_NAME !== undefined;
			if (isWsl) {
				// Small delay to ensure it logs after the "Load ..." message
				setTimeout(() => {
					try {
						const winPath = execSync(`wslpath -w "${wxt.config.outDir}"`).toString().trim();
						wxt.logger.info(`Extension output (Windows): ${winPath}`);
						execSync(`echo -n "${winPath}" | clip.exe`);
						wxt.logger.success("Copied to Windows clipboard!");
					} catch {
						wxt.logger.warn("Failed to copy extension path to Windows clipboard.");
					}
				}, 100);
			}
		},
	},
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
