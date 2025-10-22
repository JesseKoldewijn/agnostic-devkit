import { BrowserContext, Page } from "@playwright/test";

/**
 * Helper function to get extension ID from service workers
 * Following Playwright's official pattern
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
	// Get service worker (following Playwright docs pattern)
	let [serviceWorker] = context.serviceWorkers();
	if (!serviceWorker) {
		serviceWorker = await context.waitForEvent("serviceworker");
	}

	const extensionId = serviceWorker.url().split("/")[2];
	if (!extensionId) {
		throw new Error("Could not determine extension ID from service worker");
	}

	return extensionId;
}

/**
 * Helper function to open popup page
 * With launchPersistentContext, direct navigation works per Playwright docs
 */
export async function openPopupPage(
	context: BrowserContext,
	extensionId: string
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`, {
		waitUntil: "domcontentloaded",
		timeout: 15000,
	});
	await page.waitForSelector("#root", { timeout: 10000, state: "attached" });
	await page
		.waitForLoadState("networkidle", { timeout: 15000 })
		.catch(() => {});
	return page;
}

/**
 * Helper function to open sidebar page
 * With launchPersistentContext, direct navigation works per Playwright docs
 */
export async function openSidebarPage(
	context: BrowserContext,
	extensionId: string
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(
		`chrome-extension://${extensionId}/src/sidebar/index.html`,
		{
			waitUntil: "domcontentloaded",
			timeout: 15000,
		}
	);
	await page.waitForSelector("#root", { timeout: 10000, state: "attached" });
	await page
		.waitForLoadState("networkidle", { timeout: 15000 })
		.catch(() => {});
	return page;
}

/**
 * Helper function to open settings/options page
 * With launchPersistentContext, direct navigation works per Playwright docs
 */
export async function openSettingsPage(
	context: BrowserContext,
	extensionId: string
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(
		`chrome-extension://${extensionId}/src/options/index.html`,
		{
			waitUntil: "domcontentloaded",
			timeout: 15000,
		}
	);
	await page.waitForSelector("#root", { timeout: 10000, state: "attached" });
	await page
		.waitForLoadState("networkidle", { timeout: 15000 })
		.catch(() => {});
	return page;
}
