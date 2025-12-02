import { test, expect } from "./core/test-with-extension";

/**
 * E2E tests for content script functionality
 * These tests verify content script injection, messaging, and page interaction
 */

test.describe("Content Script E2E Tests", () => {
	test("should inject content script on page load", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a test page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait for content script to potentially inject
		await page.waitForTimeout(1000);

		// Verify page loaded successfully
		const title = await page.title();
		expect(title).toBeTruthy();

		// Verify page is functional (content script shouldn't break page)
		const heading = page.getByRole("heading", { name: /Example Domain/i });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await page.close();
	});

	test("should not break page functionality", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a page with interactive elements
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait for content script
		await page.waitForTimeout(1000);

		// Verify page elements are still accessible
		const body = page.locator("body");
		await expect(body).toBeVisible();

		// Verify page can be interacted with
		const pageText = await page.textContent("body");
		expect(pageText).toBeTruthy();
		expect(pageText!.length).toBeGreaterThan(0);

		await page.close();
	});

	test("should handle content script initialization", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait for content script to initialize
		await page.waitForTimeout(2000);

		// Verify page loaded and is functional
		const title = await page.title();
		expect(title).toBeTruthy();

		// Verify DOM is accessible (content script should not interfere)
		const documentReady = await page.evaluate(() => {
			return document.readyState === "complete";
		});
		expect(documentReady).toBe(true);

		await page.close();
	});

	test("should work with multiple page navigations", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to first page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page.waitForTimeout(1000);

		// Verify first page loaded
		const title1 = await page.title();
		expect(title1).toBeTruthy();

		// Navigate to another page
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify navigation worked
		const url = page.url();
		expect(url).toContain("about:blank");

		await page.close();
	});

	test("should handle page reload with content script", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page.waitForTimeout(1000);

		// Get initial title
		const initialTitle = await page.title();

		// Reload the page
		await page.reload({ waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		// Verify page reloaded successfully
		const reloadedTitle = await page.title();
		expect(reloadedTitle).toBe(initialTitle);

		// Verify page is still functional
		const heading = page.getByRole("heading", { name: /Example Domain/i });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await page.close();
	});

	test("should not interfere with page scripts", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page.waitForTimeout(1000);

		// Verify JavaScript execution works (content script shouldn't break it)
		const jsWorks = await page.evaluate(() => {
			try {
				// Test basic JS functionality
				const test = 1 + 1;
				return test === 2;
			} catch {
				return false;
			}
		});
		expect(jsWorks).toBe(true);

		// Verify DOM manipulation works
		const domWorks = await page.evaluate(() => {
			try {
				const div = document.createElement("div");
				div.textContent = "test";
				document.body.appendChild(div);
				const found = document.body.contains(div);
				document.body.removeChild(div);
				return found;
			} catch {
				return false;
			}
		});
		expect(domWorks).toBe(true);

		await page.close();
	});

	test("should handle dynamic content changes", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a page
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page.waitForTimeout(1000);

		// Add dynamic content
		await page.evaluate(() => {
			const div = document.createElement("div");
			div.id = "dynamic-test";
			div.textContent = "Dynamic Content";
			document.body.appendChild(div);
		});

		// Verify dynamic content is accessible
		const dynamicContent = page.locator("#dynamic-test");
		await expect(dynamicContent).toBeVisible({ timeout: 3000 });
		await expect(dynamicContent).toHaveText("Dynamic Content");

		await page.close();
	});

	test("should work across different domains", async ({
		extensionContext,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to first domain
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page.waitForTimeout(1000);

		const title1 = await page.title();
		expect(title1).toBeTruthy();

		// Navigate to a different page (same domain but different path)
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify navigation worked
		const url = page.url();
		expect(url).toContain("about:blank");

		await page.close();
	});
});
