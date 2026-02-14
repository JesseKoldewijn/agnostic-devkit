import { expect, test } from "../core/fixtures";

test.describe("Release Channels E2E Tests", () => {
	test.beforeEach(async ({ context, extensionId, page }) => {
		// Mock GitHub API
		await context.route("**/api.github.com/repos/**/releases*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify([
					{
						tag_name: "v99.99.99",
						prerelease: false,
						html_url: "https://github.com/owner/repo/releases/tag/v99.99.99",
						name: "Stable Release",
					},
					{
						tag_name: "v100.0.0-canary.1",
						prerelease: true,
						html_url: "https://github.com/owner/repo/releases/tag/v100.0.0-canary.1",
						name: "Canary Release",
					},
				]),
			});
		});

		await page.goto(`chrome-extension://${extensionId}/settings.html`, {
			timeout: 15_000,
			waitUntil: "networkidle",
		});
		await page.waitForSelector("#root", { timeout: 10_000 });
	});

	test("should display the release channels section", async ({ page }) => {
		const section = page.locator('[data-testid="release-channels-section"]');
		await expect(section).toBeVisible();
		// UI uses "Release channel" (lowercase) in CardDescription
		await expect(section).toContainText(/Release channel/i);
	});

	test("should detect and show available stable update", async ({ page }) => {
		const channelLabel = page.locator('[data-testid="current-channel-label"]');
		const channel = await channelLabel.textContent();
		const expectedVersion = channel === "Canary" ? "v100.0.0-canary.1" : "v99.99.99";

		// The current version in package.json is around 1.1.4
		// Our mock returns 99.99.99 for stable/dev and 100.0.0-canary.1 for canary
		const updateStatus = page.locator('[data-testid="update-status"]');
		await expect(updateStatus).toContainText("Update available");
		await expect(updateStatus).toContainText(expectedVersion);
	});

	test("should show correct channel label based on environment", async ({ page }) => {
		const channelLabel = page.locator('[data-testid="current-channel-label"]');
		// By default in tests it should be 'development' or 'production' depending on build
		// We expect it to be visible and have one of the valid values
		await expect(channelLabel).toBeVisible();
		const text = await channelLabel.textContent();
		expect(["Production", "Canary", "Development"]).toContain(text);
	});

	test("should link to the correct release page", async ({ page }) => {
		const channelLabel = page.locator('[data-testid="current-channel-label"]');
		const channel = await channelLabel.textContent();
		const expectedVersion = channel === "Canary" ? "v100.0.0-canary.1" : "v99.99.99";
		// Escape dots for regex
		const escapedVersion = String(expectedVersion).replaceAll(".", String.raw`\.`);

		const releaseLink = page.locator('[data-testid="latest-release-link"]');
		await expect(releaseLink).toBeVisible();
		await expect(releaseLink).toHaveAttribute(
			"href",
			new RegExp(`github\\.com.*/releases/tag/${escapedVersion}`)
		);
	});
});
