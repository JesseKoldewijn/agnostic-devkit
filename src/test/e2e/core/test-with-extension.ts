import {
	test as base,
	chromium,
	type BrowserContext,
	type Page,
} from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = resolve(__dirname, "../../../../dist");
const coverageDir = resolve(__dirname, "../../../../coverage/playwright");

// Check if coverage is enabled
const isCoverage = process.env.CI_COVERAGE === "true";

// Helper to collect Istanbul coverage from a page
async function collectCoverage(page: Page, testName: string): Promise<void> {
	if (!isCoverage) return;

	try {
		// Get Istanbul coverage from the page
		const coverage = await page.evaluate(() => {
			// @ts-ignore - Istanbul adds __coverage__ to window
			return window.__coverage__ || null;
		});

		if (coverage) {
			// Ensure coverage directory exists
			if (!existsSync(coverageDir)) {
				mkdirSync(coverageDir, { recursive: true });
			}

			// Write coverage data
			const fileName = `coverage-${testName.replace(
				/[^a-z0-9]/gi,
				"-"
			)}-${Date.now()}.json`;
			const filePath = resolve(coverageDir, fileName);
			writeFileSync(filePath, JSON.stringify(coverage, null, 2));
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		// Silently ignore coverage collection errors
	}
}

// Helper to collect coverage from service worker
async function collectServiceWorkerCoverage(
	context: BrowserContext
): Promise<void> {
	if (!isCoverage) return;

	try {
		const serviceWorkers = context.serviceWorkers();
		for (const sw of serviceWorkers) {
			const coverage = await sw.evaluate(() => {
				// @ts-ignore - Istanbul adds __coverage__ to self
				return self.__coverage__ || null;
			});

			if (coverage) {
				if (!existsSync(coverageDir)) {
					mkdirSync(coverageDir, { recursive: true });
				}

				const fileName = `coverage-service-worker-${Date.now()}.json`;
				const filePath = resolve(coverageDir, fileName);
				writeFileSync(filePath, JSON.stringify(coverage, null, 2));
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		// Silently ignore coverage collection errors
	}
}

// Extend the base test with extension context and extension ID
// Following official Playwright pattern: https://playwright.dev/docs/chrome-extensions
export const test = base.extend<{
	extensionContext: BrowserContext;
	extensionId: string;
	collectPageCoverage: (page: Page, testName: string) => Promise<void>;
}>({
	// oxlint-disable-next-line no-empty-pattern
	extensionContext: async ({}, use, testInfo) => {
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
									"launchPersistentContext timeout - this may be a WSL issue. Try setting PLAYWRIGHT_EXTENSION_ID environment variable."
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
						`This may be a WSL compatibility issue. Consider using PLAYWRIGHT_EXTENSION_ID environment variable.`
				);
			}
			throw error;
		}

		await use(context);

		// Collect coverage from all pages before closing
		if (isCoverage) {
			const pages = context.pages();
			for (const page of pages) {
				await collectCoverage(page, testInfo.title);
			}
			await collectServiceWorkerCoverage(context);
		}

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

	// oxlint-disable-next-line no-empty-pattern
	collectPageCoverage: async ({}, use) => {
		await use(collectCoverage);
	},
});

// Re-export expect for convenience
export { expect } from "@playwright/test";
