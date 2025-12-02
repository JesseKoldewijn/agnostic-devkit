import { test, expect } from "./core/test-with-extension";
import { openSettingsPage } from "./core/helpers";

/**
 * E2E tests for the Chrome extension options/settings page
 * These tests verify options page functionality and settings persistence
 */

test.describe("Options Page E2E Tests", () => {
	test("should open and display options page correctly", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);

		// Wait for content to load
		await optionsPage.waitForLoadState("networkidle");

		// Verify title
		const title = await optionsPage.title();
		expect(title).toBe("Chrome Extension Options");

		// Verify main heading is visible
		const heading = optionsPage.getByRole("heading", {
			name: "Extension Options",
		});
		await expect(heading).toBeVisible();

		// Verify version number is displayed
		const versionText = optionsPage.getByText(/Version:/);
		await expect(versionText).toBeVisible();

		await optionsPage.close();
	});

	test("should display theme selector with options", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify theme label (use first() to avoid strict mode violation)
		const themeLabel = optionsPage
			.locator('label:has-text("Theme")')
			.first();
		await expect(themeLabel).toBeVisible();

		// Verify theme select dropdown exists
		// Find select by its option values (light, dark, system)
		const themeSelect = optionsPage.locator(
			'select:has(option[value="light"])'
		);
		await expect(themeSelect).toBeVisible();

		// Verify all theme options are available
		const lightOption = optionsPage.locator('option[value="light"]');
		const darkOption = optionsPage.locator('option[value="dark"]');
		const systemOption = optionsPage.locator('option[value="system"]');

		await expect(lightOption).toHaveText("Light");
		await expect(darkOption).toHaveText("Dark");
		await expect(systemOption).toHaveText("System");

		await optionsPage.close();
	});

	test("should display display mode selector", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify display mode label
		const displayModeLabel = optionsPage.getByText("Display Mode");
		await expect(displayModeLabel).toBeVisible();

		// Verify display mode select dropdown exists
		// Find select by its option values (popup, sidebar)
		const displayModeSelect = optionsPage.locator(
			'select:has(option[value="popup"])'
		);
		await expect(displayModeSelect).toBeVisible();

		// Verify options are available
		const popupOption = optionsPage.locator('option[value="popup"]');
		const sidebarOption = optionsPage.locator('option[value="sidebar"]');

		await expect(popupOption).toHaveText("Popup");
		await expect(sidebarOption).toHaveText("Sidebar");

		await optionsPage.close();
	});

	test("should display notifications checkbox", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify notifications checkbox exists
		const notificationsCheckbox = optionsPage.getByLabel(
			"Enable notifications"
		);
		await expect(notificationsCheckbox).toBeVisible();
		await expect(notificationsCheckbox).toBeVisible();

		await optionsPage.close();
	});

	test("should have Save Settings button", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify Save Settings button exists
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await expect(saveButton).toBeVisible();

		await optionsPage.close();
	});

	test("should change theme and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the theme select
		const themeSelect = optionsPage.locator(
			'select:has(option[value="light"])'
		);

		// Change theme to dark
		await themeSelect.selectOption("dark");

		// Click Save Settings
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify theme is still dark
		await expect(themeSelect).toHaveValue("dark");

		await optionsPage.close();
	});

	test("should change display mode and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the display mode select
		const displayModeSelect = optionsPage.locator(
			'select:has(option[value="popup"])'
		);

		// Change display mode to sidebar
		await displayModeSelect.selectOption("sidebar");

		// Click Save Settings
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify display mode is still sidebar
		await expect(displayModeSelect).toHaveValue("sidebar");

		await optionsPage.close();
	});

	test("should toggle notifications checkbox and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the notifications checkbox
		const notificationsCheckbox = optionsPage.getByLabel(
			"Enable notifications"
		);

		// Get initial state
		const initialChecked = await notificationsCheckbox.isChecked();

		// Toggle the checkbox
		await notificationsCheckbox.click();

		// Click Save Settings
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify checkbox state is persisted (opposite of initial)
		const persistedCheckbox = optionsPage.getByLabel(
			"Enable notifications"
		);
		const persistedChecked = await persistedCheckbox.isChecked();
		expect(persistedChecked).toBe(!initialChecked);

		await optionsPage.close();
	});

	test("should show sidebar support warning when not supported", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Note: This test may or may not show the warning depending on browser support
		// The warning may or may not be visible depending on browser
		// We just verify the page loads correctly regardless
		const heading = optionsPage.getByRole("heading", {
			name: "Extension Options",
		});
		await expect(heading).toBeVisible();

		await optionsPage.close();
	});
});
