import type { Page } from "@playwright/test";

import { expect, test } from "./core/fixtures";

/**
 * E2E tests for the Popup interface
 * These tests verify popup loading, theme display, and navigation to options
 */

test.describe("Popup Interface E2E Tests", () => {
	let popupPage: Page;

	test.beforeEach(async ({ context, extensionId }) => {
		popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, {
			timeout: 15_000,
			waitUntil: "domcontentloaded",
		});
		await popupPage.waitForSelector("#root", { timeout: 10_000 });
	});

	test.afterEach(async () => {
		if (popupPage) {
			await popupPage.close();
		}
	});

	test("should load popup correctly", async () => {
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("Agnostic Devkit");
	});

	test("should display current theme indicator", async () => {
		const themeIndicator = popupPage.locator('[data-testid="theme-indicator"]');
		await expect(themeIndicator).toBeVisible();
	});

	test("should open options page from footer button", async ({ context, extensionId }) => {
		const openOptionsButton = popupPage.locator('[data-testid="open-options-button"]');

		// Wait for new page to open
		const [newPage] = await Promise.all([context.waitForEvent("page"), openOptionsButton.click()]);

		await newPage.waitForLoadState("networkidle");
		// Chrome might open options in chrome://extensions/?options=ID or chrome-extension://ID/settings.html
		const url = newPage.url();
		const isOptionsUrl =
			url.includes(extensionId) && (url.includes("settings.html") || url.includes("options="));
		expect(isOptionsUrl).toBe(true);

		await newPage.close();
	});

	test("should show current tab section", async () => {
		// By default should be visible if a tab is active
		const currentTabSection = popupPage.locator('[data-testid="current-tab-section"]');
		await expect(currentTabSection).toBeVisible();

		const currentTabUrl = popupPage.locator('[data-testid="current-tab-url"]');
		await expect(currentTabUrl).toBeVisible();
	});

	test("should toggle preset manager view", async () => {
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');

		await manageButton.click();

		// Verify manager view is shown
		const managerContainer = popupPage.locator('[data-testid="preset-manager-container"]');
		await expect(managerContainer).toBeVisible();

		// Verify heading in manager
		const managerHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
		await expect(managerHeading).toContainText("Manage Presets");

		// Close manager
		const closeButton = popupPage.locator('[data-testid="close-manager-button"]');
		await closeButton.click();

		// Verify main view is back
		await expect(popupPage.locator('[data-testid="popup-heading"]')).toBeVisible();
	});
});
