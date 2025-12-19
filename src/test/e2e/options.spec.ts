import { test, expect } from "./core/fixtures";

/**
 * E2E tests for the Options page
 * These tests verify theme switching, display mode settings, and data persistence
 */

test.describe("Options Page E2E Tests", () => {
	test.beforeEach(async ({ context, extensionId }) => {
		const optionsPage = await context.newPage();
		await optionsPage.goto(
			`chrome-extension://${extensionId}/options.html`,
			{ waitUntil: "networkidle", timeout: 15000 }
		);
		await optionsPage.waitForSelector("#root", { timeout: 10000 });
		// Store page on context or handle in each test
		(context as any).optionsPage = optionsPage;
	});

	test.afterEach(async ({ context }) => {
		if ((context as any).optionsPage) {
			await (context as any).optionsPage.close();
		}
	});

	test("should load options page correctly", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const heading = optionsPage.locator("h1");
		await expect(heading).toContainText("Options");
	});

	test("should change theme to dark", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		
		await themeSelect.selectOption("dark");
		
		// Save settings
		const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
		await saveButton.click();
		
		// Verify success message
		await expect(optionsPage.getByText("✓ Settings Saved!")).toBeVisible();
		
		// Verify theme class on document
		const isDark = await optionsPage.evaluate(() => 
			document.documentElement.classList.contains("dark")
		);
		expect(isDark).toBe(true);
	});

	test("should change theme to light", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		
		await themeSelect.selectOption("light");
		
		// Save settings
		const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
		await saveButton.click();
		
		// Verify success message
		await expect(optionsPage.getByText("✓ Settings Saved!")).toBeVisible();
		
		// Verify theme class on document
		const isLight = await optionsPage.evaluate(() => 
			document.documentElement.classList.contains("light")
		);
		expect(isLight).toBe(true);
	});

	test("should change display mode", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
		
		await displayModeSelect.selectOption("sidebar");
		
		// Save settings
		const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
		await saveButton.click();
		
		// Verify success message
		await expect(optionsPage.getByText("✓ Settings Saved!")).toBeVisible();
		
		// Reload page and verify setting persisted
		await optionsPage.reload({ waitUntil: "networkidle" });
		await expect(displayModeSelect).toHaveValue("sidebar");
	});

	test("should toggle notifications", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
		
		const initialState = await notificationsCheckbox.isChecked();
		await notificationsCheckbox.click();
		
		// Save settings
		const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
		await saveButton.click();
		
		// Verify success message
		await expect(optionsPage.getByText("✓ Settings Saved!")).toBeVisible();
		
		// Reload and verify
		await optionsPage.reload({ waitUntil: "networkidle" });
		expect(await notificationsCheckbox.isChecked()).toBe(!initialState);
	});

	test("should show browser information", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const browserInfo = optionsPage.locator('[data-testid="browser-info"]');
		await expect(browserInfo).toBeVisible();
		await expect(browserInfo).toContainText("Running in:");
	});

	test("should show extension version", async ({ context }) => {
		const optionsPage = (context as any).optionsPage;
		const versionInfo = optionsPage.locator('[data-testid="extension-version"]');
		await expect(versionInfo).toBeVisible();
		await expect(versionInfo).toContainText("Version:");
	});
});
