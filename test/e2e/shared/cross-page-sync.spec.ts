import { expect, test } from "../core/fixtures";
import { openPopupPage, openSettingsPage, openSidebarPage } from "../core/helpers";

/**
 * E2E tests for cross-page synchronization
 * Verifies that changes in one extension page (e.g. Options)
 * are immediately reflected in others (e.g. Popup)
 */

test.describe("Cross-Page Synchronization E2E Tests", () => {
	test("should sync theme changes from options to popup", async ({ context, extensionId }) => {
		const optionsPage = await openSettingsPage(context, extensionId);
		const popupPage = await openPopupPage(context, extensionId);

		// Initial state
		await expect(popupPage.locator('[data-testid="theme-indicator"]')).toBeVisible();

		// Change theme in options
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		await themeSelect.selectOption("dark");
		await themeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));

		// Verify popup updated immediately
		await expect(popupPage.locator('[data-testid="theme-indicator"]')).toHaveText("dark", {
			timeout: 5000,
		});

		// Change back to light
		await themeSelect.selectOption("light");
		await themeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
		await expect(popupPage.locator('[data-testid="theme-indicator"]')).toHaveText("light", {
			timeout: 5000,
		});

		await popupPage.close();
		await optionsPage.close();
	});

	test("should sync preset list changes between popup and sidebar", async ({
		context,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(context, extensionId);
		const sidebarPage = await openSidebarPage(context, extensionId);

		const presetName = `Sync Test ${Date.now()}`;

		// Verify both show "no presets" initially (if clean) or at least are loaded
		await expect(popupPage.locator('[data-testid="presets-heading"]')).toBeVisible();
		await expect(sidebarPage.locator('[data-testid="presets-heading"]')).toBeVisible();

		// Create preset in popup
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		// Verify appears in sidebar immediately
		await expect(
			sidebarPage.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
		).toBeVisible({ timeout: 5000 });

		// Delete in sidebar
		await sidebarPage.locator('[data-testid="manage-presets-button"]').click();
		const presetItem = sidebarPage.locator('[data-testid="preset-item"]', { hasText: presetName });
		await presetItem.locator('[data-testid="delete-preset-button"]').click();
		await presetItem.locator('[data-testid="confirm-delete-button"]').click();

		// Verify gone from popup
		await expect(
			popupPage.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
		).not.toBeVisible({ timeout: 5000 });

		await popupPage.close();
		await sidebarPage.close();
	});
});
