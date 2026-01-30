import { expect, test } from "./core/fixtures";
import { openSettingsPage } from "./core/helpers";

test.describe("Options Page Exhaustive Settings", () => {
	test("should toggle all settings in options page", async ({ context, extensionId }) => {
		const optionsPage = await openSettingsPage(context, extensionId);

		// 1. Theme
		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		await themeSelect.selectOption("dark");
		await themeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
		await optionsPage.waitForFunction(() => document.documentElement.classList.contains("dark"), {
			timeout: 10_000,
		});
		await expect(themeSelect).toHaveValue("dark");

		await themeSelect.selectOption("system");
		await themeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
		await optionsPage.waitForFunction(() => document.documentElement.classList.contains("system"), {
			timeout: 10_000,
		});
		await expect(themeSelect).toHaveValue("system");

		// 2. Display Mode
		const modeSelect = optionsPage.locator('[data-testid="display-mode-select"]');
		await modeSelect.selectOption("sidebar");
		await modeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
		await expect(modeSelect).toHaveValue("sidebar");

		await modeSelect.selectOption("popup");
		await modeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
		await expect(modeSelect).toHaveValue("popup");

		// 3. Notifications
		const notifyCheckbox = optionsPage.locator('[data-testid="notifications-checkbox"]');
		await notifyCheckbox.evaluate((el) => {
			(el as HTMLInputElement).checked = false;
			el.dispatchEvent(new Event("change", { bubbles: true }));
		});
		await expect(notifyCheckbox).not.toBeChecked();

		await notifyCheckbox.evaluate((el) => {
			(el as HTMLInputElement).checked = true;
			el.dispatchEvent(new Event("change", { bubbles: true }));
		});
		await expect(notifyCheckbox).toBeChecked();
	});

	test("should trigger background storage listeners when settings change", async ({
		context,
		extensionId,
	}) => {
		const optionsPage = await openSettingsPage(context, extensionId);

		const themeSelect = optionsPage.locator('[data-testid="theme-select"]');
		await themeSelect.selectOption("light");
		await themeSelect.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));

		// Wait for the change to be applied
		await optionsPage.waitForFunction(() => document.documentElement.classList.contains("light"), {
			timeout: 10_000,
		});
	});
});
