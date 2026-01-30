import { expect, test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

/**
 * Advanced E2E tests for presets (multiple parameters, different types)
 */

test.describe("Advanced Preset E2E Tests", () => {
	test("should apply a preset with multiple parameter types", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		const presetName = `Multi Type Preset ${Date.now()}`;

		// Create preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);

		// Query param
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').nth(0).fill("q");
		await popupPage.locator('[data-testid="parameter-value-input"]').nth(0).fill("v");

		// Cookie
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-type-select"]').nth(1).selectOption("cookie");
		await popupPage.locator('[data-testid="parameter-key-input"]').nth(1).fill("c");
		await popupPage.locator('[data-testid="parameter-value-input"]').nth(1).fill("cv");

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		// Activate
		const presetToggle = popupPage
			.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
			.locator('[data-testid="preset-toggle-checkbox"]');
		await presetToggle.check({ force: true });

		// Wait for completion
		await expect(presetToggle).toBeEnabled({ timeout: 10_000 });

		// Wait for application
		await testPage.waitForURL(/.*q=v.*/, { timeout: 10_000 });

		// Verify Cookie (check via evaluating in page)
		// Wait for background script to finish cookie setting and for browser to sync
		await popupPage.waitForTimeout(3000);

		// Verify via context cookies (more reliable than document.cookie in some environments)
		const cookies = await context.cookies(testPage.url());
		const cookie = cookies.find((c) => c.name === "c");
		expect(cookie?.value).toBe("cv");

		// Fallback check in page
		const cookieValue = await testPage.evaluate(() => document.cookie);
		expect(cookieValue).toContain("c=cv");

		await popupPage.close();
		await testPage.close();
	});
});
