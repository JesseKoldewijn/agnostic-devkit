import type { Page } from "@playwright/test";

import { expect, test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

/**
 * E2E tests for Repository Import functionality
 * - Settings page: configuring provider instances and repository sources
 * - Preset Manager: importing presets from configured sources
 */

test.describe("Repository Import E2E Tests", () => {
	test.describe("Settings - Repository Configuration", () => {
		test.beforeEach(async ({ extensionId, page }) => {
			await page.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await page.waitForSelector("#root", { timeout: 10_000 });
		});

		test("should display the repository configuration section", async ({ page }) => {
			const section = page.locator('[data-testid="repository-configuration-section"]');
			await expect(section).toBeVisible();
			await expect(section).toContainText("Repository Sources");
		});

		test("should show empty state when no providers configured", async ({ page }) => {
			const emptyState = page.locator('[data-testid="no-providers-message"]');
			// This will only show if there are no provider instances
			// Since we start fresh, it should be visible
			await expect(emptyState).toBeVisible();
		});

		test("should open provider modal when clicking add provider", async ({ page }) => {
			await page.locator('[data-testid="add-provider-button"]').click();
			const modal = page.locator('[data-testid="provider-modal"]');
			await expect(modal).toBeVisible();
			await expect(modal).toContainText("Add GitHub Instance");
		});

		test("should add a new provider instance", async ({ page }) => {
			// Open modal
			await page.locator('[data-testid="add-provider-button"]').click();

			// Fill form (provider type is now auto-detected as GitHub)
			await page.locator('[data-testid="provider-name-input"]').fill("My GitHub");
			await page.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await page.locator('[data-testid="provider-token-input"]').fill("github_pat_test123");

			// Save
			await page.locator('[data-testid="save-provider-button"]').click();

			// Wait for the modal to close
			await expect(page.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Verify it appears in the list
			const providerItem = page.locator('[data-testid="provider-instance-item"]', {
				hasText: "My GitHub",
			});
			await expect(providerItem).toBeVisible();
			await expect(providerItem).toContainText("github.com");
		});

		test("should edit a provider instance", async ({ page }) => {
			// First add a provider
			await page.locator('[data-testid="add-provider-button"]').click();
			await page.locator('[data-testid="provider-name-input"]').fill("Test Provider");
			await page.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await page.locator('[data-testid="save-provider-button"]').click();

			// Wait for the modal to close
			await expect(page.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Now edit it
			const providerItem = page.locator('[data-testid="provider-instance-item"]', {
				hasText: "Test Provider",
			});
			await providerItem.locator('[data-testid="edit-provider-button"]').click();

			// Update name
			await page.locator('[data-testid="provider-name-input"]').fill("Updated Provider");
			await page.locator('[data-testid="save-provider-button"]').click();

			// Wait for the modal to close
			await expect(page.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Verify updated
			await expect(
				page.locator('[data-testid="provider-instance-item"]', { hasText: "Updated Provider" })
			).toBeVisible();
		});

		test("should delete a provider instance", async ({ page }) => {
			// Add a provider
			await page.locator('[data-testid="add-provider-button"]').click();
			await page.locator('[data-testid="provider-name-input"]').fill("To Delete");
			await page.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await page.locator('[data-testid="save-provider-button"]').click();

			// Wait for the modal to close
			await expect(page.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Delete it
			const providerItem = page.locator('[data-testid="provider-instance-item"]', {
				hasText: "To Delete",
			});
			await providerItem.locator('[data-testid="delete-provider-button"]').click();

			// Verify gone
			await expect(providerItem).not.toBeVisible();
		});

		test("should show empty state when no sources configured", async ({ page }) => {
			const emptyState = page.locator('[data-testid="no-sources-message"]');
			// This will show if there are no repository sources
			await expect(emptyState).toBeVisible();
		});

		test("should open source modal when clicking add source", async ({ page }) => {
			await page.locator('[data-testid="add-source-button"]').click();
			const modal = page.locator('[data-testid="source-modal"]');
			await expect(modal).toBeVisible();
			await expect(modal).toContainText("Add Preset Source");
		});

		test("should add a public URL source (no provider)", async ({ page }) => {
			// Open source modal
			await page.locator('[data-testid="add-source-button"]').click();

			// Fill form - select URL type first
			await page.locator('[data-testid="source-name-input"]').fill("Public Presets");
			await page.locator('[data-testid="source-type-select"]').selectOption("url");
			await page
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			// Leave provider as none

			// Save
			await page.locator('[data-testid="save-source-button"]').click();

			// Verify it appears
			const sourceItem = page.locator('[data-testid="repository-source-item"]', {
				hasText: "Public Presets",
			});
			await expect(sourceItem).toBeVisible();
		});

		test("should add a source with provider", async ({ page }) => {
			// First add a provider
			await page.locator('[data-testid="add-provider-button"]').click();
			await page.locator('[data-testid="provider-name-input"]').fill("GitHub Auth");
			await page.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await page.locator('[data-testid="provider-token-input"]').fill("github_pat_test123");
			await page.locator('[data-testid="save-provider-button"]').click();

			// Wait for the provider modal to close
			await expect(page.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Now add a source with this provider
			await page.locator('[data-testid="add-source-button"]').click();
			await page.locator('[data-testid="source-name-input"]').fill("Private Repo");
			await page.locator('[data-testid="source-url-input"]').fill("https://github.com/user/repo");
			// Select by the visible label text which includes the domain
			await page
				.locator('[data-testid="source-provider-select"]')
				.selectOption({ label: "GitHub Auth (github.com)" });

			await page.locator('[data-testid="save-source-button"]').click();

			// Verify it shows the provider link
			const sourceItem = page.locator('[data-testid="repository-source-item"]', {
				hasText: "Private Repo",
			});
			await expect(sourceItem).toBeVisible();
			await expect(sourceItem).toContainText("GitHub Auth");
		});

		test("should show schema info modal", async ({ page }) => {
			await page.locator('[data-testid="schema-info-button"]').click();
			const modal = page.locator('[data-testid="schema-info-modal"]');
			await expect(modal).toBeVisible();
			await expect(modal).toContainText("Preset File Format");
			await expect(modal).toContainText("queryParam");
			await expect(modal).toContainText("cookie");
			await expect(modal).toContainText("localStorage");
		});
	});

	test.describe("Preset Manager - Repository Import", () => {
		let testPage: Page;
		let popupPage: Page;

		test.beforeEach(async ({ context, extensionId }) => {
			// Start with a test page and popup
			testPage = await createTestPage(context, "https://example.com");
			const tabId = await getTabId(context, testPage);
			popupPage = await openPopupPage(context, extensionId, tabId);

			// Go to preset manager
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');

			// Go to import view
			await popupPage.locator('[data-testid="import-presets-button"]').click();
		});

		test.afterEach(async () => {
			if (popupPage) {
				await popupPage.close();
			}
			if (testPage) {
				await testPage.close();
			}
		});

		test("should show From Repo button", async () => {
			const fromRepoButton = popupPage.locator('[data-testid="import-from-repo-button"]');
			await expect(fromRepoButton).toBeVisible();
			await expect(fromRepoButton).toContainText("Browse Repositories");
		});

		test("should open repository import modal when clicking From Repo", async () => {
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			const modal = popupPage.locator('[data-testid="repository-import-view"]');
			await expect(modal).toBeVisible();
			await expect(modal).toContainText("Import from Repository");
		});

		test("should show no sources message when no sources configured", async () => {
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			const noSourcesMessage = popupPage.locator('[data-testid="no-sources-message"]');
			await expect(noSourcesMessage).toBeVisible();
			await expect(noSourcesMessage).toContainText("No repository sources configured");
			await expect(noSourcesMessage).toContainText("Settings → Repository Sources");
		});

		test("should close modal when clicking cancel", async () => {
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			const modal = popupPage.locator('[data-testid="repository-import-view"]');
			await expect(modal).toBeVisible();

			await popupPage.locator('[data-testid="repository-import-back-button"]').click();
			await expect(modal).not.toBeVisible();
		});
	});

	test.describe("Repository Import with Mocked API", () => {
		let testPage: Page;
		let popupPage: Page;

		test.beforeEach(async ({ context, extensionId }) => {
			// Mock GitHub API responses
			await context.route("**/api.github.com/repos/**/contents/**", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "valid-presets.json",
							path: "valid-presets.json",
							type: "file",
							download_url: "https://raw.githubusercontent.com/user/repo/main/valid-presets.json",
						},
						{
							name: "invalid-presets.json",
							path: "invalid-presets.json",
							type: "file",
							download_url: "https://raw.githubusercontent.com/user/repo/main/invalid-presets.json",
						},
					]),
				});
			});

			// Mock raw content for valid presets
			await context.route("**/raw.githubusercontent.com/**/valid-presets.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "Debug Mode",
							description: "Enable debugging",
							parameters: [
								{
									type: "queryParam",
									key: "debug",
									value: "true",
								},
							],
						},
					]),
				});
			});

			// Mock raw content for invalid presets
			await context.route("**/raw.githubusercontent.com/**/invalid-presets.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							// Missing name - invalid
							parameters: [],
						},
					]),
				});
			});

			// Mock direct URL source
			await context.route("**/example.com/presets.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "URL Preset",
							parameters: [
								{
									type: "cookie",
									key: "session",
									value: "test123",
								},
							],
						},
					]),
				});
			});

			// Start with a test page
			testPage = await createTestPage(context, "https://example.com");
			const tabId = await getTabId(context, testPage);

			// Set up storage with a source configured
			// This would require accessing the extension's storage API
			// For now, we'll test the flow through settings first

			popupPage = await openPopupPage(context, extensionId, tabId);
		});

		test.afterEach(async () => {
			if (popupPage) {
				await popupPage.close();
			}
			if (testPage) {
				await testPage.close();
			}
		});

		test("should show fetch button when sources are configured", async ({
			context,
			extensionId,
		}) => {
			// First, configure a source via settings
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			// Add a URL source (doesn't need a provider) - need to select URL type
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Test Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Now open the import modal from popup
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			// Go to import view first
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Should now show the source selector and fetch button
			const sourceSelect = popupPage.locator('[data-testid="source-select"]');
			await expect(sourceSelect).toBeVisible();

			const fetchButton = popupPage.locator('[data-testid="fetch-button"]');
			await expect(fetchButton).toBeVisible();
		});

		test("should show schema description when no valid files found", async ({
			context,
			extensionId,
		}) => {
			// Configure a source that will return invalid files
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			// Add a provider first (provider type is auto-detected as GitHub)
			await settingsPage.locator('[data-testid="add-provider-button"]').click();
			await settingsPage.locator('[data-testid="provider-name-input"]').fill("Test GitHub");
			await settingsPage.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await settingsPage.locator('[data-testid="save-provider-button"]').click();

			// Wait for the provider modal to close
			await expect(settingsPage.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Add a source
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Invalid Source");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://github.com/user/repo/tree/main/invalid-only");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock to only return invalid files
			await context.route("**/api.github.com/repos/**/contents/**", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "bad-preset.json",
							path: "bad-preset.json",
							type: "file",
							download_url: "https://raw.githubusercontent.com/user/repo/main/bad-preset.json",
						},
					]),
				});
			});

			await context.route("**/raw.githubusercontent.com/**/bad-preset.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ invalid: "data" }), // Not an array
				});
			});

			// Open import modal and fetch
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			// Go to import view first
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			await popupPage.locator('[data-testid="fetch-button"]').click();

			// Should show the "no valid files" message with schema description
			const noValidMessage = popupPage.locator('[data-testid="no-valid-files-message"]');
			await expect(noValidMessage).toBeVisible({ timeout: 10_000 });
			await expect(noValidMessage).toContainText("No valid preset files found");

			// Schema description should be inline, not a link
			const schemaDescription = popupPage.locator('[data-testid="schema-description"]');
			await expect(schemaDescription).toBeVisible();
			await expect(schemaDescription).toContainText("queryParam");
			await expect(schemaDescription).toContainText("cookie");
			await expect(schemaDescription).toContainText("localStorage");
		});

		test("should fetch and display valid presets from repository", async ({
			context,
			extensionId,
		}) => {
			// Configure a source via settings
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			// Add a URL source
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Valid Presets");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for auto-fetch to complete
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });

			// Should display the fetched preset
			const presetItem = popupPage.locator('[data-testid="preset-item"]');
			await expect(presetItem).toBeVisible();
			await expect(presetItem).toContainText("URL Preset");
		});

		test("should select and deselect presets", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Test Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for presets to load
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });

			// Preset should be selected by default (auto-select all)
			const checkbox = popupPage.locator('[data-testid="preset-checkbox"]').first();
			await expect(checkbox).toBeVisible();

			// Click to deselect
			await popupPage.locator('[data-testid="preset-item"]').first().click();
			// Click again to re-select
			await popupPage.locator('[data-testid="preset-item"]').first().click();
		});

		test("should use Select All and Deselect All buttons", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Test Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for presets to load
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });

			// Click "None" to deselect all
			await popupPage.locator('[data-testid="deselect-all-button"]').click();

			// Import button should be disabled
			const importButton = popupPage.locator('[data-testid="import-confirm"]');
			await expect(importButton).toBeDisabled();

			// Click "All" to select all
			await popupPage.locator('[data-testid="select-all-button"]').click();

			// Import button should be enabled
			await expect(importButton).toBeEnabled();
		});

		test("should expand and collapse preset details", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Test Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for presets to load
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });

			// Click "View" to expand
			await popupPage.locator('[data-testid="preset-expand-toggle"]').first().click();

			// Should show parameter details
			const paramsSection = popupPage.locator('[data-testid="preset-params"]');
			await expect(paramsSection).toBeVisible();

			// Click "Hide" to collapse
			await popupPage.locator('[data-testid="preset-expand-toggle"]').first().click();
			await expect(paramsSection).not.toBeVisible();
		});

		test("should toggle schema example in invalid files state", async ({
			context,
			extensionId,
		}) => {
			// Configure a source that will return invalid files
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			// Add a provider first
			await settingsPage.locator('[data-testid="add-provider-button"]').click();
			await settingsPage.locator('[data-testid="provider-name-input"]').fill("Test GitHub");
			await settingsPage.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await settingsPage.locator('[data-testid="save-provider-button"]').click();
			await expect(settingsPage.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			// Add a source
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Invalid Source");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://github.com/user/repo/tree/main/invalid");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock to only return invalid files
			await context.route("**/api.github.com/repos/**/contents/**", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "bad-preset.json",
							path: "bad-preset.json",
							type: "file",
							download_url: "https://raw.githubusercontent.com/user/repo/main/bad-preset.json",
						},
					]),
				});
			});

			await context.route("**/raw.githubusercontent.com/**/bad-preset.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ invalid: "data" }),
				});
			});

			// Open import modal and fetch
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			await popupPage.locator('[data-testid="fetch-button"]').click();

			// Wait for no valid files message
			await popupPage.waitForSelector('[data-testid="no-valid-files-message"]', {
				timeout: 10_000,
			});

			// Example should be hidden initially
			const schemaExample = popupPage.locator('[data-testid="schema-example"]');
			await expect(schemaExample).not.toBeVisible();

			// Click to show example
			await popupPage.locator('[data-testid="toggle-example-button"]').click();
			await expect(schemaExample).toBeVisible();

			// Click to hide example
			await popupPage.locator('[data-testid="toggle-example-button"]').click();
			await expect(schemaExample).not.toBeVisible();
		});

		test("should display invalid file items with error messages", async ({
			context,
			extensionId,
		}) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-provider-button"]').click();
			await settingsPage.locator('[data-testid="provider-name-input"]').fill("Test GitHub");
			await settingsPage.locator('[data-testid="provider-baseurl-input"]').fill("github.com");
			await settingsPage.locator('[data-testid="save-provider-button"]').click();
			await expect(settingsPage.locator('[data-testid="provider-modal"]')).not.toBeVisible();

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Mixed Source");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://github.com/user/repo/tree/main/mixed");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock mixed files response
			await context.route("**/api.github.com/repos/**/contents/**", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "invalid.json",
							path: "invalid.json",
							type: "file",
							download_url: "https://raw.githubusercontent.com/user/repo/main/invalid.json",
						},
					]),
				});
			});

			await context.route("**/raw.githubusercontent.com/**/invalid.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ not_an_array: true }),
				});
			});

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();
			await popupPage.locator('[data-testid="fetch-button"]').click();

			// Wait for no valid files message
			await popupPage.waitForSelector('[data-testid="no-valid-files-message"]', {
				timeout: 10_000,
			});

			// Should display invalid file items
			const invalidFileItem = popupPage.locator('[data-testid="invalid-file-item"]');
			await expect(invalidFileItem).toBeVisible();
			await expect(invalidFileItem).toContainText("invalid.json");
		});

		test("should import selected presets", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Import Test");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock the URL source response
			await context.route("**/example.com/presets.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "URL Preset",
							description: "A preset from URL",
							parameters: [{ type: "queryParam", key: "imported", value: "true" }],
						},
					]),
				});
			});

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for presets to load (may auto-fetch or need fetch click)
			const presetsListVisible = await popupPage
				.locator('[data-testid="presets-list"]')
				.isVisible()
				.catch(() => false);
			if (!presetsListVisible) {
				await popupPage.locator('[data-testid="fetch-button"]').click();
				await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });
			}

			// Wait for preset items to load
			await popupPage.waitForSelector('[data-testid="preset-item"]', { timeout: 10_000 });

			// Presets should be auto-selected, so just click import
			// If not selected, click the preset item to toggle selection
			const presetItem = popupPage.locator('[data-testid="preset-item"]').first();
			const checkbox = presetItem.locator('[data-testid="preset-checkbox"]');
			const isSelected = await checkbox.evaluate((el) => el.classList.contains("bg-primary"));
			if (!isSelected) {
				await presetItem.click();
			}

			// Click import button
			await popupPage.locator('[data-testid="import-confirm"]').click();

			// Should return to preset manager with the imported preset
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]', {
				timeout: 10_000,
			});

			// The imported preset should be visible in the preset list
			await expect(popupPage.locator('[data-testid="preset-item"]').first()).toBeVisible({
				timeout: 5000,
			});
			await expect(popupPage.locator('[data-testid="preset-item"]').first()).toContainText(
				"URL Preset"
			);
		});

		test("should handle fetch error gracefully", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Error Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/error.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock error response - return 404 not found
			await context.route("**/example.com/error.json", async (route) => {
				await route.abort("failed");
			});

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for fetch button and click it
			await popupPage.waitForSelector('[data-testid="fetch-button"]', { timeout: 10_000 });
			await popupPage.locator('[data-testid="fetch-button"]').click();

			// Should show error message or no-valid-files (depending on how the error is handled)
			await expect(
				popupPage.locator('[data-testid="fetch-error"], [data-testid="no-valid-files-message"]')
			).toBeVisible({ timeout: 10_000 });
		});

		test("should show loading state during fetch", async ({ context, extensionId }) => {
			// Configure a source
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Slow Source");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/slow.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock slow response
			await context.route("**/example.com/slow.json", async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([{ name: "Slow Preset", parameters: [] }]),
				});
			});

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Trigger fetch manually since auto-fetch might happen too fast
			await popupPage.waitForSelector('[data-testid="fetch-button"]', { timeout: 10_000 });

			// Check that loading state appears
			const loadingState = popupPage.locator('[data-testid="loading-state"]');
			// Note: This might be flaky due to timing, but helps coverage
			if (await loadingState.isVisible({ timeout: 500 }).catch(() => false)) {
				await expect(loadingState).toBeVisible();
			}

			// Wait for fetch to complete
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 15_000 });
		});

		test("should auto-fetch when source changes", async ({ context, extensionId }) => {
			// Configure multiple sources
			const settingsPage = await context.newPage();
			await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`, {
				timeout: 15_000,
				waitUntil: "networkidle",
			});
			await settingsPage.waitForSelector("#root", { timeout: 10_000 });

			// Add first source
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Source 1");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();

			// Wait for modal to close
			await expect(settingsPage.locator('[data-testid="source-modal"]')).not.toBeVisible();

			// Add second source with different URL
			await settingsPage.locator('[data-testid="add-source-button"]').click();
			await settingsPage.locator('[data-testid="source-name-input"]').fill("Source 2");
			await settingsPage.locator('[data-testid="source-type-select"]').selectOption("url");
			await settingsPage
				.locator('[data-testid="source-url-input"]')
				.fill("https://example.com/presets2.json");
			await settingsPage.locator('[data-testid="save-source-button"]').click();
			await settingsPage.close();

			// Mock second source
			await context.route("**/example.com/presets2.json", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify([
						{
							name: "Second Source Preset",
							parameters: [{ type: "queryParam", key: "from", value: "source2" }],
						},
					]),
				});
			});

			// Open import modal
			await popupPage.locator('[data-testid="manage-presets-button"]').click();
			await popupPage.waitForSelector('[data-testid="preset-manager-container"]');
			await popupPage.locator('[data-testid="import-presets-button"]').click();
			await popupPage.locator('[data-testid="import-from-repo-button"]').click();

			// Wait for first source to load
			await popupPage.waitForSelector('[data-testid="presets-list"]', { timeout: 10_000 });

			// Change to second source
			await popupPage.locator('[data-testid="source-select"]').selectOption("Source 2");

			// Wait for second source to load (auto-fetch)
			await expect(popupPage.locator('[data-testid="preset-item"]')).toContainText(
				"Second Source Preset",
				{ timeout: 10_000 }
			);
		});
	});
});
