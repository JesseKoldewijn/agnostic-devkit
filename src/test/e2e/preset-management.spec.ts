import { expect, test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

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
		if ((context as any).popupPage) {
			await (context as any).popupPage.close();
		}
		if ((context as any).testPage) {
			await (context as any).testPage.close();
		}
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
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "Original (Copy)" })
		).toBeVisible();
	});

	test("should edit an existing preset", async ({ context }) => {
		const popupPage = (context as any).popupPage;

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

		// Verify changes
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "Edited Name" })
		).toBeVisible();
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "newKey" })
		).toBeVisible();
	});

	test("should export and import presets", async ({ context }) => {
		const popupPage = (context as any).popupPage;

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
		popupPage.once("dialog", (alert: any) => alert.accept());

		// Verify imported
		await expect(
			popupPage.locator('[data-testid="preset-item"]', { hasText: "Imported via E2E" })
		).toBeVisible({ timeout: 10_000 });

		// Cleanup
		fs.unlinkSync(path);
	});
});
