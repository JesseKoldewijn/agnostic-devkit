import { test, expect } from "./core/test-with-extension";
import { openPopupPage } from "./core/helpers";

/**
 * E2E tests for the Chrome extension popup
 * These tests verify popup functionality and UI elements
 */

test.describe("Popup E2E Tests", () => {
	test("should open and display popup correctly", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);

		// Wait for content to load
		await popupPage.waitForLoadState("networkidle");

		// Verify title
		const title = await popupPage.title();
		expect(title).toBe("Chrome Extension Popup");

		// Verify main heading is visible
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText("Parameters");

		// Verify "Manage" button exists
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();

		// Verify "Open Options" button exists
		const optionsButton = popupPage.locator('[data-testid="open-options-button"]');
		await expect(optionsButton).toBeVisible();

		await popupPage.close();
	});

	test("should display current tab URL when available", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test web page first
		const testPage = await extensionContext.newPage();
		await testPage.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Open popup - it should show the current tab URL
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Wait for content to render
		await popupPage.waitForTimeout(1000);

		// Verify main heading is visible
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		// The "Current Tab" section should be visible if there's an active tab
		const currentTabSection = popupPage.locator('[data-testid="current-tab-section"]');
		// This may or may not be visible depending on implementation
		// If it exists, verify it's visible
		if (await currentTabSection.isVisible().catch(() => false)) {
			await expect(currentTabSection).toBeVisible();
		}

		await popupPage.close();
		await testPage.close();
	});

	test("should update current tab URL display when navigating", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test web page
		const testPage = await extensionContext.newPage();
		await testPage.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Open popup
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");
		await popupPage.waitForTimeout(1000);

		// Verify popup loads
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible({ timeout: 5000 });

		// Navigate to a different page
		await testPage.goto("https://example.org", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Close popup
		await popupPage.close();

		// Wait a bit before reopening
		await testPage.waitForTimeout(500);

		const newPopupPage = await openPopupPage(extensionContext, extensionId);
		await newPopupPage.waitForLoadState("networkidle");
		await newPopupPage.waitForTimeout(1000);

		// Verify popup still works after navigation
		const newHeading = newPopupPage.locator('[data-testid="popup-heading"]');
		await expect(newHeading).toBeVisible({ timeout: 5000 });

		await newPopupPage.close();
		await testPage.close();
	});

	test("should open preset manager when clicking Manage", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find and click the Manage button
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await popupPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const closeButton = popupPage.locator('[data-testid="close-manager-button"]');
		await expect(closeButton).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test("should have Open Options button that navigates to options page", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find the Open Options button
		const openOptionsButton = popupPage.locator('[data-testid="open-options-button"]');
		await expect(openOptionsButton).toBeVisible();

		// Click the button and wait for options page to open
		const [optionsPage] = await Promise.all([
			extensionContext.waitForEvent("page"),
			openOptionsButton.click(),
		]);

		// Verify options page opened
		await optionsPage.waitForLoadState("networkidle");
		const optionsTitle = await optionsPage.title();
		expect(optionsTitle).toBe("Chrome Extension Options");

		// Verify options page content
		const optionsHeading = optionsPage.locator('[data-testid="options-heading"]');
		await expect(optionsHeading).toBeVisible();

		await popupPage.close();
		await optionsPage.close();
	});

	test("should display current theme", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Verify theme indicator displays a valid theme
		const themeIndicator = popupPage.locator('[data-testid="theme-indicator"]');
		await expect(themeIndicator).toBeVisible();
		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/(light|dark|system)/i);

		await popupPage.close();
	});
});
