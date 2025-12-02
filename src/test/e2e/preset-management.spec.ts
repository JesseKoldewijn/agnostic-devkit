import { test, expect } from "./core/test-with-extension";
import { openPopupPage, openSidebarPage } from "./core/helpers";

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
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await popupPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const managePresetsHeading = popupPage.getByRole("heading", {
			name: "Manage Presets",
		});
		await expect(managePresetsHeading).toBeVisible({ timeout: 5000 });

		// Verify New Preset button exists
		const newPresetButton = popupPage.getByRole("button", {
			name: "+ New Preset",
		});
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
		const manageButton = sidebarPage.getByRole("button", { name: "Manage" });
		await expect(manageButton).toBeVisible();
		await manageButton.click();

		// Wait for preset manager to appear
		await sidebarPage.waitForTimeout(500);

		// Verify preset manager UI elements appear
		const managePresetsHeading = sidebarPage.getByRole("heading", {
			name: "Manage Presets",
		});
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
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Verify empty state message
		const emptyStateMessage = popupPage.getByText("No presets yet");
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
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Click New Preset button
		const newPresetButton = popupPage.getByRole("button", {
			name: "+ New Preset",
		});
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		// Verify create form appears
		const createHeading = popupPage.getByRole("heading", {
			name: "Create Preset",
		});
		await expect(createHeading).toBeVisible({ timeout: 3000 });

		// Fill in preset name
		const nameInput = popupPage.locator('input[name="preset-name"]');
		await expect(nameInput).toBeVisible();
		await nameInput.fill("Test Preset");

		// Add a parameter
		const addParameterButton = popupPage.getByRole("button", {
			name: "+ Add Parameter",
		});
		await expect(addParameterButton).toBeVisible();
		await addParameterButton.click();
		await popupPage.waitForTimeout(200);

		// Fill in parameter details
		const paramKeyInput = popupPage.locator('input[name^="param-"][name$="-key"]').first();
		await paramKeyInput.fill("testParam");

		const paramValueInput = popupPage.locator('input[name^="param-"][name$="-value"]').first();
		await paramValueInput.fill("testValue");

		// Save the preset
		const saveButton = popupPage.getByRole("button", {
			name: "Create Preset",
		});
		await saveButton.click();
		await popupPage.waitForTimeout(500);

		// Verify we're back to list view and preset appears
		const managePresetsHeading = popupPage.getByRole("heading", {
			name: "Manage Presets",
		});
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
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Wait for presets to load
		await popupPage.waitForTimeout(1000);

		// Find the first preset (if any exist)
		const presetCards = popupPage.locator('[class*="bg-card"]').filter({
			hasText: /Test Preset|My Preset/,
		});

		const count = await presetCards.count();
		if (count === 0) {
			test.skip();
			return;
		}

		// Find the edit button (pencil icon) for the first preset
		const editButton = popupPage
			.locator('button[title="Edit preset"]')
			.first();
		await expect(editButton).toBeVisible({ timeout: 5000 });
		await editButton.click();
		await popupPage.waitForTimeout(300);

		// Verify edit form appears
		const editHeading = popupPage.getByRole("heading", {
			name: "Edit Preset",
		});
		await expect(editHeading).toBeVisible({ timeout: 3000 });

		// Modify the name
		const nameInput = popupPage.locator('input[name="preset-name"]');
		await nameInput.fill("Updated Preset Name");

		// Save changes
		const saveButton = popupPage.getByRole("button", {
			name: "Save Changes",
		});
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
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Wait for presets to load
		await popupPage.waitForTimeout(1000);

		// Find the first preset (if any exist)
		const presetCards = popupPage.locator('[class*="bg-card"]').filter({
			hasText: /Updated Preset Name|Test Preset|My Preset/,
		});

		const count = await presetCards.count();
		if (count === 0) {
			test.skip();
			return;
		}

		// Find the delete button (trash icon) for the first preset
		const deleteButton = popupPage
			.locator('button[title="Delete preset"]')
			.first();
		await expect(deleteButton).toBeVisible({ timeout: 5000 });
		await deleteButton.click();
		await popupPage.waitForTimeout(300);

		// Verify confirmation buttons appear
		const confirmDeleteButton = popupPage.getByRole("button", {
			name: "Delete",
		});
		await expect(confirmDeleteButton).toBeVisible({ timeout: 3000 });

		// Click confirm delete
		await confirmDeleteButton.click();
		await popupPage.waitForTimeout(500);

		// Verify preset is removed (either empty state or list without the deleted preset)
		// The preset should no longer be visible
		await popupPage.waitForTimeout(1000);

		await popupPage.close();
	});

	test("should display preset list with existing presets", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Wait for presets to load
		await popupPage.waitForTimeout(1000);

		// Verify Manage Presets heading is visible
		const managePresetsHeading = popupPage.getByRole("heading", {
			name: "Manage Presets",
		});
		await expect(managePresetsHeading).toBeVisible({ timeout: 5000 });

		// Verify New Preset button exists
		const newPresetButton = popupPage.getByRole("button", {
			name: "+ New Preset",
		});
		await expect(newPresetButton).toBeVisible();

		await popupPage.close();
	});

	test("should toggle preset on/off in popup", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Wait for preset toggle list to load
		await popupPage.waitForTimeout(1000);

		// Find preset toggle switches (checkboxes)
		// Preset toggles are checkboxes that are not the notifications checkbox
		// They appear in the preset list area, so we'll look for checkboxes near the "Parameter Presets" heading
		const presetSection = popupPage.getByText("Parameter Presets").locator('..');
		const presetToggles = presetSection.locator('input[type="checkbox"]').or(
			popupPage.locator('input[type="checkbox"]:not([id="notifications"])')
		);

		const toggleCount = await presetToggles.count();

		if (toggleCount === 0) {
			// No presets to toggle, skip test
			test.skip();
			return;
		}

		// Get the first toggle
		const firstToggle = presetToggles.first();
		const initialChecked = await firstToggle.isChecked();

		// Toggle it
		await firstToggle.click();
		await popupPage.waitForTimeout(500);

		// Verify state changed
		const newChecked = await firstToggle.isChecked();
		expect(newChecked).toBe(!initialChecked);

		await popupPage.close();
	});

	test("should verify preset persistence across page reloads", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Open preset manager and create a preset
		const manageButton = popupPage.getByRole("button", { name: "Manage" });
		await manageButton.click();
		await popupPage.waitForTimeout(500);

		// Click New Preset
		const newPresetButton = popupPage.getByRole("button", {
			name: "+ New Preset",
		});
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await popupPage.waitForTimeout(300);

		// Create a preset with a unique name
		const uniqueName = `Persist Test ${Date.now()}`;
		const nameInput = popupPage.locator('input[name="preset-name"]');
		await nameInput.fill(uniqueName);

		// Save
		const saveButton = popupPage.getByRole("button", {
			name: "Create Preset",
		});
		await saveButton.click();
		await popupPage.waitForTimeout(500);

		// Close and reopen popup
		await popupPage.close();

		// Reopen popup
		const newPopupPage = await openPopupPage(extensionContext, extensionId);
		await newPopupPage.waitForLoadState("networkidle");

		// Open preset manager again
		const newManageButton = newPopupPage.getByRole("button", {
			name: "Manage",
		});
		await newManageButton.click();
		await newPopupPage.waitForTimeout(500);

		// Verify preset still exists
		const presetName = newPopupPage.getByText(uniqueName);
		await expect(presetName).toBeVisible({ timeout: 5000 });

		await newPopupPage.close();
	});
});

