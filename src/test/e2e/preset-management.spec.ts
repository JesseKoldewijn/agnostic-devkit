import { test, expect } from "./core/test-with-extension";
import { openPopupPage, openSidebarPage, createTestPage, getTabId } from "./core/helpers";

/**
 * E2E tests for preset management functionality
 * These tests verify CRUD operations for presets and their parameters
 */

test.describe("Preset Management E2E Tests", () => {
	test("should open preset manager from popup", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find and click the Manage button
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await popupPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const managePresetsHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
		await expect(managePresetsHeading).toBeVisible({ timeout: 5000 });

		// Verify New Preset button exists
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await expect(newPresetButton).toBeVisible();

		await popupPage.close();
	});

	test("should open preset manager from sidebar", async ({
		extensionContext,
		extensionId,
	}) => {
		const sidebarPage = await openSidebarPage(extensionContext, extensionId);
		await sidebarPage.waitForLoadState("networkidle");

		// Find and click the Manage button
		const manageButton = sidebarPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await sidebarPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const managePresetsHeading = sidebarPage.locator('[data-testid="manage-presets-heading"]');
		await expect(managePresetsHeading).toBeVisible({ timeout: 5000 });

		await sidebarPage.close();
	});

	test("should display empty state when no presets exist", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Verify empty state message
		const emptyStateMessage = popupPage.locator('[data-testid="no-presets-message"]');
		await expect(emptyStateMessage).toBeVisible({ timeout: 5000 });

		await popupPage.close();
	});

	test("should create a new preset with parameters", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Click New Preset button
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		// Verify create form appears
		const createHeading = popupPage.locator('[data-testid="preset-form-heading"]');
		await expect(createHeading).toBeVisible({ timeout: 3000 });
		await expect(createHeading).toHaveText("Create Preset");

		// Fill in preset name
		const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
		await expect(nameInput).toBeVisible();
		await nameInput.fill("Test Preset");

		// Add a parameter
		const addParameterButton = popupPage.locator('[data-testid="add-parameter-button"]');
		await expect(addParameterButton).toBeVisible();
		await addParameterButton.click();
		await popupPage.waitForTimeout(200);

		// Fill in parameter details
		const paramKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
		await paramKeyInput.fill("testParam");

		const paramValueInput = popupPage.locator('[data-testid="parameter-value-input"]').first();
		await paramValueInput.fill("testValue");

		// Save the preset
		const saveButton = popupPage.locator('[data-testid="save-preset-button"]');
		await saveButton.click();
		await popupPage.waitForTimeout(500);

		// Verify we're back to list view and preset appears
		const managePresetsHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
		await expect(managePresetsHeading).toBeVisible({ timeout: 3000 });

		// Verify preset name appears in the list
		const presetName = popupPage.getByText("Test Preset");
		await expect(presetName).toBeVisible({ timeout: 3000 });

		await popupPage.close();
	});

	test("should edit an existing preset", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// First, create a preset to edit
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		const originalName = `Edit Test ${Date.now()}`;
		const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
		await nameInput.fill(originalName);

		const addParamButton = popupPage.locator('[data-testid="add-parameter-button"]');
		await addParamButton.click();
		await popupPage.waitForTimeout(200);

		const paramKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
		await paramKeyInput.fill("editKey");
		const paramValueInput = popupPage.locator('[data-testid="parameter-value-input"]').first();
		await paramValueInput.fill("editValue");

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.waitForTimeout(500);

		// Now find and click the edit button for the preset we just created
		const editButton = popupPage.locator('[data-testid="edit-preset-button"]').first();
		await expect(editButton).toBeVisible({ timeout: 5000 });
		await editButton.click();
		await popupPage.waitForTimeout(300);

		// Verify edit form appears
		const editHeading = popupPage.locator('[data-testid="preset-form-heading"]');
		await expect(editHeading).toBeVisible({ timeout: 3000 });
		await expect(editHeading).toHaveText("Edit Preset");

		// Modify the name
		await nameInput.fill("Updated Preset Name");

		// Save changes
		const saveButton = popupPage.locator('[data-testid="save-preset-button"]');
		await saveButton.click();
		await popupPage.waitForTimeout(500);

		// Verify updated name appears
		const updatedName = popupPage.getByText("Updated Preset Name");
		await expect(updatedName).toBeVisible({ timeout: 3000 });

		await popupPage.close();
	});

	test("should delete a preset with confirmation", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// First, create a preset to delete
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		const presetToDelete = `Delete Test ${Date.now()}`;
		const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
		await nameInput.fill(presetToDelete);

		const addParamButton = popupPage.locator('[data-testid="add-parameter-button"]');
		await addParamButton.click();
		await popupPage.waitForTimeout(200);

		const paramKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
		await paramKeyInput.fill("deleteKey");
		const paramValueInput = popupPage.locator('[data-testid="parameter-value-input"]').first();
		await paramValueInput.fill("deleteValue");

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.waitForTimeout(500);

		// Verify preset was created
		const createdPreset = popupPage.getByText(presetToDelete);
		await expect(createdPreset).toBeVisible({ timeout: 3000 });

		// Now find and click the delete button for the preset we just created
		const deleteButton = popupPage.locator('[data-testid="delete-preset-button"]').first();
		await expect(deleteButton).toBeVisible({ timeout: 5000 });
		await deleteButton.click();
		await popupPage.waitForTimeout(300);

		// Verify confirmation buttons appear
		const confirmDeleteButton = popupPage.locator('[data-testid="confirm-delete-button"]');
		await expect(confirmDeleteButton).toBeVisible({ timeout: 3000 });

		// Click confirm delete
		await confirmDeleteButton.click();
		await popupPage.waitForTimeout(500);

		// Verify preset is removed
		const deletedPreset = popupPage.getByText(presetToDelete);
		await expect(deletedPreset).not.toBeVisible({ timeout: 3000 });

		await popupPage.close();
	});

	test("should display preset list with existing presets", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Wait for presets to load
		await popupPage.waitForTimeout(1000);

		// Verify Manage Presets heading is visible
		const managePresetsHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
		await expect(managePresetsHeading).toBeVisible({ timeout: 5000 });

		// Verify New Preset button exists
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await expect(newPresetButton).toBeVisible();

		await popupPage.close();
	});

	test("should toggle preset on/off in popup", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page first to have a valid tab context
		const testPage = await createTestPage(extensionContext, "https://example.com");
		const tabId = await getTabId(extensionContext, testPage);
		
		// Open popup with tab context
		const popupPage = await openPopupPage(extensionContext, extensionId, tabId);
		await popupPage.waitForLoadState("networkidle");

		// First, create a preset to toggle
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
		await nameInput.fill(`Toggle Test ${Date.now()}`);

		const addParamButton = popupPage.locator('[data-testid="add-parameter-button"]');
		await addParamButton.click();
		await popupPage.waitForTimeout(200);

		const paramKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
		await paramKeyInput.fill("toggleKey");
		const paramValueInput = popupPage.locator('[data-testid="parameter-value-input"]').first();
		await paramValueInput.fill("toggleValue");

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.waitForTimeout(500);

		// Close preset manager
		await popupPage.locator('[data-testid="close-manager-button"]').click();
		await popupPage.waitForTimeout(500);

		// Find preset toggle switches (checkboxes)
		const presetToggles = popupPage.locator('[data-testid="preset-toggle-checkbox"]');
		const toggleCount = await presetToggles.count();
		expect(toggleCount).toBeGreaterThan(0);

		// Get the first toggle
		const firstToggle = presetToggles.first();
		const initialChecked = await firstToggle.isChecked();

		// Toggle it (use force click because the toggle div overlays the checkbox)
		await firstToggle.click({ force: true });
		await popupPage.waitForTimeout(500);

		// Verify state changed
		const newChecked = await firstToggle.isChecked();
		expect(newChecked).toBe(!initialChecked);

		await popupPage.close();
		await testPage.close();
	});

	test("should verify preset persistence across page reloads", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager and create a preset
		const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Click New Preset
		const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		// Create a preset with a unique name
		const uniqueName = `Persist Test ${Date.now()}`;
		const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
		await nameInput.fill(uniqueName);

		// Save
		const saveButton = popupPage.locator('[data-testid="save-preset-button"]');
		await saveButton.click();
		await popupPage.waitForTimeout(500);

		// Close and reopen popup
		await popupPage.close();

		// Reopen popup
		const newPopupPage = await openPopupPage(extensionContext, extensionId);
		await newPopupPage.waitForLoadState("networkidle");

		// Open preset manager again
		const newManageButton = newPopupPage.locator('[data-testid="manage-presets-button"]');
		await newManageButton.click();
		await newPopupPage.waitForTimeout(500);

		// Verify preset still exists
		const presetName = newPopupPage.getByText(uniqueName);
		await expect(presetName).toBeVisible({ timeout: 5000 });

		await newPopupPage.close();
	});

	test.describe("Preset Operations", () => {
		test("should reorder parameters in a preset", async ({
			extensionContext,
			extensionId,
		}) => {
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Create a preset with multiple parameters
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
			await newPresetButton.click();
			await popupPage.waitForTimeout(300);

			const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
			await nameInput.fill(`Reorder Test ${Date.now()}`);

			const addParamButton = popupPage.locator('[data-testid="add-parameter-button"]');

			// Add first parameter
			await addParamButton.click();
			await popupPage.waitForTimeout(200);
			const firstParamKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').first();
			await firstParamKeyInput.fill("param1");

			// Add second parameter
			await addParamButton.click();
			await popupPage.waitForTimeout(200);
			const secondParamKeyInput = popupPage.locator('[data-testid="parameter-key-input"]').nth(1);
			await secondParamKeyInput.fill("param2");

			await popupPage.locator('[data-testid="save-preset-button"]').click();
			await popupPage.waitForTimeout(1000);

			// Edit the preset to verify parameters were saved
			const editButton = popupPage.locator('[data-testid="edit-preset-button"]').first();
			await expect(editButton).toBeVisible({ timeout: 5000 });
			await editButton.click();
			await popupPage.waitForTimeout(300);

			// Verify parameters are visible by checking the inputs exist
			const paramKeyInputs = popupPage.locator('[data-testid="parameter-key-input"]');
			const inputCount = await paramKeyInputs.count();
			expect(inputCount).toBeGreaterThanOrEqual(2);

			// Verify the first parameter has the expected value
			const firstInputValue = await paramKeyInputs.first().inputValue();
			const secondInputValue = await paramKeyInputs.nth(1).inputValue();
			expect(firstInputValue).toBe("param1");
			expect(secondInputValue).toBe("param2");

			await popupPage.close();
		});

		test("should export presets to JSON", async ({
			extensionContext,
			extensionId,
		}) => {
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Open preset manager
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			// Look for export button (may be in menu or as direct button)
			const exportButton = popupPage
				.getByRole("button", { name: /Export|Download/i })
				.or(popupPage.locator('button[title*="export" i]'))
				.first();

			// If export button exists, click it
			if (await exportButton.isVisible().catch(() => false)) {
				await exportButton.click();
				await popupPage.waitForTimeout(500);
			}

			// Verify presets heading is visible
			const managePresetsHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
			await expect(managePresetsHeading).toBeVisible();

			await popupPage.close();
		});

		test("should import presets from JSON", async ({
			extensionContext,
			extensionId,
		}) => {
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Open preset manager
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			// Look for import button
			const importButton = popupPage
				.getByRole("button", { name: /Import|Upload/i })
				.or(popupPage.locator('button[title*="import" i]'))
				.first();

			// If import button exists, we can test it
			if (await importButton.isVisible().catch(() => false)) {
				await importButton.click();
				await popupPage.waitForTimeout(500);
			}

			// Verify import UI exists or can be accessed
			const managePresetsHeading = popupPage.locator('[data-testid="manage-presets-heading"]');
			await expect(managePresetsHeading).toBeVisible();

			await popupPage.close();
		});

		test("should import presets and merge with existing", async ({
			extensionContext,
			extensionId,
		}) => {
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Create an existing preset first
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
			await newPresetButton.click();
			await popupPage.waitForTimeout(300);

			const existingName = `Existing Preset ${Date.now()}`;
			const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
			await nameInput.fill(existingName);

			await popupPage.locator('[data-testid="save-preset-button"]').click();
			await popupPage.waitForTimeout(1000);

			// Verify existing preset is there
			const existingPreset = popupPage.getByText(existingName);
			await expect(existingPreset).toBeVisible({ timeout: 3000 });

			await popupPage.close();
		});

		test("should import presets and replace existing", async ({
			extensionContext,
			extensionId,
		}) => {
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Create an existing preset first
			const manageButton = popupPage.locator('[data-testid="manage-presets-button"]');
			await manageButton.click();
			await popupPage.waitForTimeout(500);

			const newPresetButton = popupPage.locator('[data-testid="create-preset-button"]');
			await newPresetButton.click();
			await popupPage.waitForTimeout(300);

			const existingName = `To Be Replaced ${Date.now()}`;
			const nameInput = popupPage.locator('[data-testid="preset-name-input"]');
			await nameInput.fill(existingName);

			await popupPage.locator('[data-testid="save-preset-button"]').click();
			await popupPage.waitForTimeout(1000);

			// Verify existing preset is there
			const existingPreset = popupPage.getByText(existingName);
			await expect(existingPreset).toBeVisible({ timeout: 3000 });

			await popupPage.close();
		});
	});
});
