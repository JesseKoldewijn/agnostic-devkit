import type { Page } from "@playwright/test";
import { expect, test } from "./core/fixtures";

/**
 * E2E tests for the Options page
 * These tests verify theme switching, display mode settings, and data persistence
 */

test.describe("Options Page E2E Tests", () => {
	let optionsPage: Page;

	test.beforeEach(async ({ context, extensionId }) => {
		optionsPage = await context.newPage();
		optionsPage.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
		await optionsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
			timeout: 15_000,
			waitUntil: "networkidle",
		});
		await optionsPage.waitForSelector("#root", { timeout: 10_000 });
	});

	test.afterEach(async () => {
		if (optionsPage) {
			await optionsPage.close();
		}
	});

	test("should load options page correctly", async () => {
		const heading = optionsPage.locator("h1");
		await expect(heading).toContainText("Extension Options");
	});

	test("should change theme to dark", async () => {
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');

		await themeSelect.selectOption("dark");

		// Trigger change manually if needed
		await themeSelect.evaluate((el: HTMLElement) =>
			el.dispatchEvent(new Event("change", { bubbles: true }))
		);

		// Verify theme class on document
		await optionsPage.waitForFunction(() => document.documentElement.classList.contains("dark"), {
			timeout: 10_000,
		});
	});

	test("should change theme to light", async () => {
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');

		await themeSelect.selectOption("light");
		await themeSelect.evaluate((el: HTMLElement) =>
			el.dispatchEvent(new Event("change", { bubbles: true }))
		);

		await optionsPage.waitForFunction(() => document.documentElement.classList.contains("light"), {
			timeout: 10_000,
		});
	});

	test("should change display mode", async () => {
		const displayModeSelect = optionsPage.locator('[data-testid="display-mode-select"]');

		await displayModeSelect.selectOption("sidebar");
		await displayModeSelect.evaluate((el: HTMLElement) =>
			el.dispatchEvent(new Event("change", { bubbles: true }))
		);

		// Verify success by checking persistence
		await optionsPage.reload({ waitUntil: "networkidle" });
		await expect(displayModeSelect).toHaveValue("sidebar");
	});

	test("should toggle notifications", async () => {
		const notificationsCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');

		const initialState = await notificationsCheckbox.isChecked();
		await notificationsCheckbox.evaluate((el: HTMLElement) => {
			(el as HTMLInputElement).checked = !(el as HTMLInputElement).checked;
			el.dispatchEvent(new Event("change", { bubbles: true }));
		});

		// Reload and verify
		await optionsPage.reload({ waitUntil: "networkidle" });
		expect(await notificationsCheckbox.isChecked()).toBe(!initialState);
	});

	test("should show browser information", async () => {
		const browserInfo = optionsPage.locator('[data-testid="browser-info"]');
		await expect(browserInfo).toBeVisible();
		await expect(browserInfo).toContainText("Browser");
	});

	test("should show extension version", async () => {
		const versionInfo = optionsPage.locator('[data-testid="extension-version"]');
		await expect(versionInfo).toBeVisible();
		await expect(versionInfo).toContainText("v");
	});
});
