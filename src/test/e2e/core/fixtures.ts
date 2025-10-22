import {
	test as base,
	chromium,
	BrowserContext,
	Browser,
} from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "../../../dist");

// Extend the base test with a custom fixture for extension context
export const test = base.extend<{
	contextWithExtension: BrowserContext;
	browserWithExtension: Browser;
}>({
	// oxlint-disable-next-line no-empty-pattern
	browserWithExtension: async ({}, use) => {
		// Launch browser with extension loaded
		const browser = await chromium.launch({
			headless: true,
			args: [
				`--disable-extensions-except=${extensionPath}`,
				`--load-extension=${extensionPath}`,
			],
		});

		await use(browser);
		await browser.close();
	},

	contextWithExtension: async ({ browserWithExtension }, use) => {
		const context = await browserWithExtension.newContext();

		// Wait a bit for extension to initialize
		await new Promise((resolve) => setTimeout(resolve, 2000));

		await use(context);
		await context.close();
	},
});

export { expect } from "@playwright/test";
