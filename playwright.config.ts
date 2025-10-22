import { defineConfig, devices } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "dist");

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

export default defineConfig({
	testDir: "./src/test/e2e",
	fullyParallel: true, // Disable parallel for extension tests to avoid conflicts
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// workers: 1, // Use single worker for extension tests?
	reporter: "html",
	ignoreSnapshots: true,
	// E2E tests run via Playwright with launchPersistentContext for extension support.
	use: {
		trace: "on-first-retry",
	},
	projects: [
		// {
		// 	name: "chromium",
		// 	use: { ...devices["Desktop Chrome"] },
		// },
		{
			name: "chromium-extension",
			use: {
				...devices["Desktop Chrome"],
				// Use launchOptions to load extension
				launchOptions: {
					args: [
						`--disable-extensions-except=${extensionPath}`,
						`--load-extension=${extensionPath}`,
					],
				},
			},
		},
	],
});
