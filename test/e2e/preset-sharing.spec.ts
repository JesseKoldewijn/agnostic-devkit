import { expect, test } from "./core/fixtures";
import { openPopupPage } from "./core/helpers";

// Increase timeout for sharing tests
test.setTimeout(60_000);

test.describe("Preset URL Sharing", () => {
	test("should show Copy URL button in export view", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);

		// Create a preset first
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `Share Test ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Go to export view
		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await expect(popupPage.locator('[data-testid="preset-export-view"]')).toBeVisible();

		// Verify both export options are available
		await expect(popupPage.locator('[data-testid="export-download-button"]')).toBeVisible();
		await expect(popupPage.locator('[data-testid="export-url-button"]')).toBeVisible();
	});

	test("should copy share URL to clipboard", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);

		// Create a preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `URL Copy Test ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Go to export view
		await popupPage.locator('[data-testid="export-presets-button"]').click();

		// Select the preset by clicking the export item
		await popupPage.locator('[data-testid="export-preset-item"]').first().click();

		// Grant clipboard permissions and click copy URL
		await popupPage.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await popupPage.locator('[data-testid="export-url-button"]').click();

		// Wait for success feedback
		await expect(popupPage.locator('[data-testid="copy-success-message"]')).toBeVisible({
			timeout: 5000,
		});

		// Verify clipboard contains share URL
		const clipboardText = await popupPage.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain("share=");
		expect(clipboardText).toContain("settings.html");
	});

	test("should show import modal when opening with share parameter", async ({
		context,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(context, extensionId);

		// First create and export a preset to get a valid share URL
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `Import Modal Test ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Go to export view and copy URL
		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await popupPage.locator('[data-testid="export-preset-item"]').first().click();
		await popupPage.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await popupPage.locator('[data-testid="export-url-button"]').click();

		// Get the share URL from clipboard
		await popupPage.waitForTimeout(500); // Wait for clipboard write
		const shareUrl = await popupPage.evaluate(() => navigator.clipboard.readText());

		// Extract just the query string part
		const shareParam = new URL(shareUrl).searchParams.get("share");
		expect(shareParam).toBeTruthy();

		// Open settings page with the share parameter
		const settingsPage = await context.newPage();
		await settingsPage.goto(`chrome-extension://${extensionId}/settings.html?share=${shareParam}`, {
			waitUntil: "load",
			timeout: 30_000,
		});
		await settingsPage.waitForSelector("#root", { state: "visible", timeout: 20_000 });
		await settingsPage.waitForTimeout(500); // Wait for SolidJS to mount

		// Should show import modal
		await expect(settingsPage.locator('[data-testid="share-import-modal"]')).toBeVisible({
			timeout: 10_000,
		});
		await expect(settingsPage.locator('[data-testid="share-import-count"]')).toContainText("1");
	});

	test("should import presets from share URL", async ({ context, extensionId }) => {
		// Create a preset in one popup
		const popupPage = await openPopupPage(context, extensionId);
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const uniqueName = `Shared Preset ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(uniqueName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Export to URL
		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await popupPage.locator('[data-testid="export-preset-item"]').first().click();
		await popupPage.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await popupPage.locator('[data-testid="export-url-button"]').click();

		await popupPage.waitForTimeout(500); // Wait for clipboard write
		const shareUrl = await popupPage.evaluate(() => navigator.clipboard.readText());
		const shareParam = new URL(shareUrl).searchParams.get("share");

		// Delete the preset so we can test importing it
		await popupPage.locator('[data-testid="export-back-button"]').click();
		const presetItem = popupPage.locator('[data-testid="preset-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-name"]:text-is("${uniqueName}")`),
		});
		await presetItem.locator('[data-testid="delete-preset-button"]').click();
		await popupPage.locator('[data-testid="confirm-delete-button"]').click();

		// Verify it's deleted
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${uniqueName}")`)
		).not.toBeVisible();

		// Open settings page with share URL
		const settingsPage = await context.newPage();
		await settingsPage.goto(`chrome-extension://${extensionId}/settings.html?share=${shareParam}`, {
			waitUntil: "load",
			timeout: 30_000,
		});
		await settingsPage.waitForSelector("#root", { state: "visible", timeout: 20_000 });
		await settingsPage.waitForTimeout(500); // Wait for SolidJS to mount

		// Confirm import
		await expect(settingsPage.locator('[data-testid="share-import-modal"]')).toBeVisible({
			timeout: 10_000,
		});
		await settingsPage.locator('[data-testid="share-import-confirm"]').click();

		// Wait for modal to close
		await expect(settingsPage.locator('[data-testid="share-import-modal"]')).not.toBeVisible({
			timeout: 5000,
		});

		// Verify import success indicator shows
		await expect(settingsPage.locator('[data-testid="import-success-indicator"]')).toBeVisible({
			timeout: 5000,
		});
	});

	test("should cancel import from share URL", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);

		// Create and export a preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill("Cancel Test");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await popupPage.locator('[data-testid="export-preset-item"]').first().click();
		await popupPage.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await popupPage.locator('[data-testid="export-url-button"]').click();

		await popupPage.waitForTimeout(500); // Wait for clipboard write
		const shareUrl = await popupPage.evaluate(() => navigator.clipboard.readText());
		const shareParam = new URL(shareUrl).searchParams.get("share");

		// Open settings page with share URL
		const settingsPage = await context.newPage();
		await settingsPage.goto(`chrome-extension://${extensionId}/settings.html?share=${shareParam}`, {
			waitUntil: "load",
			timeout: 30_000,
		});
		await settingsPage.waitForSelector("#root", { state: "visible", timeout: 20_000 });
		await settingsPage.waitForTimeout(500); // Wait for SolidJS to mount

		// Cancel import
		await expect(settingsPage.locator('[data-testid="share-import-modal"]')).toBeVisible({
			timeout: 10_000,
		});
		await settingsPage.locator('[data-testid="share-import-cancel"]').click();

		// Modal should close and show settings view
		await expect(settingsPage.locator('[data-testid="share-import-modal"]')).not.toBeVisible({
			timeout: 5000,
		});
	});

	test("should handle invalid share parameter gracefully", async ({ context, extensionId }) => {
		const settingsPage = await context.newPage();
		await settingsPage.goto(
			`chrome-extension://${extensionId}/settings.html?share=invalid-compressed-data`,
			{
				waitUntil: "load",
				timeout: 30_000,
			}
		);
		await settingsPage.waitForSelector("#root", { state: "visible", timeout: 20_000 });
		await settingsPage.waitForTimeout(500); // Wait for SolidJS to mount

		// Should show error message, not crash
		await expect(settingsPage.locator('[data-testid="share-import-error"]')).toBeVisible({
			timeout: 10_000,
		});
	});

	test("should import via share URL input field", async ({ context, extensionId }) => {
		const popupPage = await openPopupPage(context, extensionId);

		// Create a preset
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();

		const presetName = `URL Input Test ${Date.now()}`;
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Export to URL
		await popupPage.locator('[data-testid="export-presets-button"]').click();
		await popupPage.locator('[data-testid="export-preset-item"]').first().click();
		await popupPage.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await popupPage.locator('[data-testid="export-url-button"]').click();

		await popupPage.waitForTimeout(500);
		const shareUrl = await popupPage.evaluate(() => navigator.clipboard.readText());

		// Go back and delete the preset
		await popupPage.locator('[data-testid="export-back-button"]').click();
		const presetItem = popupPage.locator('[data-testid="preset-item"]').filter({
			has: popupPage.locator(`[data-testid="preset-name"]:text-is("${presetName}")`),
		});
		await presetItem.locator('[data-testid="delete-preset-button"]').click();
		await popupPage.locator('[data-testid="confirm-delete-button"]').click();

		// Verify deleted
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${presetName}")`)
		).not.toBeVisible();

		// Use the share URL input to import
		await popupPage.locator('[data-testid="share-url-input"]').fill(shareUrl);
		await popupPage.locator('[data-testid="share-url-load-button"]').click();

		// Should show import modal
		await expect(popupPage.locator('[data-testid="share-import-modal"]')).toBeVisible({
			timeout: 10_000,
		});

		// Confirm import
		await popupPage.locator('[data-testid="share-import-confirm"]').click();

		// Wait for modal to close
		await expect(popupPage.locator('[data-testid="share-import-modal"]')).not.toBeVisible({
			timeout: 5000,
		});

		// Verify preset was imported
		await expect(
			popupPage.locator(`[data-testid="preset-name"]:text-is("${presetName}")`)
		).toBeVisible({ timeout: 10_000 });
	});
});
