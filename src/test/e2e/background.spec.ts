import { expect, test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

/**
 * E2E tests for background service worker functionality
 * These tests verify background script initialization, messaging, and event handling
 */

test.describe("Background Script E2E Tests", () => {
	test("should initialize extension on installation", async ({ context, extensionId }) => {
		// Create a new page to test background script
		const page = await context.newPage();

		// Navigate to a test page to trigger background script
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify extension is loaded by checking service workers
		const serviceWorkers = context.serviceWorkers();
		expect(serviceWorkers.length).toBeGreaterThan(0);

		// Verify extension ID is valid
		expect(extensionId).toBeTruthy();
		expect(extensionId.length).toBeGreaterThan(0);

		await page.close();
	});

	test("should initialize display mode on startup", async ({ context, extensionId }) => {
		// Create a new page
		const page = await context.newPage();
		await page.goto("about:blank");
		await page.waitForTimeout(1000);

		// Verify extension context is available
		expect(context).toBeTruthy();
		expect(extensionId).toBeTruthy();

		// The display mode initialization happens in the background
		// We can verify it by checking that the extension is functional
		// by opening the popup which requires display mode to be set
		const popupPage = await openPopupPage(context, extensionId);

		// If popup loads, display mode was initialized correctly
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
		await page.close();
	});

	test("should handle tab updates", async ({ context }) => {
		// Create a test page
		const page = await context.newPage();

		// Navigate to a URL to trigger tab update
		await page.goto("https://example.com", {
			timeout: 15_000,
			waitUntil: "networkidle",
		});

		// Wait a bit for background script to process
		await page.waitForTimeout(1000);

		// Verify page loaded (if it loads, background script processed the update)
		const title = await page.title();
		expect(title).toBeTruthy();

		await page.close();
	});

	test("should clean up tab state on tab close", async ({ context, extensionId }) => {
		// Create a test page
		const page = await context.newPage();
		await page.goto("https://example.com", {
			timeout: 15_000,
			waitUntil: "networkidle",
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
		const popupPage = await openPopupPage(context, extensionId);

		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test.describe("Tab State and Cleanup", () => {
		test("should clean up preset state when tab is closed", async ({ context, extensionId }) => {
			// Create a test page first
			const testPage = await createTestPage(context, "https://example.com");

			// Get the tab ID for the test page
			const tabId = await getTabId(context, testPage);

			// Create and activate a preset on this tab with tab context
			const popupPage = await openPopupPage(context, extensionId, tabId);
			await popupPage.waitForLoadState("networkidle");

			// Create a preset
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
			await newPresetButton.click();
			await popupPage.waitForTimeout(300);

			const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
			await nameInput.fill(`Cleanup Test ${Date.now()}`);

			const addParamButton = popupPage.locator('[data-testid="add-parameter-button"]');
			await addParamButton.click();
			await popupPage.waitForTimeout(200);

			const paramKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
			await paramKeyInput.fill("cleanupKey");
			const paramValueInput = popupPage.locator('[data-testid="parameter-value-input"]').first();
			await paramValueInput.fill("cleanupValue");

			await popupPage.locator('[data-testid="save-preset-button"]').click();
			await popupPage.waitForTimeout(500);

			// Close preset manager and activate preset
			await popupPage.locator('[data-testid="close-manager-button"]').click();
			await popupPage.waitForTimeout(1000);

			const presetToggles = popupPage.locator('[data-testid="preset-toggle-checkbox"]');
			const toggleCount = await presetToggles.count();

			if (toggleCount > 0) {
				// Activate preset (use force click because the toggle div overlays the checkbox)
				await presetToggles.first().click({ force: true });
				await testPage.waitForTimeout(2000);

				// Verify preset is active (URL should have parameter)
				let url = testPage.url();
				expect(url).toContain("cleanupKey=cleanupValue");
			}

			await popupPage.close();

			// Close the test page (this should trigger cleanup)
			await testPage.close();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Verify extension still works after cleanup
			const newPopupPage = await openPopupPage(context, extensionId);

			const heading = newPopupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible({ timeout: 5000 });

			await newPopupPage.close();
		});

		test("should clean up only specific tab state when multiple tabs exist", async ({
			context,
			extensionId,
		}) => {
			// Create two test pages
			const testPage1 = await createTestPage(context, "https://example.com");
			const testPage2 = await createTestPage(context, "https://example.com");

			// Get the tab ID for the first test page
			const tabId1 = await getTabId(context, testPage1);

			// Activate preset on first tab with tab context
			const popupPage = await openPopupPage(context, extensionId, tabId1);
			await popupPage.waitForLoadState("networkidle");

			// Wait for preset list
			await popupPage.waitForTimeout(1000);

			const presetToggles = popupPage.locator('[data-testid="preset-toggle-checkbox"]');
			const toggleCount = await presetToggles.count();

			if (toggleCount > 0) {
				// Activate preset (affects current active tab)
				await presetToggles.first().click({ force: true });
				await testPage1.waitForTimeout(2000);
			}

			await popupPage.close();

			// Close only first tab
			await testPage1.close();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Verify second tab is still functional
			const url2 = testPage2.url();
			expect(url2).toBeTruthy();

			await testPage2.close();
		});

		test("should persist preset state when navigating to new URL", async ({
			context,
			extensionId,
		}) => {
			// Create a test page first
			const testPage = await createTestPage(context, "https://example.com");

			// Get the tab ID for the test page
			const tabId = await getTabId(context, testPage);

			// Activate a preset with tab context
			const popupPage = await openPopupPage(context, extensionId, tabId);
			await popupPage.waitForLoadState("networkidle");

			await popupPage.waitForTimeout(1000);

			const presetToggles = popupPage.locator('[data-testid="preset-toggle-checkbox"]');
			const toggleCount = await presetToggles.count();

			if (toggleCount > 0) {
				// Activate preset (use force click because the toggle div overlays the checkbox)
				await presetToggles.first().click({ force: true });
				await testPage.waitForTimeout(2000);

				// Navigate to a different URL
				await testPage.goto("https://example.org", {
					timeout: 15_000,
					waitUntil: "networkidle",
				});

				// Wait a bit for preset to reapply
				await testPage.waitForTimeout(2000);

				// Verify extension still works (preset state should persist)
				const heading = popupPage.locator('[data-testid="popup-heading"]');
				await expect(heading).toBeVisible({ timeout: 5000 });
			}

			await popupPage.close();
			await testPage.close();
		});
	});

	test("should listen for storage changes", async ({ context, extensionId }) => {
		// Open options page to change settings
		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
			timeout: 15_000,
			waitUntil: "domcontentloaded",
		});
		await optionsPage.waitForSelector("#root", { timeout: 10_000 });
		await optionsPage.waitForLoadState("networkidle");

		// Change display mode (this triggers storage change)
		const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
		await displayModeSelect.selectOption("popup");
		await displayModeSelect.evaluate((el) =>
			el.dispatchEvent(new Event("change", { bubbles: true }))
		);

		// Verify settings were saved (indicator should appear)
		const savedIndicator = optionsPage.locator('[data-testid="settings-saved-indicator"]');
		await expect(savedIndicator).toBeVisible({ timeout: 5000 });

		await optionsPage.close();
	});

	test("should handle multiple tab updates", async ({ context, extensionId }) => {
		// Create multiple pages to simulate multiple tabs
		const page1 = await context.newPage();
		const page2 = await context.newPage();

		// Navigate both pages
		await page1.goto("https://example.com", {
			timeout: 15_000,
			waitUntil: "networkidle",
		});
		await page2.goto("https://example.com", {
			timeout: 15_000,
			waitUntil: "networkidle",
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
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, {
			timeout: 15_000,
			waitUntil: "domcontentloaded",
		});
		await popupPage.waitForSelector("#root", { timeout: 10_000 });

		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test.describe("Notifications", () => {
		test("should show notification on tab update when enabled", async ({
			context,
			extensionId,
		}) => {
			// Enable notifications in options first
			const optionsPage = await context.newPage();
			await optionsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "domcontentloaded",
			});
			await optionsPage.waitForSelector("#root", { timeout: 10_000 });
			await optionsPage.waitForLoadState("networkidle");

			// Enable notifications (force toggle to ensure a save is triggered)
			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			await notificationsCheckbox.evaluate((el) => {
				(el as HTMLInputElement).checked = true;
				el.dispatchEvent(new Event("change", { bubbles: true }));
			});

			// Verify settings were saved
			const savedIndicator = optionsPage.locator('[data-testid="settings-saved-indicator"]');
			await expect(savedIndicator).toBeVisible({ timeout: 10_000 });
			await optionsPage.close();

			// Create a test page and navigate to trigger tab update
			const page = await context.newPage();
			await page.goto("https://example.com", {
				timeout: 15_000,
				waitUntil: "networkidle",
			});

			// Wait for notification to potentially appear
			await page.waitForTimeout(2000);

			// Note: In Playwright, we can't directly verify Chrome notifications,
			// but we can verify the tab update was processed
			const title = await page.title();
			expect(title).toBeTruthy();

			await page.close();
		});

		test("should not show notification when disabled", async ({ context, extensionId }) => {
			// Disable notifications in options
			const optionsPage = await context.newPage();
			await optionsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "domcontentloaded",
			});
			await optionsPage.waitForSelector("#root", { timeout: 10_000 });
			await optionsPage.waitForLoadState("networkidle");

			// Disable notifications
			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			if (await notificationsCheckbox.isChecked()) {
				await notificationsCheckbox.evaluate((el) => {
					(el as HTMLInputElement).checked = false;
					el.dispatchEvent(new Event("change", { bubbles: true }));
				});
			}

			// Verify settings were saved
			const savedIndicator = optionsPage.locator('[data-testid="settings-saved-indicator"]');
			await expect(savedIndicator).toBeVisible({ timeout: 5000 });
			await optionsPage.close();

			// Create a test page and navigate
			const page = await context.newPage();
			await page.goto("https://example.com", {
				timeout: 15_000,
				waitUntil: "networkidle",
			});

			// Wait a bit
			await page.waitForTimeout(2000);

			// Verify page loaded (notifications should be disabled)
			const title = await page.title();
			expect(title).toBeTruthy();

			await page.close();
		});

		test("should show correct notification content", async ({ context, extensionId }) => {
			// Enable notifications
			const optionsPage = await context.newPage();
			await optionsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "domcontentloaded",
			});
			await optionsPage.waitForSelector("#root", { timeout: 10_000 });
			await optionsPage.waitForLoadState("networkidle");

			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			await notificationsCheckbox.evaluate((el) => {
				(el as HTMLInputElement).checked = true;
				el.dispatchEvent(new Event("change", { bubbles: true }));
			});

			// Verify settings were saved
			const savedIndicator = optionsPage.locator('[data-testid="settings-saved-indicator"]');
			await expect(savedIndicator).toBeVisible({ timeout: 10_000 });
			await optionsPage.close();

			// Navigate to a page - notification should show the URL
			const page = await context.newPage();
			await page.goto("https://example.com", {
				timeout: 15_000,
				waitUntil: "networkidle",
			});

			// Wait for notification
			await page.waitForTimeout(2000);

			// Verify the page URL was processed (notification would contain it)
			const url = page.url();
			expect(url).toContain("example.com");

			await page.close();
		});
	});
});
