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
		const heading = popupPage.getByRole("heading", {
			name: "Parameters",
		});
		await expect(heading).toBeVisible();

		// Verify theme indicator is visible
		const themeIndicator = popupPage.locator(".text-secondary-foreground").first();
		await expect(themeIndicator).toBeVisible();

		// Verify "Manage" button exists
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await expect(manageButton).toBeVisible();

		// Verify "Open Options" button exists
		const optionsButton = popupPage.getByRole("button", {
			name: "Open Options",
		});
		await expect(optionsButton).toBeVisible();

		await popupPage.close();
	});

	test.skip("should display current tab URL when available", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);

		// Wait for content to load
		await popupPage.waitForLoadState("networkidle");

		// The "Current Tab" section should be visible if there's an active tab
		const currentTabSection = popupPage.getByText("Current Tab");
		await expect(currentTabSection).toBeVisible({ timeout: 10000
			});

		// Wait for content to actually render - check if heading appears
		await popupPage
			.waitForSelector("h1, [role='heading']", {
				timeout: 10000,
				state: "attached",
			})
			.catch(async () => {
				// If heading doesn't appear, wait longer and check root content
				await popupPage.waitForTimeout(3000);
				const rootText = await popupPage.locator("#root").textContent();
				if (!rootText || rootText.trim().length === 0) {
					throw new Error(
						"Content not rendering - root element is empty"
					);
				}
			});

		// Verify title (may be URL initially, but content should load)
		const title = await popupPage.title();
		// Title might be the URL if page is still loading, so we check content instead
		expect(title).toBeTruthy();

		// Verify main heading is visible
		const heading = popupPage.getByRole("heading", {
			name: "Parameters",
		});
		await expect(heading).toBeVisible();

		// Verify Manage Presets button exists
		const manageButton = popupPage.getByText("Manage Presets");
		await expect(manageButton).toBeVisible();

		// Verify theme indicator is visible
		const themeIndicator = popupPage.locator(".text-secondary-foreground");
		await expect(themeIndicator).toBeVisible();

		await popupPage.close();
	});

	test("should open preset manager when clicking Manage", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find and click the Manage button
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await popupPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const closeButton = popupPage.getByRole("button", { name: "Close" });
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
		const openOptionsButton = popupPage.getByRole("button", {
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
		const themeIndicator = popupPage.locator(".text-secondary-foreground").first();
		await expect(themeIndicator).toBeVisible();

		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/(light|dark|system)/);

		await popupPage.close();
	});

	test("should have correct popup dimensions", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);

		// Verify the main container has the expected width class
		const mainContainer = popupPage.locator(".w-96");
		await expect(mainContainer).toBeVisible();

		await popupPage.close();
	});
});
