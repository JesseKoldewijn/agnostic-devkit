import type { BrowserContext, Page } from "@playwright/test";

/**
 * Script to inject for simulating incognito mode in E2E tests.
 * This overrides chrome.tabs.get and chrome.tabs.query to return incognito: true
 * for the specified tab ID.
 *
 * Note: This function is designed to be serialized and passed to page.addInitScript(),
 * so it must be self-contained with no external dependencies.
 */
function incognitoOverrideScript(tabId: number) {
	const setupOverride = () => {
		const chromeObj = (window as { chrome?: { tabs?: Record<string, unknown> } }).chrome;
		if (!chromeObj?.tabs) {
			setTimeout(setupOverride, 10);
			return;
		}

		const originalGet = (chromeObj.tabs.get as (id: number) => Promise<{ id: number }>).bind(
			chromeObj.tabs
		);
		const originalQuery = (
			chromeObj.tabs.query as (queryInfo: unknown) => Promise<{ id: number }[]>
		).bind(chromeObj.tabs);

		chromeObj.tabs.get = async (id: number) => {
			const tab = await originalGet(id);
			return { ...tab, incognito: id === tabId };
		};

		chromeObj.tabs.query = async (queryInfo: unknown) => {
			const tabs = await originalQuery(queryInfo);
			return tabs.map((t) => ({
				...t,
				incognito: t.id === tabId,
			}));
		};
	};

	setupOverride();
}

/**
 * Helper function to get extension ID from service workers
 * Following Playwright's official pattern with added stability
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
	// Proactively look for the background service worker
	const findBackground = () => {
		const workers = context.serviceWorkers();
		return workers.find((sw) => sw.url().includes("background") || sw.url().includes("event-page"));
	};

	let serviceWorker = findBackground();
	if (!serviceWorker) {
		try {
			serviceWorker = await context.waitForEvent("serviceworker", {
				timeout: 10_000,
			});
		} catch {
			// Fallback: check again after timeout
			serviceWorker = findBackground();
		}
	}

	if (!serviceWorker) {
		// Second fallback: check all pages for extension ID if sw not found
		for (const page of context.pages()) {
			const url = page.url();
			if (url.startsWith("chrome-extension://")) {
				const id = url.split("/")[2];
				if (id) {
					return id;
				}
			}
		}
		throw new Error("Could not determine extension ID from service worker");
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
		? `chrome-extension://${extensionId}/popup.html?targetTabId=${targetTabId}`
		: `chrome-extension://${extensionId}/popup.html`;

	// Increase resilience by retrying or waiting longer
	await page.goto(url, {
		waitUntil: "load", // Wait for full load including scripts
		timeout: 30_000,
	});

	await page.waitForSelector("#root", { state: "visible", timeout: 20_000 });

	// Give SolidJS a moment to mount and initialize
	await page.waitForTimeout(500);

	return page;
}

/**
 * Helper function to open popup page with incognito simulation
 * Uses page script injection to mock the tab.incognito property
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param targetTabId - Tab ID to simulate as incognito
 */
export async function openPopupPageWithIncognito(
	context: BrowserContext,
	extensionId: string,
	targetTabId: number
): Promise<Page> {
	const page = await context.newPage();

	// Inject script to override chrome.tabs API to return incognito: true
	await page.addInitScript(incognitoOverrideScript, targetTabId);

	const url = `chrome-extension://${extensionId}/popup.html?targetTabId=${targetTabId}`;

	await page.goto(url, {
		waitUntil: "load",
		timeout: 30_000,
	});

	await page.waitForSelector("#root", { state: "visible", timeout: 20_000 });
	await page.waitForTimeout(500);

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
		? `chrome-extension://${extensionId}/sidepanel.html?targetTabId=${targetTabId}`
		: `chrome-extension://${extensionId}/sidepanel.html`;
	await page.goto(url, {
		timeout: 15_000,
		waitUntil: "domcontentloaded",
	});
	await page.waitForSelector("#root", { state: "attached", timeout: 10_000 });
	await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
	return page;
}

/**
 * Helper function to open sidebar page with incognito simulation
 * Uses page script injection to mock the tab.incognito property
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param targetTabId - Tab ID to simulate as incognito
 */
export async function openSidebarPageWithIncognito(
	context: BrowserContext,
	extensionId: string,
	targetTabId: number
): Promise<Page> {
	const page = await context.newPage();

	// Inject script to override chrome.tabs API to return incognito: true
	await page.addInitScript(incognitoOverrideScript, targetTabId);

	const url = `chrome-extension://${extensionId}/sidepanel.html?targetTabId=${targetTabId}`;

	await page.goto(url, {
		timeout: 15_000,
		waitUntil: "domcontentloaded",
	});

	await page.waitForSelector("#root", { state: "attached", timeout: 10_000 });
	await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

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
	await page.goto(`chrome-extension://${extensionId}/settings.html`, {
		timeout: 15_000,
		waitUntil: "domcontentloaded",
	});
	await page.waitForSelector("#root", { state: "attached", timeout: 10_000 });
	await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
	return page;
}

/**
 * Helper function to get a cookie value for a given domain and name
 * Uses CDP (Chrome DevTools Protocol) to access cookies
 */
export async function getCookie(page: Page, name: string): Promise<string | null> {
	const cookies = await page.context().cookies();
	const url = new URL(page.url());
	const cookie = cookies.find((c) => c.name === name && c.domain === url.hostname);
	return cookie?.value ?? null;
}

/**
 * Helper function to create a test page and return it
 * Useful for testing parameter application on real web pages
 */
export async function createTestPage(
	context: BrowserContext,
	url = "https://example.com"
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(url, {
		timeout: 15_000,
		waitUntil: "networkidle",
	});
	return page;
}

/**
 * Helper function to get the tab ID for a page
 * Uses the extension's service worker to query for the tab by URL
 * Note: Uses URL pattern matching with wildcard to handle trailing slash variations
 */
export async function getTabId(context: BrowserContext, page: Page): Promise<number> {
	// Get the service worker with improved stability logic
	const findBackground = () =>
		context
			.serviceWorkers()
			.find((sw) => sw.url().includes("background") || sw.url().includes("event-page"));

	let serviceWorker = findBackground();
	if (!serviceWorker) {
		try {
			serviceWorker = await context.waitForEvent("serviceworker", {
				timeout: 10_000,
			});
		} catch {
			serviceWorker = findBackground();
		}
	}

	if (!serviceWorker) {
		throw new Error("Could not find background service worker to query tab ID");
	}

	// Use the service worker to query for the tab by URL
	const pageUrl = page.url();
	const tabId = await serviceWorker.evaluate(async (url: string) => {
		// In the service worker context, chrome or browser global is available
		interface BrowserGlobal {
			chrome?: { tabs?: { query: (opts: { url: string }) => Promise<{ id?: number }[]> } };
			browser?: { tabs?: { query: (opts: { url: string }) => Promise<{ id?: number }[]> } };
		}
		const global = globalThis as BrowserGlobal;
		const browserObj = global.chrome ?? global.browser;
		if (!browserObj?.tabs) {
			return null;
		}

		// First try exact URL match
		let tabs = await browserObj.tabs.query({ url });
		if (tabs.length > 0) {
			return tabs[0]?.id ?? null;
		}

		// If exact match fails, try with/without trailing slash
		const altUrl = url.endsWith("/") ? url.slice(0, -1) : `${url}/`;
		tabs = await browserObj.tabs.query({ url: altUrl });
		return tabs[0]?.id ?? null;
	}, pageUrl);

	if (!tabId) {
		throw new Error(`Could not find tab ID for ${pageUrl}`);
	}

	return tabId;
}
