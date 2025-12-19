import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "../../../../.output/chrome-mv3");

const isCoverage = process.env.CI_COVERAGE === "true";
const projectRoot = resolve(__dirname, "../../../../");
const coverageDir = resolve(projectRoot, "coverage/playwright");
const rawCoverageDir = resolve(projectRoot, "coverage/raw-playwright");

/**
 * simple coverage collector
 */
class CoverageCollector {
	private accumulatedCoverage: Record<string, any> = {};

	merge(newCoverage: Record<string, any>): void {
		if (!newCoverage) return;
		for (const [key, value] of Object.entries(newCoverage)) {
			if (!this.accumulatedCoverage[key]) {
				this.accumulatedCoverage[key] = JSON.parse(
					JSON.stringify(value)
				);
			} else {
				const existing = this.accumulatedCoverage[key];
				// Merge statement coverage
				if (value.s && existing.s) {
					for (const [sKey, sValue] of Object.entries(value.s)) {
						existing.s[sKey] =
							(existing.s[sKey] || 0) + (sValue as number);
					}
				}
				// Merge function coverage
				if (value.f && existing.f) {
					for (const [fKey, fValue] of Object.entries(value.f)) {
						existing.f[fKey] =
							(existing.f[fKey] || 0) + (fValue as number);
					}
				}
				// Merge branch coverage
				if (value.b && existing.b) {
					for (const [bKey, bValue] of Object.entries(value.b)) {
						if (!existing.b[bKey]) {
							existing.b[bKey] = [...(bValue as number[])];
						} else {
							for (
								let i = 0;
								i < (bValue as number[]).length;
								i++
							) {
								existing.b[bKey][i] =
									(existing.b[bKey][i] || 0) +
									(bValue as number[])[i];
							}
						}
					}
				}
			}
		}
	}

	save(filename: string): void {
		if (Object.keys(this.accumulatedCoverage).length > 0) {
			if (!existsSync(rawCoverageDir)) {
				mkdirSync(rawCoverageDir, { recursive: true });
			}
			writeFileSync(filename, JSON.stringify(this.accumulatedCoverage));
		}
	}
}

// Extend the base test with custom fixtures
export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
}>({
	context: async ({ headless }, use) => {
		const isCI = !!process.env.CI;
		const noHeadless = !!process.env.NO_HEADLESS;
		const useHeadless = headless ?? (isCI ? true : !noHeadless);

		// Chrome extensions with Manifest V3 and background service workers
		// now support the new headless mode (--headless=new)
		// For Playwright to load the extension, we usually need headless: false
		// but we can pass --headless=new in args for actual headless execution
		const context = await chromium.launchPersistentContext("", {
			headless: false, // Must be false for extensions to load properly in older PW, but we use flags
			args: [
				`--disable-extensions-except=${extensionPath}`,
				`--load-extension=${extensionPath}`,
				...(useHeadless ? ["--headless=new"] : []),
			],
		});

		const collector = new CoverageCollector();

		if (isCoverage) {
			console.log("[Coverage] Initializing coverage collection...");
			if (!existsSync(coverageDir)) {
				mkdirSync(coverageDir, { recursive: true });
			}
			if (!existsSync(rawCoverageDir)) {
				mkdirSync(rawCoverageDir, { recursive: true });
			}

			context.on("page", (page) => {
				page.on("close", async () => {
					try {
						const coverage = await page.evaluate(
							() => (window as any).__coverage__
						);
						if (coverage) {
							console.debug(
								`[Coverage] Collected coverage from closed page: ${page.url()}`
							);
							collector.merge(coverage);
						}
					} catch {
						// Page might already be closed/gone
					}
				});
			});
		}

		await use(context);

		if (isCoverage) {
			console.log("[Coverage] Merging remaining coverage...");
			let totalCollected = 0;

			for (const page of context.pages()) {
				try {
					const coverage = await page.evaluate(
						() => (window as any).__coverage__
					);
					if (coverage) {
						console.debug(
							`[Coverage] Collected coverage from active page: ${page.url()}`
						);
						collector.merge(coverage);
						totalCollected++;
					} else {
						console.warn(
							`[Coverage] No coverage found on page: ${page.url()}. Is the extension built with coverage?`
						);
					}
				} catch (e: any) {
					console.debug(
						`[Coverage] Failed to collect from page ${page.url()}:`,
						e.message
					);
				}
			}

			for (const worker of context.serviceWorkers()) {
				try {
					const coverage = await worker.evaluate(
						() => (globalThis as any).__coverage__
					);
					if (coverage) {
						console.debug(
							`[Coverage] Collected coverage from service worker: ${worker.url()}`
						);
						collector.merge(coverage);
						totalCollected++;
					} else {
						console.warn(
							`[Coverage] No coverage found in service worker: ${worker.url()}. Is the extension built with coverage?`
						);
					}
				} catch (e: any) {
					console.debug(
						`[Coverage] Failed to collect from service worker ${worker.url()}:`,
						e.message
					);
				}
			}

			if (totalCollected > 0) {
				const filename = resolve(
					rawCoverageDir,
					`coverage-${randomBytes(4).toString("hex")}.json`
				);
				collector.save(filename);
				console.log(`[Coverage] Saved coverage data to ${filename}`);
			} else {
				console.error(
					"[Coverage] ❌ No coverage data was collected! Make sure you ran 'yarn build:coverage' before running E2E tests."
				);
			}
		}

		await context.close();
	},
	extensionId: async ({ context }, use) => {
		let [background] = context.serviceWorkers();
		if (!background) {
			background = await context.waitForEvent("serviceworker");
		}

		const extensionId = background.url().split("/")[2];
		await use(extensionId);
	},
});

export const expect = test.expect;
