import type { Page } from "@playwright/test";
import { expect, test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

/**
 * E2E tests for preset management functionality (create, edit, delete, duplicate)
 */

test.describe("Preset Management E2E Tests", () => {
	let testPage: Page;
	let popupPage: Page;

	test.beforeEach(async ({ context, extensionId }) => {
		// Start with a clean test page and popup
		testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		popupPage = await openPopupPage(context, extensionId, tabId);

		// Go to manager
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
	});

	test.afterEach(async () => {
		if (popupPage) {
			await popupPage.close();
		}
		if (testPage) {
			await testPage.close();
		}
	});

	test("should create a new preset with parameters", async () => {
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

	test("should delete a preset", async () => {
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

	test("should duplicate a preset", async () => {
		// Create one
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Original");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Duplicate
		const presetItem = popupPage.locator('[data-testid="preset-item"]', { hasText: "Original" });
		await presetItem.locator('[data-testid="duplicate-preset-button"]').click();

		// Verify duplicate exists
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "Original (Copy)" })
		).toBeVisible();
	});

	test("should edit an existing preset", async () => {
		// Create
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("To Edit");
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("oldKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("oldValue");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Edit
		const presetItem = popupPage.locator('[data-testid="preset-item"]', { hasText: "To Edit" });
		await presetItem.locator('[data-testid="edit-preset-button"]').click();

		await popupPage.locator('[data-testid="preset-name-input"]').fill("Edited Name");
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("newKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("newValue");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Verify changes - name should be visible
		const editedPreset = popupPage.locator('[data-testid="preset-item"]', { hasText: "Edited Name" });
		await expect(editedPreset).toBeVisible();

		// Expand the preset to see parameters
		await editedPreset.locator('[data-testid="preset-expand-button"]').click();
		await expect(editedPreset.locator('[data-testid="preset-expanded-param"]')).toContainText(
			"newKey"
		);
	});

	test("should prefill queryParam type correctly when editing", async () => {
		// Create preset with queryParam (default) type
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("QueryParam Prefill Test");
		await popupPage.locator('[data-testid="add-parameter-button"]').click();

		// queryParam is the default, so we just need to fill key/value
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("testKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("testValue");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Wait for list to show
		await popupPage.waitForSelector('[data-testid="preset-item"]');

		// Edit the preset
		const presetItem = popupPage.locator('[data-testid="preset-item"]', {
			hasText: "QueryParam Prefill Test",
		});
		await presetItem.locator('[data-testid="edit-preset-button"]').click();

		// Verify the select shows queryParam
		const typeSelect = popupPage.locator('[data-testid="parameter-type-select"]').first();
		await expect(typeSelect).toHaveValue("queryParam");
	});

	test("should prefill cookie type correctly when editing", async () => {
		// Create preset with cookie type
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Cookie Prefill Test");
		await popupPage.locator('[data-testid="add-parameter-button"]').click();

		// Select cookie type
		await popupPage.locator('[data-testid="parameter-type-select"]').selectOption("cookie");
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("cookieKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("cookieValue");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Wait for list to show
		await popupPage.waitForSelector('[data-testid="preset-item"]');

		// Edit the preset
		const presetItem = popupPage.locator('[data-testid="preset-item"]', {
			hasText: "Cookie Prefill Test",
		});
		await presetItem.locator('[data-testid="edit-preset-button"]').click();

		// Verify the select shows cookie
		const typeSelect = popupPage.locator('[data-testid="parameter-type-select"]').first();
		await expect(typeSelect).toHaveValue("cookie");
	});

	test("should prefill localStorage type correctly when editing", async () => {
		// Create preset with localStorage type
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("LocalStorage Prefill Test");
		await popupPage.locator('[data-testid="add-parameter-button"]').click();

		// Select localStorage type
		await popupPage.locator('[data-testid="parameter-type-select"]').selectOption("localStorage");
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("storageKey");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("storageValue");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Wait for list to show
		await popupPage.waitForSelector('[data-testid="preset-item"]');

		// Edit the preset
		const presetItem = popupPage.locator('[data-testid="preset-item"]', {
			hasText: "LocalStorage Prefill Test",
		});
		await presetItem.locator('[data-testid="edit-preset-button"]').click();

		// Verify the select shows localStorage
		const typeSelect = popupPage.locator('[data-testid="parameter-type-select"]').first();
		await expect(typeSelect).toHaveValue("localStorage");
	});

	test("should export and import presets", async () => {
		// Create a preset to export
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Export Test");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Instead of evaluate with aliases, we'll use the UI buttons
		// Exporting triggers a download which is hard to verify in a simple way without more fixture setup,
		// so for now we'll just test the Import logic by providing a valid JSON string to the evaluate call
		// but using a simpler approach that doesn't rely on aliases.

		const importJson = JSON.stringify([
			{
				name: "Imported via E2E",
				parameters: [{ key: "imported", type: "queryParam", value: "true" }],
			},
		]);

		// We'll call the internal function by finding where it might be exposed or just testing the UI interaction
		// Actually, let's test the UI interaction for Import.
		// We can't easily 'click' a hidden file input, but we can set files.

		const importInput = popupPage.locator('[data-testid="import-presets-input"]');

		// Create a temporary file
		const path = "/tmp/test-presets.json";
		const fs = await import("node:fs");
		fs.writeFileSync(path, importJson);

		await importInput.setInputFiles(path);

		// Handle the alert if it appears
		popupPage.once("dialog", (alert) => alert.accept());

		// Verify imported
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "Imported via E2E" })
		).toBeVisible({ timeout: 10_000 });

		// Cleanup
		fs.unlinkSync(path);
	});

	test("should show individual export button for each preset", async () => {
		// Create a preset
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Export Single Test");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Verify export button is visible on the preset
		const presetItem = popupPage.locator('[data-testid="preset-item"]', {
			hasText: "Export Single Test",
		});
		await expect(presetItem.locator('[data-testid="export-preset-button"]')).toBeVisible();
	});

	test("should enter and exit selection mode", async () => {
		// Create presets to select
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Select Test 1");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Select Test 2");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Click select button to enter selection mode
		await popupPage.locator('[data-testid="select-mode-button"]').click();

		// Checkboxes should be visible
		await expect(popupPage.locator('[data-testid="preset-select-checkbox"]').first()).toBeVisible();

		// Export buttons should be hidden in selection mode
		await expect(
			popupPage.locator('[data-testid="export-preset-button"]').first()
		).not.toBeVisible();

		// Cancel button should be visible
		await expect(popupPage.locator('[data-testid="cancel-selection-button"]')).toBeVisible();

		// Exit selection mode
		await popupPage.locator('[data-testid="cancel-selection-button"]').click();

		// Checkboxes should be hidden again
		await expect(
			popupPage.locator('[data-testid="preset-select-checkbox"]').first()
		).not.toBeVisible();
	});

	test("should select and deselect presets in selection mode", async () => {
		// Create presets
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Selectable 1");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Selectable 2");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Enter selection mode
		await popupPage.locator('[data-testid="select-mode-button"]').click();

		// Select first preset
		const checkbox1 = popupPage
			.locator('[data-testid="preset-item"]', { hasText: "Selectable 1" })
			.locator('[data-testid="preset-select-checkbox"]');
		await checkbox1.click();

		// Export selected button should show count
		await expect(popupPage.locator('[data-testid="export-selected-button"]')).toContainText("1");

		// Select second preset
		const checkbox2 = popupPage
			.locator('[data-testid="preset-item"]', { hasText: "Selectable 2" })
			.locator('[data-testid="preset-select-checkbox"]');
		await checkbox2.click();

		// Export selected button should show updated count
		await expect(popupPage.locator('[data-testid="export-selected-button"]')).toContainText("2");

		// Deselect first preset
		await checkbox1.click();

		// Count should be back to 1
		await expect(popupPage.locator('[data-testid="export-selected-button"]')).toContainText("1");
	});

	test("should select all presets using Select All button", async () => {
		// Create presets
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("All 1");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("All 2");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Enter selection mode
		await popupPage.locator('[data-testid="select-mode-button"]').click();

		// Click Select All
		await popupPage.locator('[data-testid="select-all-button"]').click();

		// Export selected should show count of all presets
		await expect(popupPage.locator('[data-testid="export-selected-button"]')).toContainText("2");
	});
});
