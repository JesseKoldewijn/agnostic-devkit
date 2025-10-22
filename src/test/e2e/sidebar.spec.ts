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
		const heading = sidebarPage.getByRole("heading", {
			name: "Chrome Extension",
		});
		await expect(heading).toBeVisible();

		// Verify description text
		const description = sidebarPage.getByText(
			"Built with Vite + SolidJS + Tailwind CSS v4"
		);
		await expect(description).toBeVisible();

		// Verify theme indicator is visible
		const themeIndicator = sidebarPage.getByText(/Theme:/);
		await expect(themeIndicator).toBeVisible();

		await sidebarPage.close();
	});

	test("should display count button and increment on click", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);

		// Find the count button
		const countButton = sidebarPage.getByRole("button", { name: /Count:/ });
		await expect(countButton).toBeVisible();

		// Get initial count
		const initialText = await countButton.textContent();
		const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

		// Click the button
		await countButton.click();

		// Wait for state update
		await sidebarPage.waitForTimeout(100);

		// Verify count incremented
		const newText = await countButton.textContent();
		const newCount = parseInt(newText?.match(/\d+/)?.[0] || "0");
		expect(newCount).toBe(initialCount + 1);

		// Click again to verify it continues incrementing
		await countButton.click();
		await sidebarPage.waitForTimeout(100);

		const finalText = await countButton.textContent();
		const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || "0");
		expect(finalCount).toBe(initialCount + 2);

		await sidebarPage.close();
	});

	test("should have Open Options button that navigates to options page", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Find the Open Options button
		const openOptionsButton = sidebarPage.getByRole("button", {
			name: "Open Options",
		});
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
		const optionsHeading = optionsPage.getByRole("heading", {
			name: "Extension Options",
		});
		await expect(optionsHeading).toBeVisible();

		await sidebarPage.close();
		await optionsPage.close();
	});

	test("should display sidebar-specific content", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(
			extensionContext,
			extensionId
		);
		await sidebarPage.waitForLoadState("networkidle");

		// Verify sidebar-specific info card is visible
		const sidebarInfo = sidebarPage.getByText(
			"Sidebar mode provides a full-height panel for extended content and functionality."
		);
		await expect(sidebarInfo).toBeVisible();

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
		const themeIndicator = sidebarPage.getByText(
			/Theme: (light|dark|system)/
		);
		await expect(themeIndicator).toBeVisible();

		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/Theme: (light|dark|system)/);

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
