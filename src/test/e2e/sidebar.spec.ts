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
		const heading = sidebarPage.locator("h1").filter({ hasText: "Parameter Presets" });
		await expect(heading).toBeVisible();

		// Verify "Current Tab" section exists
		const currentTab = sidebarPage.getByText("Current Tab");
		await expect(currentTab).toBeVisible();

		// Verify theme indicator is visible
		const themeIndicator = sidebarPage.locator(".text-secondary-foreground").first();
		await expect(themeIndicator).toBeVisible();

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
		const manageButton = sidebarPage.getByRole("button", { name: "Manage" });
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await sidebarPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const closeButton = sidebarPage.getByRole("button", { name: "Close" });
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
		const infoHeading = sidebarPage.getByRole("heading", {
			name: "About Presets",
		});
		await expect(infoHeading).toBeVisible();

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
		const currentTabLabel = sidebarPage.getByText("Current Tab");
		await expect(currentTabLabel).toBeVisible();

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
		const themeIndicator = sidebarPage.locator(".text-secondary-foreground").first();
		await expect(themeIndicator).toBeVisible();

		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/(light|dark|system)/);

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

		// Verify the main container has min-height class for full height
		const mainContainer = sidebarPage.locator(".min-h-screen");
		await expect(mainContainer).toBeVisible();

		await sidebarPage.close();
	});
});
