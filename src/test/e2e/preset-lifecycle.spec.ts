import { expect, test } from "./core/fixtures";
import { openPopupPage } from "./core/helpers";

// Increase timeout for lifecycle tests
test.setTimeout(60_000);

test.describe("Preset Lifecycle", () => {
	test("should perform full CRUD on presets in PresetManager", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);

		// 1. Create
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `CRUD Test ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// 2. Read
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${presetName}")`)
		).toBeVisible();

		// 3. Update (Edit)
		const presetItem = popupPage.locator('[data-testid="preset-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-name"]:text-is("${presetName}")`),
		});
		await presetItem.locator('[data-testid="edit-preset-button"]').click();

		const updatedName = `${presetName} Updated`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(updatedName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${updatedName}")`)
		).toBeVisible();

		// 4. Duplicate
		const updatedItem = popupPage.locator('[data-testid="preset-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-name"]:text-is("${updatedName}")`),
		});
		await updatedItem.locator('[data-testid="duplicate-preset-button"]').click();

		// Match the actual naming pattern in presetManager.ts: `${original.name} (Copy)`
		const duplicateName = `${updatedName} (Copy)`;
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${duplicateName}")`)
		).toBeVisible({ timeout: 15_000 });

		// 5. Reorder (Drag and Drop)
		const presets = popupPage.locator('[data-testid="preset-item"]');
		const count = await presets.count();
		if (count >= 2) {
			await presets.nth(0).dragTo(presets.nth(1));
		}

		// 6. Toggle in main list
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		const toggleItem = popupPage.locator('[data-testid="preset-toggle-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-toggle-name"]:text-is("${updatedName}")`),
		});
		const checkbox = toggleItem.locator('[data-testid="preset-toggle-checkbox"]');

		await checkbox.check({ force: true });
		await expect(checkbox).toBeChecked();
		await checkbox.uncheck({ force: true });
		await expect(checkbox).not.toBeChecked();

		// 7. Delete
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		const deleteItem = popupPage.locator('[data-testid="preset-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-name"]:text-is("${updatedName}")`),
		});
		await deleteItem.locator('[data-testid="delete-preset-button"]').click();
		await popupPage.locator('[data-testid="confirm-delete-button"]').click();
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${updatedName}")`)
		).not.toBeVisible();
	});

	test("should export and import presets", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);
		await popupPage.locator('[data-testid="manage-presets-button"]').click();

		// Verify export button opens export view
		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await expect(popupPage.locator('[data-testid="preset-export-view"]')).toBeVisible();

		// Go back to list view
		await popupPage.locator('[data-testid="export-back-button"]').click();
		await expect(popupPage.locator('[data-testid="preset-manager-list"]')).toBeVisible();

		// Verify import input is available in list view
		const importInput = popupPage.locator('[data-testid="import-presets-input"]');
		await expect(importInput).toBeAttached();
	});
});
