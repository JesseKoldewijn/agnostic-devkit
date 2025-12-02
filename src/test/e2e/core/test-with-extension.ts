import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = resolve(__dirname, "../../../../dist");
const isCoverage = process.env.CI_COVERAGE === "true";
const projectRoot = resolve(__dirname, "../../../../");
const coverageDir = resolve(projectRoot, "coverage/playwright");

// Extend the base test with extension context and extension ID
// Following official Playwright pattern: https://playwright.dev/docs/chrome-extensions
export const test = base.extend<{
	extensionContext: BrowserContext;
	extensionId: string;
}>({
	// oxlint-disable-next-line no-empty-pattern
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

		// Set up coverage collection if enabled
		if (isCoverage) {
			// Ensure coverage directory exists
			if (!existsSync(coverageDir)) {
				mkdirSync(coverageDir, { recursive: true });
			}

			// Set up coverage collection for all pages (existing and future)
			const startCoverageOnPage = async (page: any) => {
				try {
					// Start CDP coverage collection
					await page.coverage.startJSCoverage({
						resetOnNavigation: false,
					});
				} catch {
					// Coverage might not be available, ignore
				}
			};

			// Start coverage on existing pages
			for (const page of context.pages()) {
				await startCoverageOnPage(page);
			}

			// Listen for new pages and start coverage on them
			context.on("page", async (page) => {
				await startCoverageOnPage(page);
			});
		}

		await use(context);

		// Collect coverage after tests complete, before closing context
		if (isCoverage) {
			// Wait a bit for coverage to be populated
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Collect coverage from all pages in the context
			const pages = context.pages();
			let allCoverage: Record<string, any> = {};

			for (const page of pages) {
				try {
					// Try to get Istanbul coverage from window.__coverage__
					// This is the format injected by vite-plugin-istanbul
					const istanbulCoverage = await page
						.evaluate(() => {
							// @ts-ignore - __coverage__ is injected by Istanbul
							const cov = (window as any).__coverage__;
							if (
								!cov &&
								typeof (globalThis as any).__coverage__ !==
									"undefined"
							) {
								return (globalThis as any).__coverage__;
							}
							return cov;
						})
						.catch(() => null);

					if (
						istanbulCoverage &&
						typeof istanbulCoverage === "object"
					) {
						// Merge Istanbul coverage objects
						allCoverage = { ...allCoverage, ...istanbulCoverage };
					}

					// Stop CDP coverage (cleanup)
					try {
						await page.coverage.stopJSCoverage();
					} catch {
						// Ignore if coverage wasn't started
					}
				} catch (error) {
					// Coverage might not be available on this page
					console.warn(
						"Failed to collect coverage from page:",
						error
					);
				}
			}

			// Also check service workers for coverage
			for (const serviceWorker of context.serviceWorkers()) {
				try {
					const coverage = await serviceWorker
						.evaluate(() => {
							// @ts-ignore - __coverage__ is injected by Istanbul
							const cov = (self as any).__coverage__;
							if (
								!cov &&
								typeof (globalThis as any).__coverage__ !==
									"undefined"
							) {
								return (globalThis as any).__coverage__;
							}
							return cov;
						})
						.catch(() => null);

					if (coverage && typeof coverage === "object") {
						allCoverage = { ...allCoverage, ...coverage };
					}
				} catch (error) {
					// Coverage might not be available in service worker
					console.warn(
						"Failed to collect coverage from service worker:",
						error
					);
				}
			}

			// Save coverage data
			const timestamp = Date.now();
			const testName = process.env.TEST_NAME || "test";
			const coverageFile = resolve(
				coverageDir,
				`coverage-${testName}-${timestamp}.json`
			);

			if (Object.keys(allCoverage).length > 0) {
				writeFileSync(
					coverageFile,
					JSON.stringify(allCoverage, null, 2),
					"utf-8"
				);
				console.log(`Saved coverage data to ${coverageFile}`);
			} else {
				// Save empty file for debugging
				writeFileSync(
					coverageFile,
					JSON.stringify(
						{
							message: "No coverage data collected",
							pages: pages.length,
						},
						null,
						2
					),
					"utf-8"
				);
				console.warn(
					`No coverage data collected. Pages: ${pages.length}`
				);
			}
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
});

// Re-export expect for convenience
export { expect } from "@playwright/test";
