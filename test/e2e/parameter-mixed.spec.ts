import { test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

test.describe("Mixed Parameter Types Application", () => {
	test("should handle all parameter types in a single preset", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://example.org");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `All Types ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);

		// 1. Query Param
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage
			.locator('[data-testid="parameter-item-0"] [data-testid="parameter-key-input"]')
			.fill("q_key");
		await popupPage
			.locator('[data-testid="parameter-item-0"] [data-testid="parameter-value-input"]')
			.fill("q_val");

		// 2. Cookie
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		const secondParam = popupPage.locator('[data-testid="parameter-item-1"]');
		await secondParam.locator('[data-testid="parameter-type-select"]').selectOption("cookie");
		await secondParam.locator('[data-testid="parameter-key-input"]').fill("c_key");
		await secondParam.locator('[data-testid="parameter-value-input"]').fill("c_val");

		// 3. LocalStorage
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		const thirdParam = popupPage.locator('[data-testid="parameter-item-2"]');
		await thirdParam.locator('[data-testid="parameter-type-select"]').selectOption("localStorage");
		await thirdParam.locator('[data-testid="parameter-key-input"]').fill("l_key");
		await thirdParam.locator('[data-testid="parameter-value-input"]').fill("l_val");

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		const toggleItem = popupPage.locator('[data-testid="preset-toggle-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-toggle-name"]:text-is("${presetName}")`),
		});
		await toggleItem.locator('[data-testid="preset-toggle-checkbox"]').check({ force: true });
	});
});
