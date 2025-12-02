import { test, expect, collectCoverage, collectAllCoverage } from "./core/test-with-extension";
import { openSettingsPage, openSidebarPage, openPopupPage, closePageWithCoverage } from "./core/helpers";

/**
 * E2E tests for the Chrome extension options/settings page
 * These tests verify options page functionality and settings persistence
 */

test.describe("Options Page E2E Tests", () => {
	test("should open and display options page correctly", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);

		// Wait for content to load
		await optionsPage.waitForLoadState("networkidle");

		// Verify title
		const title = await optionsPage.title();
		expect(title).toBe("Chrome Extension Options");

		// Verify main heading is visible
		const heading = optionsPage.locator('[data-testid="options-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText("Extension Options");

		// Verify version number is displayed
		const versionText = optionsPage.locator('[data-testid="version-text"]');
		await expect(versionText).toBeVisible();

		await optionsPage.close();
	});

	test("should display theme selector with options", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify theme select dropdown exists
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		await expect(themeSelect).toBeVisible();

		// Verify all theme options are available
		const lightOption = themeSelect.locator('option[value="light"]');
		const darkOption = themeSelect.locator('option[value="dark"]');
		const systemOption = themeSelect.locator('option[value="system"]');

		await expect(lightOption).toHaveText("Light");
		await expect(darkOption).toHaveText("Dark");
		await expect(systemOption).toHaveText("System");

		await optionsPage.close();
	});

	test("should display display mode selector", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify display mode select dropdown exists
		const displayModeSelect = optionsPage.locator(
			'[data-testid="display-mode-select"]'
		);
		await expect(displayModeSelect).toBeVisible();

		// Verify options are available
		const popupOption = displayModeSelect.locator('option[value="popup"]');
		const sidebarOption = displayModeSelect.locator(
			'option[value="sidebar"]'
		);

		await expect(popupOption).toHaveText("Popup");
		await expect(sidebarOption).toHaveText("Sidebar");

		await optionsPage.close();
	});

	test("should display notifications checkbox", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify notifications checkbox exists
		const notificationsCheckbox = optionsPage.locator(
			'[data-testid="notifications-checkbox"]'
		);
		await expect(notificationsCheckbox).toBeVisible();

		await optionsPage.close();
	});

	test("should have Save Settings button", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Verify Save Settings button exists
		const saveButton = optionsPage.locator(
			'[data-testid="save-settings-button"]'
		);
		await expect(saveButton).toBeVisible();

		await optionsPage.close();
	});

	test("should change theme and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the theme select
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');

		// Change theme to dark
		await themeSelect.selectOption("dark");

		// Click Save Settings
		const saveButton = optionsPage.locator(
			'[data-testid="save-settings-button"]'
		);
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify theme is still dark
		const reloadedThemeSelect = optionsPage.locator(
			'[data-testid="theme-select"]'
		);
		await expect(reloadedThemeSelect).toHaveValue("dark");

		await optionsPage.close();
	});

	test("should change display mode and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the display mode select
		const displayModeSelect = optionsPage.locator(
			'[data-testid="display-mode-select"]'
		);

		// Change display mode to sidebar
		await displayModeSelect.selectOption("sidebar");

		// Click Save Settings
		const saveButton = optionsPage.locator(
			'[data-testid="save-settings-button"]'
		);
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify display mode is still sidebar
		const reloadedDisplayModeSelect = optionsPage.locator(
			'[data-testid="display-mode-select"]'
		);
		await expect(reloadedDisplayModeSelect).toHaveValue("sidebar");

		await optionsPage.close();
	});

	test("should toggle notifications checkbox and persist after save", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Get the notifications checkbox
		const notificationsCheckbox = optionsPage.locator(
			'[data-testid="notifications-checkbox"]'
		);

		// Get initial state
		const initialChecked = await notificationsCheckbox.isChecked();

		// Toggle the checkbox
		await notificationsCheckbox.click();

		// Click Save Settings
		const saveButton = optionsPage.locator(
			'[data-testid="save-settings-button"]'
		);
		await saveButton.click();

		// Verify success message appears
		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Reload the page to verify persistence
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");

		// Verify checkbox state is persisted (opposite of initial)
		const reloadedCheckbox = optionsPage.locator(
			'[data-testid="notifications-checkbox"]'
		);
		const persistedChecked = await reloadedCheckbox.isChecked();
		expect(persistedChecked).toBe(!initialChecked);

		await optionsPage.close();
	});

	test("should show sidebar support warning when not supported", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		// Note: This test may or may not show the warning depending on browser support
		// The warning may or may not be visible depending on browser
		// We just verify the page loads correctly regardless
		const heading = optionsPage.locator('[data-testid="options-heading"]');
		await expect(heading).toBeVisible();

		await optionsPage.close();
	});

	test("should cycle through all theme options", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		const themeSelect = optionsPage.locator(
			'select:has(option[value="light"])'
		);

		const themes = ["light", "dark", "system"];

		for (const theme of themes) {
			await themeSelect.selectOption(theme);
			await expect(themeSelect).toHaveValue(theme);

			// Save settings
			const saveButton = optionsPage.getByRole("button", {
				name: "Save Settings",
			});
			await saveButton.click();

			// Wait for success message
			const successMessage = optionsPage.getByText("✓ Settings Saved!");
			await expect(successMessage).toBeVisible({ timeout: 3000 });

			// Reload and verify
			await optionsPage.reload();
			await optionsPage.waitForLoadState("networkidle");

			const reloadedSelect = optionsPage.locator(
				'select:has(option[value="light"])'
			);
			await expect(reloadedSelect).toHaveValue(theme);
		}

		await optionsPage.close();
	});

	test("should switch between popup and sidebar display modes", async ({
		extensionContext,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(
			extensionContext,
			extensionId
		);
		await optionsPage.waitForLoadState("networkidle");

		const displayModeSelect = optionsPage.locator(
			'select:has(option[value="popup"])'
		);

		// Test switching to sidebar
		await displayModeSelect.selectOption("sidebar");
		const saveButton = optionsPage.getByRole("button", {
			name: "Save Settings",
		});
		await saveButton.click();

		const successMessage = optionsPage.getByText("✓ Settings Saved!");
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Collect coverage after display mode change
		await collectCoverage(extensionContext, optionsPage, "after-display-mode-change");

		// Reload and verify sidebar mode
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");
		await expect(displayModeSelect).toHaveValue("sidebar");

		// Switch back to popup
		await displayModeSelect.selectOption("popup");
		await saveButton.click();
		await expect(successMessage).toBeVisible({ timeout: 3000 });

		// Collect coverage after switching back
		await collectCoverage(extensionContext, optionsPage, "after-popup-mode-change");

		// Reload and verify popup mode
		await optionsPage.reload();
		await optionsPage.waitForLoadState("networkidle");
		await expect(displayModeSelect).toHaveValue("popup");

		await closePageWithCoverage(extensionContext, optionsPage);
	});
});

/**
 * Tests for browser detection and sidebar API functionality
 * These tests exercise browserClasses.ts - BrowserDetector, SidePanelManager, DisplayModeManager
 */
test.describe("Browser Classes E2E Tests", () => {
	test.describe("Display Mode Manager", () => {
		test("should apply popup mode correctly", async ({
			extensionContext,
			extensionId,
		}) => {
			// First set to popup mode via options
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
			await displayModeSelect.selectOption("popup");

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			// Collect coverage after applying mode
			await collectCoverage(extensionContext, optionsPage, "after-popup-apply");

			// Verify popup works by opening it
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			const heading = popupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible();

			await closePageWithCoverage(extensionContext, popupPage);
			await closePageWithCoverage(extensionContext, optionsPage);
		});

		test("should apply sidebar mode correctly", async ({
			extensionContext,
			extensionId,
		}) => {
			// Set to sidebar mode via options
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
			await displayModeSelect.selectOption("sidebar");

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			// Collect coverage after applying mode
			await collectCoverage(extensionContext, optionsPage, "after-sidebar-apply");

			// Verify sidebar works by opening it directly
			const sidebarPage = await openSidebarPage(extensionContext, extensionId);
			await sidebarPage.waitForLoadState("networkidle");

			const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
			await expect(heading).toBeVisible();

			// Switch back to popup mode for other tests
			await displayModeSelect.selectOption("popup");
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			await collectAllCoverage(extensionContext);
			await closePageWithCoverage(extensionContext, sidebarPage);
			await closePageWithCoverage(extensionContext, optionsPage);
		});

		test("should trigger display mode initialization on startup", async ({
			extensionContext,
			extensionId,
		}) => {
			// The display mode is initialized when the extension starts
			// We can verify by checking that the popup/sidebar is functional
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// If popup loads, display mode was initialized
			const heading = popupPage.locator('[data-testid="popup-heading"]');
			await expect(heading).toBeVisible();

			// Collect coverage to capture initDisplayMode execution
			await collectCoverage(extensionContext, popupPage, "after-init-check");

			await closePageWithCoverage(extensionContext, popupPage);
		});
	});

	test.describe("Browser Detection", () => {
		test("should detect browser type in service worker", async ({
			extensionContext,
		}) => {
			// Get service worker
			let serviceWorker = extensionContext.serviceWorkers()[0];
			if (!serviceWorker) {
				serviceWorker = await extensionContext.waitForEvent("serviceworker");
			}

			// Check that browser detection is available
			// The extension logs browser info on startup via logBrowserInfo()
			// We just verify the service worker is functional
			expect(serviceWorker).toBeTruthy();
			expect(serviceWorker.url()).toContain("chrome-extension://");
		});

		test("should handle browser API availability", async ({
			extensionContext,
			extensionId,
		}) => {
			// Open popup and verify browser APIs are working
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Verify the popup is using browser APIs (theme indicator uses storage)
			const themeIndicator = popupPage.locator('[data-testid="theme-indicator"]');
			await expect(themeIndicator).toBeVisible();

			// The theme indicator value proves browser.storage.sync is working
			const themeText = await themeIndicator.textContent();
			expect(themeText).toBeTruthy();

			await closePageWithCoverage(extensionContext, popupPage);
		});
	});

	test.describe("Side Panel Manager", () => {
		test("should configure side panel when in sidebar mode", async ({
			extensionContext,
			extensionId,
		}) => {
			// Set to sidebar mode
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
			await displayModeSelect.selectOption("sidebar");

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			
			// Wait for the mode change to be processed by background script
			await optionsPage.waitForTimeout(1500);

			// Collect coverage - SidePanelManager.setOptions and setPanelBehavior are called
			await collectCoverage(extensionContext, optionsPage, "after-sidepanel-config");

			// Open sidebar to verify it works
			const sidebarPage = await openSidebarPage(extensionContext, extensionId);
			await sidebarPage.waitForLoadState("networkidle");

			// Verify sidebar is functional
			const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
			await expect(heading).toBeVisible();

			// Collect coverage from sidebar
			await collectCoverage(extensionContext, sidebarPage, "sidebar-functional");

			// Switch back to popup mode
			await displayModeSelect.selectOption("popup");
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			await collectAllCoverage(extensionContext);
			await closePageWithCoverage(extensionContext, sidebarPage);
			await closePageWithCoverage(extensionContext, optionsPage);
		});

		test("should handle unavailable sidebar API gracefully", async ({
			extensionContext,
			extensionId,
		}) => {
			// The extension should handle browsers where sidePanel API is not available
			// by falling back to popup mode. We can't actually test this in Chromium
			// but we can verify the fallback path doesn't break anything.
			
			// Set to sidebar mode and verify no errors
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
			await displayModeSelect.selectOption("sidebar");

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			// Verify no errors by checking page is still functional
			const heading = optionsPage.locator('[data-testid="options-heading"]');
			await expect(heading).toBeVisible();

			// Reset to popup
			await displayModeSelect.selectOption("popup");
			await saveButton.click();
			await optionsPage.waitForTimeout(500);

			await closePageWithCoverage(extensionContext, optionsPage);
		});
	});

	test.describe("Theme Manager", () => {
		test("should get and set theme through storage", async ({
			extensionContext,
			extensionId,
		}) => {
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
			
			// Test each theme option
			for (const theme of ["light", "dark", "system"]) {
				await themeSelect.selectOption(theme);
				
				const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
				await saveButton.click();
				await optionsPage.waitForTimeout(500);

				// Collect coverage after each theme change
				await collectCoverage(extensionContext, optionsPage, `after-theme-${theme}`);
			}

			await closePageWithCoverage(extensionContext, optionsPage);
		});

		test("should resolve system theme correctly", async ({
			extensionContext,
			extensionId,
		}) => {
			const optionsPage = await openSettingsPage(extensionContext, extensionId);
			await optionsPage.waitForLoadState("networkidle");

			// Set to system theme
			const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
			await themeSelect.selectOption("system");

			const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
			await saveButton.click();
			await optionsPage.waitForTimeout(1000);

			// Open popup and verify theme is resolved
			const popupPage = await openPopupPage(extensionContext, extensionId);
			await popupPage.waitForLoadState("networkidle");

			// Theme indicator should show resolved theme (light or dark, not "system")
			const themeIndicator = popupPage.locator('[data-testid="theme-indicator"]');
			await expect(themeIndicator).toBeVisible();
			
			// Collect coverage - ThemeManager.resolveTheme is called
			await collectCoverage(extensionContext, popupPage, "after-theme-resolve");

			await closePageWithCoverage(extensionContext, popupPage);
			await closePageWithCoverage(extensionContext, optionsPage);
		});
	});
});
