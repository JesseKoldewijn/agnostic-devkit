import { test, expect } from "./core/fixtures";
import { openPopupPage, createTestPage, getTabId } from "./core/helpers";

/**
 * E2E tests for preset management functionality (create, edit, delete, duplicate)
 */

test.describe("Preset Management E2E Tests", () => {
	test.beforeEach(async ({ context, extensionId }) => {
		// Start with a clean test page and popup
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);
		
		// Go to manager
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
		
		(context as any).testPage = testPage;
		(context as any).popupPage = popupPage;
	});

	test.afterEach(async ({ context }) => {
		if ((context as any).popupPage) await (context as any).popupPage.close();
		if ((context as any).testPage) await (context as any).testPage.close();
	});

	test("should create a new preset with parameters", async ({ context }) => {
		const popupPage = (context as any).popupPage;
		const presetName = `Test Preset ${Date.now()}`;
		
		// Click create
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		
		// Fill name
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		
		// Add parameter
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').first().fill("testKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').first().fill("testValue");
		
		// Save
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		
		// Verify in list
		await expect(popupPage.locator('[data-testid="preset-item"]')).toContainText(presetName);
	});

	test("should delete a preset", async ({ context }) => {
		const popupPage = (context as any).popupPage;
		
		// Create one first to be sure
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("To Delete");
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		
		// Find delete button for this preset
		const presetItem = popupPage.locator('[data-testid="preset-item"]', { hasText: "To Delete" });
		await presetItem.locator('[data-testid="delete-preset-button"]').click();
		
		// Confirm delete
		await presetItem.locator('[data-testid="confirm-delete-button"]').click();
		
		// Verify gone
		await expect(presetItem).not.toBeVisible();
	});

	test("should duplicate a preset", async ({ context }) => {
		const popupPage = (context as any).popupPage;
		
		// Create one
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Original");
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		
		// Duplicate
		const presetItem = popupPage.locator('[data-testid="preset-item"]', { hasText: "Original" });
		await presetItem.locator('[data-testid="duplicate-preset-button"]').click();
		
		// Verify duplicate exists
		await expect(popupPage.locator('[data-testid="preset-item"]', { hasText: "Original (Copy)" })).toBeVisible();
	});
});
