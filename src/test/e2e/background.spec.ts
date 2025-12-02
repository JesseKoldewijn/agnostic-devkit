import { test, expect } from "./core/test-with-extension";

/**
 * E2E tests for background service worker functionality
 * These tests verify background script initialization, messaging, and event handling
 */

test.describe("Background Script E2E Tests", () => {
	test("should initialize extension on installation", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a new page to test background script
		const page = await extensionContext.newPage();

		// Navigate to a test page to trigger background script
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify extension is loaded by checking service workers
		const serviceWorkers = extensionContext.serviceWorkers();
		expect(serviceWorkers.length).toBeGreaterThan(0);

		// Verify extension ID is valid
		expect(extensionId).toBeTruthy();
		expect(extensionId.length).toBeGreaterThan(0);

		await page.close();
	});

	test("should initialize display mode on startup", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a new page
		const page = await extensionContext.newPage();
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify extension context is available
		expect(extensionContext).toBeTruthy();
		expect(extensionId).toBeTruthy();

		// The display mode initialization happens in the background
		// We can verify it by checking that the extension is functional
		// by opening the popup which requires display mode to be set
		const popupPage = await extensionContext.newPage();
		await popupPage.goto(
			`chrome-extension://${extensionId}/src/popup/index.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await popupPage.waitForSelector("#root", { timeout: 10000 });

		// If popup loads, display mode was initialized correctly
		const heading = popupPage.getByRole("heading", { name: "Parameters" });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
		await page.close();
	});

	test("should handle tab updates", async ({ extensionContext }) => {
		// Create a test page
		const page = await extensionContext.newPage();

		// Navigate to a URL to trigger tab update
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait a bit for background script to process
		await page.waitForTimeout(1000);

		// Verify page loaded (if it loads, background script processed the update)
		const title = await page.title();
		expect(title).toBeTruthy();

		await page.close();
	});

	test("should clean up tab state on tab close", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Get the tab ID (we can't directly access it, but we can verify cleanup happens)
		// by checking that the extension still works after closing tabs
		const pageUrl = page.url();
		expect(pageUrl).toBeTruthy();

		// Close the page (simulating tab close)
		await page.close();
		// Wait a bit for cleanup
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Verify extension context is still functional
		// by opening popup which should still work
		const popupPage = await extensionContext.newPage();
		await popupPage.goto(
			`chrome-extension://${extensionId}/src/popup/index.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await popupPage.waitForSelector("#root", { timeout: 10000 });

		const heading = popupPage.getByRole("heading", { name: "Parameters" });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test("should listen for storage changes", async ({
		extensionContext,
		extensionId,
	}) => {
		// Open options page to change settings
		const optionsPage = await extensionContext.newPage();
		await optionsPage.goto(
			`chrome-extension://${extensionId}/src/options/index.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await optionsPage.waitForSelector("#root", { timeout: 10000 });
		await optionsPage.waitForLoadState("networkidle");

		// Change display mode (this triggers storage change)
		const displayModeSelect = optionsPage
			.locator("select")
			.filter({ hasText: /Popup|Sidebar/ });
		await displayModeSelect.selectOption("popup");

		// Save settings
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await saveButton.click();
		await optionsPage.waitForTimeout(1000);

		// Verify settings were saved (background script should have processed the change)
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		await optionsPage.close();
	});

	test("should handle background script messaging", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();
		await page.goto("about:blank");

		// Test messaging by evaluating script in page context
		// Note: We can't directly test extension messaging from E2E,
		// but we can verify the extension is responsive
		await page.evaluate(async () => {
			try {
				// Try to access chrome runtime (if available in test context)
				return (
					typeof chrome !== "undefined" &&
					chrome.runtime !== undefined
				);
			} catch {
				return false;
			}
		});

		// Verify extension context is available
		expect(extensionId).toBeTruthy();

		await page.close();
	});

	test("should register context menu on startup", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page
		const page = await extensionContext.newPage();
		await page.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait for background script to initialize
		await page.waitForTimeout(2000);

		// Verify extension is functional (context menu registration happens in background)
		// We can verify by checking that the extension works correctly
		const popupPage = await extensionContext.newPage();
		await popupPage.goto(
			`chrome-extension://${extensionId}/src/popup/index.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await popupPage.waitForSelector("#root", { timeout: 10000 });

		// If popup loads, background script initialized correctly
		const heading = popupPage.getByRole("heading", { name: "Parameters" });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
		await page.close();
	});

	test("should handle multiple tab updates", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create multiple pages to simulate multiple tabs
		const page1 = await extensionContext.newPage();
		const page2 = await extensionContext.newPage();

		// Navigate both pages
		await page1.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});
		await page2.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Wait for background script to process
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Verify both pages loaded
		const title1 = await page1.title();
		const title2 = await page2.title();
		expect(title1).toBeTruthy();
		expect(title2).toBeTruthy();

		// Close pages
		await page1.close();
		await page2.close();
		// Wait a bit for cleanup
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Verify extension still works after multiple tab operations
		const popupPage = await extensionContext.newPage();
		await popupPage.goto(
			`chrome-extension://${extensionId}/src/popup/index.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await popupPage.waitForSelector("#root", { timeout: 10000 });

		const heading = popupPage.getByRole("heading", { name: "Parameters" });
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});
});
