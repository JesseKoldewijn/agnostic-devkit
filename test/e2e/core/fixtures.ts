import type { BrowserContext } from "@playwright/test";
import { test as base, chromium } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Istanbul coverage data format for a single file */
interface IstanbulFileCoverage {
	s: Record<string, number>; // statement counts
	f: Record<string, number>; // function counts
	b: Record<string, number[]>; // branch counts
	statementMap?: Record<string, unknown>;
	fnMap?: Record<string, unknown>;
	branchMap?: Record<string, unknown>;
}

/** Full Istanbul coverage object (file path -> coverage data) */
type IstanbulCoverage = Record<string, IstanbulFileCoverage>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "../../../build-output/chrome-mv3");

const isCoverage = process.env.CI_COVERAGE === "true";
const projectRoot = resolve(__dirname, "../../../");
const rawCoverageDir = resolve(projectRoot, "coverage/raw-playwright");

/**
 * simple coverage collector
 */
class CoverageCollector {
	private accumulatedCoverage: IstanbulCoverage = {};

	merge(newCoverage: IstanbulCoverage): void {
		if (!newCoverage) {
			return;
		}
		for (const [key, value] of Object.entries(newCoverage)) {
			if (!this.accumulatedCoverage[key]) {
				this.accumulatedCoverage[key] = JSON.parse(JSON.stringify(value)) as IstanbulFileCoverage;
			} else {
				const existing = this.accumulatedCoverage[key];
				const val = value;

				// Merge statement coverage
				if (val.s && existing.s) {
					for (const [sKey, sValue] of Object.entries(val.s)) {
						existing.s[sKey] = (existing.s[sKey] || 0) + sValue;
					}
				}
				// Merge function coverage
				if (val.f && existing.f) {
					for (const [fKey, fValue] of Object.entries(val.f)) {
						existing.f[fKey] = (existing.f[fKey] || 0) + fValue;
					}
				}
				// Merge branch coverage
				if (val.b && existing.b) {
					for (const [bKey, bValue] of Object.entries(val.b)) {
						if (!existing.b[bKey]) {
							existing.b[bKey] = [...bValue];
						} else {
							for (let i = 0; i < bValue.length; i++) {
								existing.b[bKey][i] = (existing.b[bKey][i] || 0) + bValue[i];
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
		const isCI = Boolean(process.env.CI);
		const noHeadless = Boolean(process.env.NO_HEADLESS);
		const useHeadless = headless ?? (isCI ? true : !noHeadless);

		const context = await chromium.launchPersistentContext("", {
			args: [
				`--disable-extensions-except=${extensionPath}`,
				`--load-extension=${extensionPath}`,
				...(useHeadless ? ["--headless=new"] : []),
			],
			headless: false,
		});

		// Mock notifications API to prevent CI hangs/flakiness
		await context.addInitScript(() => {
			const globalObj = globalThis as any;
			if (globalObj.chrome !== undefined) {
				globalObj.chrome.notifications = {
					...globalObj.chrome.notifications,

					create: (...args: any[]) => {
						console.log("[Mock] chrome.notifications.create called", args);
						const callback = args.at(-1);
						if (typeof callback === "function") {
							callback("mock-notification-id");
						}
						return Promise.resolve("mock-notification-id");
					},

					clear: (...args: any[]) => {
						console.log("[Mock] chrome.notifications.clear called", args);
						const callback = args.at(-1);
						if (typeof callback === "function") {
							callback(true);
						}
						return Promise.resolve(true);
					},

					getAll: (...args: any[]) => {
						const callback = args.at(-1);
						if (typeof callback === "function") {
							callback({});
						}
						return Promise.resolve({});
					},
				};
			}
		});

		const collector = new CoverageCollector();

		if (isCoverage) {
			context.on("page", (page) => {
				page.on("load", async () => {
					try {
						const coverage = await page.evaluate(() => (window as any).__coverage__);
						if (coverage) {
							collector.merge(coverage);
						}
					} catch {
						// ignore errors from closed pages/workers
					}
				});
				page.on("close", async () => {
					try {
						const coverage = await page.evaluate(() => (window as any).__coverage__);
						if (coverage) {
							collector.merge(coverage);
						}
					} catch {
						// ignore errors from closed pages/workers
					}
				});
			});
		}

		await use(context);

		if (isCoverage) {
			console.log("[Coverage] Collecting final coverage...");
			let totalCollected = 0;

			// Collect from all pages BEFORE closing context
			for (const page of context.pages()) {
				try {
					if (page.url() === "about:blank") {
						continue;
					}

					const coverage = await page.evaluate(() => (window as any).__coverage__);
					if (coverage) {
						console.log(`[Coverage] Collected from page: ${page.url()}`);
						collector.merge(coverage);
						totalCollected++;
					}
				} catch {
					// ignore
				}
			}

			// Collect from service workers
			for (const worker of context.serviceWorkers()) {
				try {
					const coverage = await worker.evaluate(() => (globalThis as any).__coverage__);
					if (coverage) {
						console.log(`[Coverage] Collected from service worker: ${worker.url()}`);
						collector.merge(coverage);
						totalCollected++;
					}
				} catch {
					// ignore
				}
			}

			if (totalCollected > 0) {
				const filename = resolve(rawCoverageDir, `coverage-${randomBytes(4).toString("hex")}.json`);
				collector.save(filename);
				console.log(`[Coverage] Saved coverage data to ${filename}`);
			}
		}

		await context.close();
	},
	extensionId: async ({ context }, use) => {
		const findBackground = () => {
			const workers = context.serviceWorkers();
			return workers.find(
				(sw) => sw.url().includes("background") || sw.url().includes("event-page")
			);
		};

		// 1. Try to find existing service worker
		let background = findBackground();

		// 2. Wait for service worker event if not found
		if (!background) {
			try {
				background = await context.waitForEvent("serviceworker", {
					timeout: 10_000,
				});
			} catch {
				background = findBackground();
			}
		}

		// 3. If still not found, try to force it by opening an extension page
		if (!background) {
			console.log("[Fixture] Service worker not found, waiting and checking again...");
			for (let i = 0; i < 5; i++) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				background = findBackground();
				if (background) {
					break;
				}
			}
		}

		// 4. If STILL not found, look at any extension pages that might be open
		if (!background) {
			console.log("[Fixture] Service worker still not found, looking for extension pages...");
			for (const page of context.pages()) {
				const url = page.url();
				if (url.startsWith("chrome-extension://")) {
					const id = url.split("/")[2];
					if (id) {
						console.log(`[Fixture] Found extension ID from open page: ${id}`);
						await use(id);
						return;
					}
				}
			}

			// Try to find ANY service worker at all
			const allWorkers = context.serviceWorkers();
			console.log(`[Fixture] All service workers: ${allWorkers.map((w) => w.url()).join(", ")}`);
			if (allWorkers.length > 0) {
				const sw = allWorkers.find((w) => w.url().startsWith("chrome-extension://"));
				if (sw) {
					background = sw;
				}
			}
		}

		if (!background) {
			throw new Error(
				`Extension background service worker not found. Found workers: ${context
					.serviceWorkers()
					.map((w) => w.url())
					.join(", ")}`
			);
		}

		const extensionId = background.url().split("/")[2];
		await use(extensionId);
	},
});

export const expect = test.expect;
