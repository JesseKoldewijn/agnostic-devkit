import { expect, test } from "../core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "../core/helpers";

/**
 * E2E tests for verifying that the popup correctly identifies and syncs with the current tab
 */

test.describe("Current Tab Sync E2E Tests", () => {
	test("should show the URL of the current tab", async ({ context, extensionId }) => {
		const testUrl = "https://example.com/test-sync";
		const testPage = await createTestPage(context, testUrl);
		const tabId = await getTabId(context, testPage);

		const popupPage = await openPopupPage(context, extensionId, tabId);

		const currentTabUrl = popupPage.locator('[data-testid="current-tab-url"]');
		await expect(currentTabUrl).toBeVisible();
		await expect(currentTabUrl).toContainText("example.com/test-sync");

		await popupPage.close();
		await testPage.close();
	});

	test("should update when the tab URL changes", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://example.com/1");
		const tabId = await getTabId(context, testPage);

		const popupPage = await openPopupPage(context, extensionId, tabId);

		// Navigate test page to new URL
		await testPage.goto("https://example.com/2", { waitUntil: "networkidle" });

		// Wait for sync (background script processing + popup update)
		await popupPage.waitForTimeout(1000);

		const currentTabUrl = popupPage.locator('[data-testid="current-tab-url"]');
		await expect(currentTabUrl).toContainText("example.com/2");

		await popupPage.close();
		await testPage.close();
	});

	test("should handle multiple tabs and show correct context", async ({ context, extensionId }) => {
		const page1 = await createTestPage(context, "https://example.com/page1");
		const page2 = await createTestPage(context, "https://example.com/page2");

		const tabId1 = await getTabId(context, page1);
		const tabId2 = await getTabId(context, page2);

		// Open popup for page 1
		const popup1 = await openPopupPage(context, extensionId, tabId1);
		await expect(popup1.locator('[data-testid="current-tab-url"]')).toContainText("page1");

		// Open popup for page 2
		const popup2 = await openPopupPage(context, extensionId, tabId2);
		await expect(popup2.locator('[data-testid="current-tab-url"]')).toContainText("page2");

		await popup1.close();
		await popup2.close();
		await page1.close();
		await page2.close();
	});
});
