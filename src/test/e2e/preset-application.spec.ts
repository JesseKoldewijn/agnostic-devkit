import { test, expect } from "./core/fixtures";
import { openPopupPage, createTestPage, getTabId } from "./core/helpers";

/**
 * E2E tests for applying presets to tabs
 */

test.describe("Preset Application E2E Tests", () => {
	test("should apply a query parameter preset to a tab", async ({
		context,
		extensionId,
	}) => {
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);
		
		const presetName = `Query Preset ${Date.now()}`;
		
		// Create preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("test");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("value");
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();
		
		// Activate it
		const presetToggle = popupPage.locator('[data-testid="preset-toggle-item"]', { hasText: presetName }).locator('[data-testid="preset-toggle-checkbox"]');
		await presetToggle.check({ force: true });
		
		// Wait for completion
		await expect(presetToggle).toBeEnabled({ timeout: 10000 });
		
		// Verify URL changed
		await expect(testPage).toHaveURL(/.*test=value.*/);

		await popupPage.close();
		await testPage.close();
	});

	test("should deactivate a preset and remove its parameters", async ({
		context,
		extensionId,
	}) => {
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);
		
		const presetName = `Deactivate Test ${Date.now()}`;
		
		// Create preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("deact");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("val");
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();
		
		const presetToggle = popupPage.locator('[data-testid="preset-toggle-item"]', { hasText: presetName }).locator('[data-testid="preset-toggle-checkbox"]');
		
		// Activate
		await presetToggle.check({ force: true });
		await expect(testPage).toHaveURL(/.*deact=val.*/, { timeout: 10000 });
		
		// Wait for the toggle to be enabled again (finished previous operation)
		await expect(presetToggle).toBeEnabled({ timeout: 10000 });
		
		// Deactivate
		await presetToggle.uncheck({ force: true });
		
		// Wait for parameter removal from URL
		// Using a more robust check that handles potential reloads
		await expect(testPage).not.toHaveURL(/.*deact=val.*/, { timeout: 15000 });
		
		// Verify URL doesn't have it
		expect(testPage.url()).not.toContain("deact=val");

		await popupPage.close();
		await testPage.close();
	});
});
