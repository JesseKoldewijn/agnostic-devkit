import { expect, test } from "../core/fixtures";
import {
	createTestPage,
	getTabId,
	openPopupPage,
	openPopupPageWithIncognito,
	openSidebarPageWithIncognito,
} from "../core/helpers";

/**
 * E2E tests for incognito/private browsing mode UI
 * These tests verify that the extension correctly displays incognito indicators
 */

test.describe("Incognito Mode E2E Tests", () => {
	test.describe("Popup", () => {
		test("should show incognito badge when tab is incognito", async ({ context, extensionId }) => {
			const testPage = await createTestPage(context, "https://example.com");
			const tabId = await getTabId(context, testPage);

			const popupPage = await openPopupPageWithIncognito(context, extensionId, tabId);

			// Verify incognito badge is visible
			const incognitoBadge = popupPage.locator('[data-testid="incognito-badge"]');
			await expect(incognitoBadge).toBeVisible();
			// Should show "Incognito" for Chrome-based browsers
			await expect(incognitoBadge).toContainText(/Incognito|Private/);

			await popupPage.close();
			await testPage.close();
		});

		test("should NOT show incognito badge for normal tabs", async ({ context, extensionId }) => {
			const testPage = await createTestPage(context, "https://example.com");
			const tabId = await getTabId(context, testPage);

			// Use regular popup (not incognito simulated)
			const popupPage = await openPopupPage(context, extensionId, tabId);

			// Verify incognito badge is NOT visible
			const incognitoBadge = popupPage.locator('[data-testid="incognito-badge"]');
			await expect(incognitoBadge).not.toBeVisible();

			await popupPage.close();
			await testPage.close();
		});

		test("should have visual distinction for incognito card", async ({ context, extensionId }) => {
			const testPage = await createTestPage(context, "https://example.com");
			const tabId = await getTabId(context, testPage);

			const popupPage = await openPopupPageWithIncognito(context, extensionId, tabId);

			// Verify card has incognito styling (purple tint classes)
			const currentTabSection = popupPage.locator('[data-testid="current-tab-section"]');
			await expect(currentTabSection).toBeVisible();

			// Check for purple border class indicating incognito mode (border-purple-500/30)
			const cardClasses = await currentTabSection.getAttribute("class");
			expect(cardClasses).toContain("border-purple-500");

			await popupPage.close();
			await testPage.close();
		});
	});

	test.describe("Sidebar", () => {
		// Sidepanel uses extension's browser.tabs API which is not overridable from page addInitScript,
		// so incognito simulation does not affect the sidepanel. Skip these until we have a way to mock.
		test.skip("should show incognito badge when tab is incognito", async ({
			context,
			extensionId,
		}) => {
			// Open sidebar with incognito simulation (mocks all tabs as incognito)
			const sidebarPage = await openSidebarPageWithIncognito(context, extensionId);

			// Verify incognito badge is visible
			const incognitoBadge = sidebarPage.locator('[data-testid="incognito-badge"]');
			await expect(incognitoBadge).toBeVisible();
			await expect(incognitoBadge).toContainText(/Incognito|Private/);

			await sidebarPage.close();
		});

		test.skip("should have visual distinction for incognito card in sidebar", async ({
			context,
			extensionId,
		}) => {
			// Open sidebar with incognito simulation (mocks all tabs as incognito)
			const sidebarPage = await openSidebarPageWithIncognito(context, extensionId);

			const currentTabSection = sidebarPage.locator('[data-testid="current-tab-section"]');
			await expect(currentTabSection).toBeVisible();

			// Check for purple styling (border-purple-500/30)
			const cardClasses = await currentTabSection.getAttribute("class");
			expect(cardClasses).toContain("border-purple-500");

			await sidebarPage.close();
		});
	});

	test.describe("Independent Tab State", () => {
		test("presets can be applied independently to normal and incognito tabs", async ({
			context,
			extensionId,
		}) => {
			// Create two test pages (one will be treated as normal, one as incognito)
			const normalPage = await createTestPage(context, "https://example.com/normal");
			const incognitoPage = await createTestPage(context, "https://example.com/incognito");

			// Get tab IDs (normalTabId unused but getTabId ensures tab is trackable)
			await getTabId(context, normalPage);
			const incognitoTabId = await getTabId(context, incognitoPage);

			// Open popup for "incognito" tab and create a preset
			const popupPage = await openPopupPageWithIncognito(context, extensionId, incognitoTabId);

			const presetName = `Incognito Test ${Date.now()}`;

			// Create preset
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.locator('[data-testid="create-preset-button"]').click();
			await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
			await popupPage.locator('[data-testid="add-parameter-button"]').click();
			await popupPage.locator('[data-testid="parameter-key-input"]').fill("incognito_test");
			await popupPage.locator('[data-testid="parameter-value-input"]').fill("true");
			await popupPage.locator('[data-testid="save-preset-button"]').click();
			await popupPage.locator('[data-testid="close-manager-button"]').click();

			// Activate the preset on the incognito tab
			const presetToggle = popupPage
				.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
				.locator('[data-testid="preset-toggle-checkbox"]');
			await presetToggle.check({ force: true });
			await expect(presetToggle).toBeEnabled({ timeout: 10_000 });

			// Verify incognito page has the parameter
			await expect(incognitoPage).toHaveURL(/.*incognito_test=true.*/);

			// Verify normal page does NOT have the parameter
			const normalUrl = normalPage.url();
			expect(normalUrl).not.toContain("incognito_test");

			await popupPage.close();
			await normalPage.close();
			await incognitoPage.close();
		});
	});
});
