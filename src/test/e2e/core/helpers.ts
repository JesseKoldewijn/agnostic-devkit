import { BrowserContext, Page } from "@playwright/test";

// Re-export coverage helpers from test-with-extension
export { collectCoverage, collectAllCoverage } from "./test-with-extension";

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
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param targetTabId - Optional tab ID to pass to the popup for testing parameter application
 */
export async function openPopupPage(
	context: BrowserContext,
	extensionId: string,
	targetTabId?: number
): Promise<Page> {
	const page = await context.newPage();
	const url = targetTabId
		? `chrome-extension://${extensionId}/src/popup/index.html?targetTabId=${targetTabId}`
		: `chrome-extension://${extensionId}/src/popup/index.html`;
	await page.goto(url, {
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
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param targetTabId - Optional tab ID to pass to the sidebar for testing parameter application
 */
export async function openSidebarPage(
	context: BrowserContext,
	extensionId: string,
	targetTabId?: number
): Promise<Page> {
	const page = await context.newPage();
	const url = targetTabId
		? `chrome-extension://${extensionId}/src/sidebar/index.html?targetTabId=${targetTabId}`
		: `chrome-extension://${extensionId}/src/sidebar/index.html`;
	await page.goto(url, {
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

/**
 * Helper function to get a cookie value for a given domain and name
 * Uses CDP (Chrome DevTools Protocol) to access cookies
 */
export async function getCookie(
	page: Page,
	name: string
): Promise<string | null> {
	const cookies = await page.context().cookies();
	const url = new URL(page.url());
	const cookie = cookies.find(
		(c) => c.name === name && c.domain === url.hostname
	);
	return cookie?.value ?? null;
}

/**
 * Helper function to get a localStorage value via content script injection
 */
export async function getLocalStorageValue(
	page: Page,
	key: string
): Promise<string | null> {
	return await page.evaluate((k: string) => {
		return localStorage.getItem(k);
	}, key);
}

/**
 * Helper function to create a test page and return it
 * Useful for testing parameter application on real web pages
 */
export async function createTestPage(
	context: BrowserContext,
	url: string = "https://example.com"
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(url, {
		waitUntil: "networkidle",
		timeout: 15000,
	});
	return page;
}

/**
 * Helper function to get the tab ID for a page
 * Uses the extension's service worker to query for the tab by URL
 * Note: Uses URL pattern matching with wildcard to handle trailing slash variations
 */
export async function getTabId(
	context: BrowserContext,
	page: Page
): Promise<number> {
	// Get the service worker
	let [serviceWorker] = context.serviceWorkers();
	if (!serviceWorker) {
		serviceWorker = await context.waitForEvent("serviceworker");
	}

	// Use the service worker to query for the tab by URL
	// Use wildcard pattern to handle URL normalization differences (e.g., trailing slashes)
	const pageUrl = page.url();
	const tabId = await serviceWorker.evaluate(async (url: string) => {
		// First try exact URL match
		let tabs = await chrome.tabs.query({ url });
		if (tabs.length > 0) {
			return tabs[0]?.id ?? null;
		}

		// If exact match fails, try with/without trailing slash
		const altUrl = url.endsWith("/") ? url.slice(0, -1) : url + "/";
		tabs = await chrome.tabs.query({ url: altUrl });
		return tabs[0]?.id ?? null;
	}, pageUrl);

	if (!tabId) {
		throw new Error(`Could not find tab ID for ${pageUrl}`);
	}

	return tabId;
}

/**
 * Helper to close a page with coverage collection.
 * Ensures coverage is collected before the page closes.
 */
export async function closePageWithCoverage(
	context: BrowserContext,
	page: Page
): Promise<void> {
	const { collectCoverage } = await import("./test-with-extension");
	await collectCoverage(context, page, "before-close");
	await page.close();
}

/**
 * Helper to navigate with coverage collection.
 * Collects coverage before navigating to a new URL.
 */
export async function navigateWithCoverage(
	context: BrowserContext,
	page: Page,
	url: string,
	options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; timeout?: number }
): Promise<void> {
	const { collectCoverage } = await import("./test-with-extension");
	await collectCoverage(context, page, "before-navigate");
	await page.goto(url, {
		waitUntil: options?.waitUntil ?? "networkidle",
		timeout: options?.timeout ?? 15000,
	});
}

/**
 * Helper to wait for preset toggle effects with coverage collection.
 * After toggling a preset, waits for URL change and collects coverage.
 */
export async function waitForPresetToggleEffect(
	context: BrowserContext,
	page: Page,
	popupPage: Page,
	timeout: number = 3000
): Promise<void> {
	const { collectCoverage } = await import("./test-with-extension");
	
	// Wait for potential URL change on the target page
	await page.waitForTimeout(timeout);
	
	// Collect coverage from both pages
	await collectCoverage(context, popupPage, "after-toggle");
	await collectCoverage(context, page, "after-toggle-target");
}
