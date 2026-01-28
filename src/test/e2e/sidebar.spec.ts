import type { Page } from "@playwright/test";

import { expect, test } from "./core/fixtures";

/**
 * E2E tests for the Sidebar/SidePanel interface
 */

test.describe("Sidebar/SidePanel E2E Tests", () => {
	let sidebarPage: Page;

	test.beforeEach(async ({ context, extensionId }) => {
		sidebarPage = await context.newPage();
		await sidebarPage.goto(`chrome-extension://${extensionId}/sidepanel.html`, {
			timeout: 15_000,
			waitUntil: "domcontentloaded",
		});
		await sidebarPage.waitForSelector("#root", { timeout: 10_000 });
	});

	test.afterEach(async () => {
		if (sidebarPage) {
			await sidebarPage.close();
		}
	});

	test("should load sidebar correctly", async () => {
		const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("Agnostic Devkit");
	});

	test("should display sidebar specific container attribute", async () => {
		const container = sidebarPage.locator('[data-testid="sidebar-container"]');
		await expect(container).toBeVisible();
	});

	test("should open options page from sidebar", async ({ context, extensionId }) => {
		const openOptionsButton = sidebarPage.locator('[data-testid="open-options-button"]');

		const [newPage] = await Promise.all([context.waitForEvent("page"), openOptionsButton.click()]);

		await newPage.waitForLoadState("networkidle");
		const url = newPage.url();
		const isOptionsUrl =
			url.includes(extensionId) && (url.includes("settings.html") || url.includes("options="));
		expect(isOptionsUrl).toBe(true);

		await newPage.close();
	});
});
