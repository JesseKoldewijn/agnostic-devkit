import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = resolve(__dirname, "../../../../dist");
const isCoverage = process.env.CI_COVERAGE === "true";
const projectRoot = resolve(__dirname, "../../../../");
const coverageDir = resolve(projectRoot, "coverage/playwright");

/**
 * Coverage collector that accumulates Istanbul coverage data throughout test execution.
 * This solves the problem of losing coverage when pages close before final collection.
 */
class CoverageCollector {
	private accumulatedCoverage: Record<string, any> = {};
	private collectionCount = 0;

	/**
	 * Merge new coverage data into accumulated coverage.
	 * Istanbul coverage format uses file paths as keys with coverage maps as values.
	 */
	merge(newCoverage: Record<string, any>): void {
		if (!newCoverage || typeof newCoverage !== "object") return;

		for (const [filePath, fileCoverage] of Object.entries(newCoverage)) {
			if (!fileCoverage || typeof fileCoverage !== "object") continue;

			if (!this.accumulatedCoverage[filePath]) {
				// First time seeing this file - just copy
				this.accumulatedCoverage[filePath] = JSON.parse(JSON.stringify(fileCoverage));
			} else {
				// Merge coverage data for this file
				this.mergeSingleFile(filePath, fileCoverage);
			}
		}
		this.collectionCount++;
	}

	/**
	 * Merge coverage for a single file.
	 * Istanbul stores hit counts in objects like { "0": 5, "1": 3 } for statements, branches, functions.
	 */
	private mergeSingleFile(filePath: string, newCoverage: any): void {
		const existing = this.accumulatedCoverage[filePath];

		// Merge statement hits (s)
		if (newCoverage.s && existing.s) {
			for (const key in newCoverage.s) {
				existing.s[key] = (existing.s[key] || 0) + (newCoverage.s[key] || 0);
			}
		}

		// Merge function hits (f)
		if (newCoverage.f && existing.f) {
			for (const key in newCoverage.f) {
				existing.f[key] = (existing.f[key] || 0) + (newCoverage.f[key] || 0);
			}
		}

		// Merge branch hits (b) - branches are arrays of hit counts
		if (newCoverage.b && existing.b) {
			for (const key in newCoverage.b) {
				if (!existing.b[key]) {
					existing.b[key] = [...newCoverage.b[key]];
				} else {
					for (let i = 0; i < newCoverage.b[key].length; i++) {
						existing.b[key][i] = (existing.b[key][i] || 0) + (newCoverage.b[key][i] || 0);
					}
				}
			}
		}
	}

	/**
	 * Get the accumulated coverage data.
	 */
	getCoverage(): Record<string, any> {
		return this.accumulatedCoverage;
	}

	/**
	 * Get statistics about collection.
	 */
	getStats(): { files: number; collections: number } {
		return {
			files: Object.keys(this.accumulatedCoverage).length,
			collections: this.collectionCount,
		};
	}

	/**
	 * Save coverage to a file.
	 */
	save(filename: string): void {
		const stats = this.getStats();
		if (stats.files > 0) {
			writeFileSync(filename, JSON.stringify(this.accumulatedCoverage, null, 2), "utf-8");
			console.log(`Saved coverage: ${stats.files} files from ${stats.collections} collections → ${filename}`);
		} else {
			writeFileSync(
				filename,
				JSON.stringify({
					message: "No coverage data collected",
					collections: stats.collections,
				}, null, 2),
				"utf-8"
			);
			console.warn(`No coverage data collected after ${stats.collections} collection attempts`);
		}
	}
}

/**
 * Extract Istanbul coverage from a page.
 */
async function extractPageCoverage(page: Page): Promise<Record<string, any> | null> {
	try {
		return await page.evaluate(() => {
			// @ts-ignore - __coverage__ is injected by Istanbul/vite-plugin-istanbul
			const cov = (window as any).__coverage__;
			if (cov && typeof cov === "object") {
				return cov;
			}
			// @ts-ignore - fallback to globalThis
			if (typeof (globalThis as any).__coverage__ === "object") {
				return (globalThis as any).__coverage__;
			}
			return null;
		});
	} catch {
		return null;
	}
}

/**
 * Extract Istanbul coverage from a service worker.
 */
async function extractServiceWorkerCoverage(worker: any): Promise<Record<string, any> | null> {
	try {
		return await worker.evaluate(() => {
			// @ts-ignore - __coverage__ is injected by Istanbul
			const cov = (self as any).__coverage__;
			if (cov && typeof cov === "object") {
				return cov;
			}
			// @ts-ignore - fallback to globalThis
			if (typeof (globalThis as any).__coverage__ === "object") {
				return (globalThis as any).__coverage__;
			}
			return null;
		});
	} catch {
		return null;
	}
}

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

		// Create coverage collector for this test run
		const collector = new CoverageCollector();

		// Set up coverage collection if enabled
		if (isCoverage) {
			// Ensure coverage directory exists
			if (!existsSync(coverageDir)) {
				mkdirSync(coverageDir, { recursive: true });
			}

			/**
			 * Collect coverage from a page and merge into accumulator.
			 * Called on navigation and before page close.
			 */
			const collectFromPage = async (page: Page, reason: string) => {
				const coverage = await extractPageCoverage(page);
				if (coverage) {
					collector.merge(coverage);
					console.log(`[Coverage] Collected from page (${reason}): ${page.url().slice(0, 60)}...`);
				}
			};

			/**
			 * Collect coverage from all service workers.
			 */
			const collectFromServiceWorkers = async () => {
				for (const worker of context.serviceWorkers()) {
					const coverage = await extractServiceWorkerCoverage(worker);
					if (coverage) {
						collector.merge(coverage);
						console.log(`[Coverage] Collected from service worker`);
					}
				}
			};

			// Set up page event listeners for incremental collection
			const setupPageListeners = (page: Page) => {
				// Collect before navigation (page content changes)
				page.on("framenavigated", async (frame) => {
					if (frame === page.mainFrame()) {
						// Small delay to let any final code execute
						await new Promise((r) => setTimeout(r, 100));
						await collectFromPage(page, "navigation");
					}
				});

				// Collect before page closes
				page.on("close", async () => {
					// Page is closing - try to collect what we can
					// Note: This may not always work if page is already gone
					try {
						await collectFromPage(page, "close");
					} catch {
						// Page already closed, coverage lost
					}
				});
			};

			// Set up listeners for existing pages
			for (const page of context.pages()) {
				setupPageListeners(page);
			}

			// Set up listeners for new pages
			context.on("page", (page) => {
				setupPageListeners(page);
				// Collect initial coverage after page loads
				page.on("load", async () => {
					await new Promise((r) => setTimeout(r, 500));
					await collectFromPage(page, "load");
				});
			});

			// Periodically collect from service workers (they can be idle)
			const swCollectionInterval = setInterval(async () => {
				await collectFromServiceWorkers();
			}, 5000);

			// Store cleanup function on context for later
			(context as any).__coverageCleanup = () => {
				clearInterval(swCollectionInterval);
			};
			(context as any).__coverageCollector = collector;
			(context as any).__collectFromPage = collectFromPage;
			(context as any).__collectFromServiceWorkers = collectFromServiceWorkers;
		}

		await use(context);

		// Final coverage collection before closing context
		if (isCoverage) {
			// Clean up interval
			(context as any).__coverageCleanup?.();

			// Wait for any pending operations
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Final collection from all open pages
			const collectFromPage = (context as any).__collectFromPage;
			const collectFromServiceWorkers = (context as any).__collectFromServiceWorkers;

			if (collectFromPage) {
				for (const page of context.pages()) {
					try {
						await collectFromPage(page, "final");
					} catch {
						// Page may have closed
					}
				}
			}

			// Final collection from service workers
			if (collectFromServiceWorkers) {
				await collectFromServiceWorkers();
			}

			// Save accumulated coverage
			const timestamp = process.hrtime.bigint().toString();
			const testName = process.env.TEST_NAME || "test";
			const randomSuffix = randomBytes(4).toString("hex");
			const coverageFile = resolve(
				coverageDir,
				`coverage-${testName}-${process.pid}-${timestamp}-${randomSuffix}.json`
			);

			collector.save(coverageFile);
		}

		await context.close();
	},

	extensionId: async ({ extensionContext }, use) => {
		// For manifest v3: get extension ID from service worker
		// Following official Playwright pattern
		let serviceWorker = extensionContext.serviceWorkers()[0];

		if (!serviceWorker) {
			// Wait for service worker with timeout to avoid hanging
			try {
				serviceWorker = await Promise.race([
					extensionContext.waitForEvent("serviceworker"),
					new Promise<never>((_, reject) =>
						setTimeout(
							() =>
								reject(
									new Error(
										"Timeout waiting for service worker"
									)
								),
							10000
						)
					),
				]);
			} catch (error: any) {
				// If we timeout, try one more time to get existing service workers
				// (it may have registered while we were waiting)
				const workers = extensionContext.serviceWorkers();
				if (workers.length > 0) {
					serviceWorker = workers[0];
				} else {
					throw new Error(
						`Failed to get extension service worker: ${error.message}`
					);
				}
			}
		}

		const extensionId = serviceWorker.url().split("/")[2];
		if (!extensionId) {
			throw new Error(
				`Could not extract extension ID from service worker URL: ${serviceWorker.url()}`
			);
		}
		await use(extensionId);
	},
});

// Re-export expect for convenience
export { expect } from "@playwright/test";

/**
 * Helper to manually trigger coverage collection from a page.
 * Useful for collecting coverage at specific points in a test.
 */
export async function collectCoverage(context: BrowserContext, page: Page, reason: string = "manual"): Promise<void> {
	if (!isCoverage) return;

	const collectFromPage = (context as any).__collectFromPage;
	if (collectFromPage) {
		await collectFromPage(page, reason);
	}
}

/**
 * Helper to collect coverage from all pages and service workers.
 * Call this before critical operations that might lose coverage.
 */
export async function collectAllCoverage(context: BrowserContext): Promise<void> {
	if (!isCoverage) return;

	const collectFromPage = (context as any).__collectFromPage;
	const collectFromServiceWorkers = (context as any).__collectFromServiceWorkers;

	if (collectFromPage) {
		for (const page of context.pages()) {
			try {
				await collectFromPage(page, "manual-all");
			} catch {
				// Page may have issues
			}
		}
	}

	if (collectFromServiceWorkers) {
		await collectFromServiceWorkers();
	}
}
