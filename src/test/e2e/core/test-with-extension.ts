import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = resolve(__dirname, "../../../../dist");

// Extend the base test with extension context and extension ID
// Following official Playwright pattern: https://playwright.dev/docs/chrome-extensions
export const test = base.extend<{
	extensionContext: BrowserContext;
	extensionId: string;
}>({
	extensionContext: async ({}, use) => {
		// Use launchPersistentContext as per Playwright docs
		// Empty string creates a temporary directory automatically
		// Following official pattern: https://playwright.dev/docs/chrome-extensions
		let context: BrowserContext;

		try {
			// Allow headless mode to be controlled via environment variable
			// In WSL, sometimes headed mode works better
			const headless = process.env.PLAYWRIGHT_HEADED !== "true";

			context = await Promise.race([
				chromium.launchPersistentContext("", {
					headless: headless,
					channel: "chromium", // Use bundled Chromium (required for extensions)
					args: [
						`--disable-extensions-except=${pathToExtension}`,
						`--load-extension=${pathToExtension}`,
					],
				}),
				new Promise<never>((_, reject) =>
					setTimeout(
						() =>
							reject(
								new Error(
									"launchPersistentContext timeout - this may be a WSL issue."
								)
							),
						20000
					)
				),
			]);
		} catch (error: any) {
			if (error.message?.includes("timeout")) {
				throw new Error(
					`Failed to launch browser with extension. ${error.message}\n` +
						`Extension path: ${pathToExtension}\n` +
						`This may be a WSL compatibility issue.`
				);
			}
			throw error;
		}

		await use(context);
		await context.close();
	},

	extensionId: async ({ extensionContext }, use) => {
		// For manifest v3: get extension ID from service worker
		// Following official Playwright pattern
		let [serviceWorker] = extensionContext.serviceWorkers();
		if (!serviceWorker) {
			serviceWorker = await extensionContext.waitForEvent(
				"serviceworker"
			);
		}

		const extensionId = serviceWorker.url().split("/")[2];
		await use(extensionId);
	},
});

// Re-export expect for convenience
export { expect } from "@playwright/test";
