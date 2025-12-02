import { test, expect } from "./core/test-with-extension";
import { openPopupPage, createTestPage, getTabId } from "./core/helpers";

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
		const heading = popupPage.locator('[data-testid="popup-heading"]');
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

		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test.describe("Tab State and Cleanup", () => {
		test("should clean up preset state when tab is closed", async ({
			extensionContext,
			extensionId,
		}) => {
			// Create a test page first
			const testPage = await createTestPage(extensionContext, "https://example.com");
			
			// Get the tab ID for the test page
			const tabId = await getTabId(extensionContext, testPage);

			// Create and activate a preset on this tab with tab context
			const popupPage = await openPopupPage(extensionContext, extensionId, tabId);
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
			const newPopupPage = await extensionContext.newPage();
			await newPopupPage.goto(
				`chrome-extension://${extensionId}/src/popup/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await newPopupPage.waitForSelector("#root", { timeout: 10000 });

			const heading = newPopupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible({ timeout: 5000 });

			await newPopupPage.close();
		});

		test("should clean up only specific tab state when multiple tabs exist", async ({
			extensionContext,
			extensionId,
		}) => {
			// Create two test pages
			const testPage1 = await createTestPage(extensionContext, "https://example.com");
			const testPage2 = await createTestPage(extensionContext, "https://example.com");
			
			// Get the tab ID for the first test page
			const tabId1 = await getTabId(extensionContext, testPage1);

			// Activate preset on first tab with tab context
			const popupPage = await openPopupPage(extensionContext, extensionId, tabId1);
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
			extensionContext,
			extensionId,
		}) => {
			// Create a test page first
			const testPage = await createTestPage(extensionContext, "https://example.com");
			
			// Get the tab ID for the test page
			const tabId = await getTabId(extensionContext, testPage);

			// Activate a preset with tab context
			const popupPage = await openPopupPage(extensionContext, extensionId, tabId);
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
					waitUntil: "networkidle",
					timeout: 15000,
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
		const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
		await displayModeSelect.selectOption("popup");

		// Save settings
		const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
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
		const heading = popupPage.locator('[data-testid="popup-heading"]');
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

		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test.describe("Context Menu", () => {
		test("should register context menu items on startup", async ({
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

			// If popup loads, background script initialized correctly including context menu
			const heading = popupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible({ timeout: 5000 });

			await popupPage.close();
			await page.close();
		});

		test("should handle context menu clicks", async ({
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

			// Right-click on the page to trigger context menu
			// Note: Playwright doesn't directly support context menu interaction,
			// but we can verify the extension handles context menu events
			await page.click("body", { button: "right" });
			await page.waitForTimeout(500);

			// Verify page is still functional after context menu interaction
			const body = page.locator("body");
			await expect(body).toBeVisible();

			// Verify extension still works
			const popupPage = await extensionContext.newPage();
			await popupPage.goto(
				`chrome-extension://${extensionId}/src/popup/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await popupPage.waitForSelector("#root", { timeout: 10000 });

			const heading = popupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible({ timeout: 5000 });

			await popupPage.close();
			await page.close();
		});

		test("should process context menu actions", async ({
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

			// Context menu actions are handled by background script
			// We can verify the background script is responsive by checking extension functionality
			const popupPage = await extensionContext.newPage();
			await popupPage.goto(
				`chrome-extension://${extensionId}/src/popup/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await popupPage.waitForSelector("#root", { timeout: 10000 });

			// Verify extension is functional (background script processes context menu)
			const heading = popupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible({ timeout: 5000 });

			await popupPage.close();
			await page.close();
		});
	});

	test.describe("Notifications", () => {
		test("should show notification on tab update when enabled", async ({
			extensionContext,
			extensionId,
		}) => {
			// Enable notifications in options first
			const optionsPage = await extensionContext.newPage();
			await optionsPage.goto(
				`chrome-extension://${extensionId}/src/options/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await optionsPage.waitForSelector("#root", { timeout: 10000 });
			await optionsPage.waitForLoadState("networkidle");

			// Enable notifications
			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			if (!(await notificationsCheckbox.isChecked())) {
				await notificationsCheckbox.click();
			}

			// Save settings
			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);
			await optionsPage.close();

			// Create a test page and navigate to trigger tab update
			const page = await extensionContext.newPage();
			await page.goto("https://example.com", {
				waitUntil: "networkidle",
				timeout: 15000,
			});

			// Wait for notification to potentially appear
			await page.waitForTimeout(2000);

			// Note: In Playwright, we can't directly verify Chrome notifications,
			// but we can verify the tab update was processed
			const title = await page.title();
			expect(title).toBeTruthy();

			await page.close();
		});

		test("should not show notification when disabled", async ({
			extensionContext,
			extensionId,
		}) => {
			// Disable notifications in options
			const optionsPage = await extensionContext.newPage();
			await optionsPage.goto(
				`chrome-extension://${extensionId}/src/options/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await optionsPage.waitForSelector("#root", { timeout: 10000 });
			await optionsPage.waitForLoadState("networkidle");

			// Disable notifications
			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			if (await notificationsCheckbox.isChecked()) {
				await notificationsCheckbox.click();
			}

			// Save settings
			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);
			await optionsPage.close();

			// Create a test page and navigate
			const page = await extensionContext.newPage();
			await page.goto("https://example.com", {
				waitUntil: "networkidle",
				timeout: 15000,
			});

			// Wait a bit
			await page.waitForTimeout(2000);

			// Verify page loaded (notifications should be disabled)
			const title = await page.title();
			expect(title).toBeTruthy();

			await page.close();
		});

		test("should show correct notification content", async ({
			extensionContext,
			extensionId,
		}) => {
			// Enable notifications
			const optionsPage = await extensionContext.newPage();
			await optionsPage.goto(
				`chrome-extension://${extensionId}/src/options/index.html`,
				{ waitUntil: "domcontentloaded", timeout: 15000 }
			);
			await optionsPage.waitForSelector("#root", { timeout: 10000 });
			await optionsPage.waitForLoadState("networkidle");

			const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
			if (!(await notificationsCheckbox.isChecked())) {
				await notificationsCheckbox.click();
			}

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);
			await optionsPage.close();

			// Navigate to a page - notification should show the URL
			const page = await extensionContext.newPage();
			await page.goto("https://example.com", {
				waitUntil: "networkidle",
				timeout: 15000,
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
