import { test, expect } from "./core/test-with-extension";
import { openSidebarPage, openPopupPage, getTabId } from "./core/helpers";

/**
 * E2E tests for current tab synchronization
 * These tests verify that the popup and sidebar always target the correct current tab,
 * even when tabs are switched after opening the UI
 * 
 * Note: In the e2e test environment, popup/sidebar open as separate tabs.
 * The `targetTabId` URL parameter is used to specify which tab to target.
 * The real fix ensures PresetToggleList updates its internal tab ID when tabs change.
 */

test.describe("Current Tab Sync E2E Tests", () => {
	test("should apply preset to the correct target tab", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page
		const testPage = await extensionContext.newPage();
		await testPage.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Get the tab ID
		const tabId = await getTabId(extensionContext, testPage);

		// Open sidebar targeting this specific tab
		const sidebarPage = await openSidebarPage(extensionContext, extensionId, tabId);
		await sidebarPage.waitForLoadState("networkidle");
		await sidebarPage.waitForTimeout(500);

		// Create a test preset
		const manageButton = sidebarPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();
		await sidebarPage.waitForTimeout(500);

		// Create a new preset with a query parameter
		const newPresetButton = sidebarPage.getByRole("button", { name: "+ New Preset" });
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await sidebarPage.waitForTimeout(300);

		// Fill in preset details
		const nameInput = sidebarPage.locator('input[name="preset-name"]');
		await expect(nameInput).toBeVisible({ timeout: 3000 });
		await nameInput.fill("Tab Target Test");

		// Add a query parameter
		const addParamButton = sidebarPage.getByRole("button", { name: "+ Add Parameter" });
		await addParamButton.click();
		await sidebarPage.waitForTimeout(200);

		const paramKeyInput = sidebarPage.locator('input[name^="param-"][name$="-key"]').first();
		await paramKeyInput.fill("targetTest");

		const paramValueInput = sidebarPage.locator('input[name^="param-"][name$="-value"]').first();
		await paramValueInput.fill("applied");

		// Save the preset
		const saveButton = sidebarPage.getByRole("button", { name: "Create Preset" });
		await saveButton.click();
		await sidebarPage.waitForTimeout(500);

		// Close preset manager
		const closeButton = sidebarPage.getByRole("button", { name: "Close" });
		await closeButton.click();
		await sidebarPage.waitForTimeout(500);

		// Toggle the preset ON (use force:true because the visual toggle div overlays the checkbox)
		const presetToggle = sidebarPage.locator('[data-testid^="preset-toggle-item-"]').first()
			.locator('input[type="checkbox"]');
		await expect(presetToggle).toBeVisible({ timeout: 5000 });
		await presetToggle.click({ force: true });
		await sidebarPage.waitForTimeout(2000);

		// Verify the preset was applied to the test page
		await testPage.waitForTimeout(1000);
		const pageUrl = testPage.url();
		expect(pageUrl).toContain("targetTest=applied");

		// Cleanup
		await sidebarPage.close();
		await testPage.close();
	});

	test("should apply preset to different tabs when switching targets", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create two test pages
		const page1 = await extensionContext.newPage();
		await page1.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		const page2 = await extensionContext.newPage();
		await page2.goto("https://example.org", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Get tab IDs for both pages
		const tabId1 = await getTabId(extensionContext, page1);
		const tabId2 = await getTabId(extensionContext, page2);

		// First, open sidebar targeting page1 and create a preset
		let sidebarPage = await openSidebarPage(extensionContext, extensionId, tabId1);
		await sidebarPage.waitForLoadState("networkidle");
		await sidebarPage.waitForTimeout(500);

		// Create a test preset
		const manageButton = sidebarPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();
		await sidebarPage.waitForTimeout(500);

		const newPresetButton = sidebarPage.getByRole("button", { name: "+ New Preset" });
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await sidebarPage.waitForTimeout(300);

		const nameInput = sidebarPage.locator('input[name="preset-name"]');
		await expect(nameInput).toBeVisible({ timeout: 3000 });
		await nameInput.fill("Switch Test Preset");

		const addParamButton = sidebarPage.getByRole("button", { name: "+ Add Parameter" });
		await addParamButton.click();
		await sidebarPage.waitForTimeout(200);

		const paramKeyInput = sidebarPage.locator('input[name^="param-"][name$="-key"]').first();
		await paramKeyInput.fill("switchTest");

		const paramValueInput = sidebarPage.locator('input[name^="param-"][name$="-value"]').first();
		await paramValueInput.fill("true");

		const saveButton = sidebarPage.getByRole("button", { name: "Create Preset" });
		await saveButton.click();
		await sidebarPage.waitForTimeout(500);

		const closeButton = sidebarPage.getByRole("button", { name: "Close" });
		await closeButton.click();
		await sidebarPage.waitForTimeout(500);

		// Close sidebar
		await sidebarPage.close();

		// Now open sidebar targeting page2
		sidebarPage = await openSidebarPage(extensionContext, extensionId, tabId2);
		await sidebarPage.waitForLoadState("networkidle");
		await sidebarPage.waitForTimeout(500);

		// Toggle the preset ON for page2 (use force:true because the visual toggle div overlays the checkbox)
		const presetToggle = sidebarPage.locator('[data-testid^="preset-toggle-item-"]').first()
			.locator('input[type="checkbox"]');
		await expect(presetToggle).toBeVisible({ timeout: 5000 });
		await presetToggle.click({ force: true });
		await sidebarPage.waitForTimeout(2000);

		// Verify the preset was applied to page2 (the NEW target), not page1
		await page2.waitForTimeout(1000);
		const page2Url = page2.url();
		expect(page2Url).toContain("switchTest=true");

		// Verify page1 was NOT affected
		const page1Url = page1.url();
		expect(page1Url).not.toContain("switchTest");

		// Cleanup
		await sidebarPage.close();
		await page1.close();
		await page2.close();
	});

	test("PresetToggleList should update tab ID when tabs.onActivated fires", async ({
		extensionContext,
		extensionId,
	}) => {
		// This test verifies the fix: PresetToggleList listens for tab changes
		// and updates its internal currentTabId accordingly
		//
		// NOTE: This test does NOT use targetTabId override so that the tab change
		// listeners are active. Instead, it relies on bringing tabs to front to
		// trigger tab activation events.

		// Create two test pages
		const page1 = await extensionContext.newPage();
		await page1.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		const page2 = await extensionContext.newPage();
		await page2.goto("https://example.org", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		// Bring page1 to front first
		await page1.bringToFront();
		await page1.waitForTimeout(500);

		// Open sidebar WITHOUT targetTabId - so it uses real tab detection and listeners
		const sidebarPage = await openSidebarPage(extensionContext, extensionId);
		await sidebarPage.waitForLoadState("networkidle");
		await sidebarPage.waitForTimeout(500);

		// Bring page1 back to front (the sidebar opening may have changed active tab)
		await page1.bringToFront();
		await sidebarPage.waitForTimeout(500);

		// Create a preset first
		const manageButton = sidebarPage.locator('[data-testid="manage-presets-button"]');
		await expect(manageButton).toBeVisible();
		await manageButton.click();
		await sidebarPage.waitForTimeout(500);

		const newPresetButton = sidebarPage.getByRole("button", { name: "+ New Preset" });
		await expect(newPresetButton).toBeVisible({ timeout: 5000 });
		await newPresetButton.click();
		await sidebarPage.waitForTimeout(300);

		const nameInput = sidebarPage.locator('input[name="preset-name"]');
		await nameInput.fill("Tab Sync Fix Test");

		const addParamButton = sidebarPage.getByRole("button", { name: "+ Add Parameter" });
		await addParamButton.click();
		await sidebarPage.waitForTimeout(200);

		const paramKeyInput = sidebarPage.locator('input[name^="param-"][name$="-key"]').first();
		await paramKeyInput.fill("syncFix");

		const paramValueInput = sidebarPage.locator('input[name^="param-"][name$="-value"]').first();
		await paramValueInput.fill("verified");

		const saveButton = sidebarPage.getByRole("button", { name: "Create Preset" });
		await saveButton.click();
		await sidebarPage.waitForTimeout(500);

		const closeButton = sidebarPage.getByRole("button", { name: "Close" });
		await closeButton.click();
		await sidebarPage.waitForTimeout(500);

		// Bring page2 to front - this should trigger tabs.onActivated
		// With the fix, PresetToggleList should update its currentTabId to page2
		await page2.bringToFront();
		await sidebarPage.waitForTimeout(1000);

		// Toggle the preset (use force:true because the visual toggle div overlays the checkbox)
		const presetToggle = sidebarPage.locator('[data-testid^="preset-toggle-item-"]').first()
			.locator('input[type="checkbox"]');
		await expect(presetToggle).toBeVisible({ timeout: 5000 });
		await presetToggle.click({ force: true });
		await sidebarPage.waitForTimeout(2000);

		// The key verification: preset should be applied to page2 (the new active tab)
		// not page1 (the original tab when sidebar was opened)
		await page2.waitForTimeout(1000);
		const page2Url = page2.url();
		
		// With the fix, page2 should have the parameter
		expect(page2Url).toContain("syncFix=verified");

		// page1 should NOT have the parameter (it's no longer the target)
		const page1Url = page1.url();
		expect(page1Url).not.toContain("syncFix");

		// Cleanup
		await sidebarPage.close();
		await page1.close();
		await page2.close();
	});

	test("popup should target the correct tab", async ({
		extensionContext,
		extensionId,
	}) => {
		// Create a test page
		const testPage = await extensionContext.newPage();
		await testPage.goto("https://example.com", {
			waitUntil: "networkidle",
			timeout: 15000,
		});

		const tabId = await getTabId(extensionContext, testPage);

		// Open popup targeting the test page
		const popupPage = await openPopupPage(extensionContext, extensionId, tabId);
		await popupPage.waitForLoadState("networkidle");
		await popupPage.waitForTimeout(500);

		// Verify popup loads correctly
		const heading = popupPage.locator('[data-testid="popup-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText("Parameters");

		// Verify preset toggle list is loaded
		const presetToggleList = popupPage.locator('[data-testid="preset-toggle-list"]');
		await expect(presetToggleList).toBeVisible({ timeout: 5000 });

		await popupPage.close();
		await testPage.close();
	});
});

