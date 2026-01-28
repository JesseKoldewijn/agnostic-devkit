import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "build-output/chrome-mv3");

// Verify extension path exists (but don't build - expect it to be built already)
if (!existsSync(extensionPath)) {
	console.warn(`Warning: Extension path does not exist: ${extensionPath}`);
	console.warn("Please build the extension first with: yarn build");
}

// Verify manifest exists
const manifestPath = resolve(extensionPath, "manifest.json");
if (!existsSync(manifestPath)) {
	console.warn(`Warning: Manifest not found at: ${manifestPath}`);
	console.warn("Please build the extension first with: yarn build");
}

const isCI = Boolean(process.env.CI);
const isHeadless = !process.env.NO_HEADLESS;

const headless = isCI ? true : isHeadless;

export default defineConfig({
	testDir: "./src/test/e2e",
	fullyParallel: true,
	reporter: "html",
	ignoreSnapshots: true,
	// E2E tests run via Playwright with launchPersistentContext for extension support.
	use: {
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium-extension",
			use: {
				...devices["Desktop Chrome"],
				// Use launchOptions to load extension
				launchOptions: {
					args: [
						`--disable-extensions-except=${extensionPath}`,
						`--load-extension=${extensionPath}`,
						...(headless ? ["--headless=new"] : []),
					].filter(Boolean),
				},
			},
		},
	],
});
