import { test, expect } from "./core/fixtures";

/**
 * E2E tests for the Sidebar/SidePanel interface
 */

test.describe("Sidebar/SidePanel E2E Tests", () => {
	test.beforeEach(async ({ context, extensionId }) => {
		const sidebarPage = await context.newPage();
		await sidebarPage.goto(
			`chrome-extension://${extensionId}/sidepanel.html`,
			{ waitUntil: "domcontentloaded", timeout: 15000 }
		);
		await sidebarPage.waitForSelector("#root", { timeout: 10000 });
		(context as any).sidebarPage = sidebarPage;
	});

	test.afterEach(async ({ context }) => {
		if ((context as any).sidebarPage) {
			await (context as any).sidebarPage.close();
		}
	});

	test("should load sidebar correctly", async ({ context }) => {
		const sidebarPage = (context as any).sidebarPage;
		const heading = sidebarPage.locator('[data-testid="sidebar-heading"]');
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("Parameter Presets");
	});

	test("should display sidebar specific container attribute", async ({ context }) => {
		const sidebarPage = (context as any).sidebarPage;
		const container = sidebarPage.locator('[data-testid="sidebar-container"]');
		await expect(container).toBeVisible();
	});

	test("should open options page from sidebar", async ({ context, extensionId }) => {
		const sidebarPage = (context as any).sidebarPage;
		const openOptionsButton = sidebarPage.locator('[data-testid="open-options-button"]');
		
		const [newPage] = await Promise.all([
			context.waitForEvent("page"),
			openOptionsButton.click(),
		]);
		
		await newPage.waitForLoadState("networkidle");
		const url = newPage.url();
		const isOptionsUrl = url.includes(extensionId) && (url.includes("options.html") || url.includes("options="));
		expect(isOptionsUrl).toBe(true);
		
		await newPage.close();
	});
});
