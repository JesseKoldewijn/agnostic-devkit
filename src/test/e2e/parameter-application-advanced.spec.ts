import { expect, test } from "./core/fixtures";
import { createTestPage, getCookie, getTabId, openPopupPage } from "./core/helpers";

/**
 * Advanced E2E tests for parameter application logic
 * Covers shared parameters, cookies, localStorage, and batch operations
 */

test.describe("Advanced Parameter Application E2E Tests", () => {
	test("should handle shared parameters between active presets", async ({
		context,
		extensionId,
	}) => {
		const testPage = await createTestPage(context, "https://playwright.dev");
		const tabId = await getTabId(context, testPage);
		console.log(`[E2E] Tab ID: ${tabId}`);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		const presetAName = `Shared A ${Date.now()}`;
		const presetBName = `Shared B ${Date.now()}`;

		// Create Preset A: test=shared
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetAName);
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').fill("shared");
		await popupPage.locator('[data-testid="parameter-value-input"]').fill("value");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		// Create Preset B: shared=value, other=unique
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetBName);
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').nth(0).fill("shared");
		await popupPage.locator('[data-testid="parameter-value-input"]').nth(0).fill("value");
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').nth(1).fill("other");
		await popupPage.locator('[data-testid="parameter-value-input"]').nth(1).fill("unique");
		await popupPage.locator('[data-testid="save-preset-button"]').click();

		await popupPage.locator('[data-testid="close-manager-button"]').click();

		const toggleA = popupPage
			.locator('[data-testid="preset-toggle-item"]', { hasText: presetAName })
			.locator('[data-testid="preset-toggle-checkbox"]');
		const toggleB = popupPage
			.locator('[data-testid="preset-toggle-item"]', { hasText: presetBName })
			.locator('[data-testid="preset-toggle-checkbox"]');

		// Activate A
		await toggleA.check({ force: true });
		// Wait for both storage and URL to settle
		await popupPage.waitForTimeout(500);
		await expect(testPage).toHaveURL(/.*shared=value.*/, { timeout: 15_000 });
		await expect(toggleA).toBeChecked();

		// Activate B
		await toggleB.check({ force: true });
		// Wait for both storage and URL to settle
		await popupPage.waitForTimeout(1000);
		await expect(testPage).toHaveURL(/.*shared=value.*other=unique.*/, { timeout: 15_000 });
		await expect(toggleB).toBeChecked();

		// Deactivate A - shared=value should remain because B is still active
		await toggleA.uncheck({ force: true });
		// Wait for storage change to propagate
		await popupPage.waitForTimeout(500);
		await expect(toggleA).not.toBeChecked();

		// Verify shared=value is still there using robust assertion
		await expect(testPage).toHaveURL(/.*shared=value.*/, { timeout: 15_000 });
		await expect(testPage).toHaveURL(/.*other=unique.*/, { timeout: 15_000 });

		// Deactivate B - everything should be gone
		await toggleB.uncheck({ force: true });
		// Wait for processing
		await popupPage.waitForTimeout(1000);
		await expect(toggleB).not.toBeChecked();

		await expect(testPage).not.toHaveURL(/.*shared=value.*/, { timeout: 15_000 });
		await expect(testPage).not.toHaveURL(/.*other=unique.*/, { timeout: 15_000 });

		await popupPage.close();
		await testPage.close();
	});

	test("should apply and remove cookies", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://playwright.dev");
		const tabId = await getTabId(context, testPage);
		console.log(`[E2E] Tab ID: ${tabId}`);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		const presetName = `Cookie Preset ${Date.now()}`;
		const cookieKey = `test_cookie_${Date.now()}`;
		const cookieVal = "cookie_value";

		// Create preset with cookie
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);
		await popupPage.locator('[data-testid="add-parameter-button"]').click();

		// Select cookie type
		await popupPage.locator('[data-testid="parameter-type-select"]').selectOption("cookie");
		await popupPage.locator('[data-testid="parameter-key-input"]').fill(cookieKey);
		await popupPage.locator('[data-testid="parameter-value-input"]').fill(cookieVal);
		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		const toggle = popupPage
			.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
			.locator('[data-testid="preset-toggle-checkbox"]');

		// Activate
		await toggle.check({ force: true });
		await expect(toggle).toBeEnabled();

		// Verify cookie set - retry a few times as it might take a moment to sync
		let cookie = null;
		for (let i = 0; i < 10; i++) {
			cookie = await getCookie(testPage, cookieKey);
			if (cookie === cookieVal) {
				break;
			}
			await testPage.waitForTimeout(500);
		}
		expect(cookie).toBe(cookieVal);

		// Deactivate
		await toggle.uncheck({ force: true });
		await expect(toggle).toBeEnabled();

		// Verify cookie removed
		let removedCookie = "not_null";
		for (let i = 0; i < 10; i++) {
			removedCookie = (await getCookie(testPage, cookieKey)) as any;
			if (removedCookie === null) {
				break;
			}
			await testPage.waitForTimeout(500);
		}
		expect(removedCookie).toBeNull();

		await popupPage.close();
		await testPage.close();
	});

	test("should handle batch application of multiple parameter types", async ({
		context,
		extensionId,
	}) => {
		const testPage = await createTestPage(context, "https://example.org");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		const presetName = `Batch Preset ${Date.now()}`;
		const queryKey = "batch_q";
		const queryVal = "batch_v";
		const cookieKey = "batch_c";
		const cookieVal = "batch_cv";

		// Create preset with query param AND cookie
		await popupPage.locator('[data-testid="manage-presets-button"]').click();
		await popupPage.locator('[data-testid="create-preset-button"]').click();
		await popupPage.locator('[data-testid="preset-name-input"]').fill(presetName);

		// Query Param
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-key-input"]').fill(queryKey);
		await popupPage.locator('[data-testid="parameter-value-input"]').fill(queryVal);

		// Cookie
		await popupPage.locator('[data-testid="add-parameter-button"]').click();
		await popupPage.locator('[data-testid="parameter-type-select"]').nth(1).selectOption("cookie");
		await popupPage.locator('[data-testid="parameter-key-input"]').nth(1).fill(cookieKey);
		await popupPage.locator('[data-testid="parameter-value-input"]').nth(1).fill(cookieVal);

		await popupPage.locator('[data-testid="save-preset-button"]').click();
		await popupPage.locator('[data-testid="close-manager-button"]').click();

		const toggle = popupPage
			.locator('[data-testid="preset-toggle-item"]', { hasText: presetName })
			.locator('[data-testid="preset-toggle-checkbox"]');

		// Activate
		await toggle.check({ force: true });
		await expect(toggle).toBeEnabled();

		// Verify both applied
		await expect(testPage).toHaveURL(new RegExp(`.*${queryKey}=${queryVal}.*`), {
			timeout: 15_000,
		});

		let cookie = null;
		for (let i = 0; i < 10; i++) {
			cookie = await getCookie(testPage, cookieKey);
			if (cookie === cookieVal) {
				break;
			}
			await testPage.waitForTimeout(500);
		}
		expect(cookie).toBe(cookieVal);

		// Deactivate
		await toggle.uncheck({ force: true });
		await expect(toggle).toBeEnabled();

		// Verify both removed
		await expect(testPage).not.toHaveURL(new RegExp(`.*${queryKey}=${queryVal}.*`), {
			timeout: 15_000,
		});

		let removedCookie = "not_null";
		for (let i = 0; i < 10; i++) {
			removedCookie = (await getCookie(testPage, cookieKey)) as any;
			if (removedCookie === null) {
				break;
			}
			await testPage.waitForTimeout(500);
		}
		expect(removedCookie).toBeNull();

		await popupPage.close();
		await testPage.close();
	});
});
