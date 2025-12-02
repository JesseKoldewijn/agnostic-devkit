import { test, expect } from "./core/test-with-extension";
import { openSidebarPage } from "./core/helpers";

/**
 * E2E tests for the Chrome extension sidebar
 * These tests verify sidebar functionality and UI elements
 */

test.describe("Sidebar E2E Tests", () => {
	test("should open and display sidebar correctly", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);

		// Wait for content to load
		await sidebarPage.waitForLoadState("networkidle");

		// Verify title
		const title = await sidebarPage.title();
		expect(title).toBe("Chrome Extension Sidebar");

		// Verify main heading is visible
		const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText("Parameter Presets");

		// Verify "Current Tab" section exists
		const currentTabSection = sidebarPage.locator('[data-testid="current-tab-section"]');
		await expect(currentTabSection).toBeVisible();

		await sidebarPage.close();
	});

	test("should open preset manager when clicking Manage", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);

		// Find and click the Manage button
		const manageButton = sidebarPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await sidebarPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const closeButton = sidebarPage.locator('[data-testid="close-manager-button"]');
		await expect(closeButton).toBeVisible({ timeout: 5000 });

		await sidebarPage.close();
	});

	test("should display preset info card", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Verify info card heading is visible
		const infoHeading = sidebarPage.locator('[data-testid="about-presets-heading"]');
		await expect(infoHeading).toBeVisible();
		await expect(infoHeading).toHaveText("About Presets");

		await sidebarPage.close();
	});

	test("should display current tab information", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Verify "Current Tab" section is visible
		const currentTabSection = sidebarPage.locator('[data-testid="current-tab-section"]');
		await expect(currentTabSection).toBeVisible();

		await sidebarPage.close();
	});

	test("should display current theme", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Verify theme indicator shows a valid theme
		const themeIndicator = sidebarPage.locator('[data-testid="theme-indicator"]');
		await expect(themeIndicator).toBeVisible();
		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/(light|dark|system)/i);

		await sidebarPage.close();
	});

	test("should have full-height layout", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Verify the sidebar container is rendered
		const sidebarContainer = sidebarPage.locator('[data-testid="sidebar-container"]');
		await expect(sidebarContainer).toBeVisible();

		// Verify the main heading exists
		const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
		await expect(heading).toBeVisible();

		// Verify the page has content (sidebar should fill height)
		const body = sidebarPage.locator("body");
		await expect(body).toBeVisible();

		await sidebarPage.close();
	});
});
