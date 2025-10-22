import { test, expect } from "./core/test-with-extension";
import { openPopupPage } from "./core/helpers";

/**
 * E2E tests for the Chrome extension popup
 * These tests verify popup functionality and UI elements
 */

test.describe("Popup E2E Tests", () => {
	test("should open and display popup correctly", async ({
		extensionContext,
		extensionId,
	}) => {
		// Navigate directly to popup page (works with launchPersistentContext)
		const popupPage = await openPopupPage(extensionContext, extensionId);

		// The helper should have already waited for root, but verify it exists
		// If root doesn't exist, check what's actually on the page
		const rootExists = await popupPage
			.locator("#root")
			.count()
			.catch(() => 0);
		if (rootExists === 0) {
			// Debug: log page content
			const bodyText = await popupPage
				.locator("body")
				.textContent()
				.catch(() => "");
			const pageUrl = popupPage.url();
			const pageTitle = await popupPage.title().catch(() => "");
			console.log(`Page URL: ${pageUrl}`);
			console.log(`Page Title: ${pageTitle}`);
			console.log(`Body content: ${bodyText?.substring(0, 200)}`);
			throw new Error(
				`Root element not found. URL: ${pageUrl}, Title: ${pageTitle}`
			);
		}

		// Listen for console messages to debug
		popupPage.on("console", (msg) => {
			if (msg.type() === "error") {
				console.log("Console error:", msg.text());
			}
		});

		// Wait for network to be idle to ensure scripts loaded
		await popupPage
			.waitForLoadState("networkidle", { timeout: 15000 })
			.catch(() => {
				// Network idle may timeout, that's okay
			});

		// Wait for content to actually render - check if heading appears
		await popupPage
			.waitForSelector("h1, [role='heading']", {
				timeout: 10000,
				state: "attached",
			})
			.catch(async () => {
				// If heading doesn't appear, wait longer and check root content
				await popupPage.waitForTimeout(3000);
				const rootText = await popupPage.locator("#root").textContent();
				if (!rootText || rootText.trim().length === 0) {
					throw new Error(
						"Content not rendering - root element is empty"
					);
				}
			});

		// Verify title (may be URL initially, but content should load)
		const title = await popupPage.title();
		// Title might be the URL if page is still loading, so we check content instead
		expect(title).toBeTruthy();

		// Verify main heading is visible
		const heading = popupPage.getByRole("heading", {
			name: "Chrome Extension",
		});
		await expect(heading).toBeVisible();

		// Verify description text
		const description = popupPage.getByText(
			"Built with Vite + SolidJS + Tailwind CSS v4"
		);
		await expect(description).toBeVisible();

		// Verify theme indicator is visible
		const themeIndicator = popupPage.getByText(/Theme:/);
		await expect(themeIndicator).toBeVisible();

		await popupPage.close();
	});

	test("should display count button and increment on click", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find the count button
		const countButton = popupPage.getByRole("button", { name: /Count:/ });
		await expect(countButton).toBeVisible();

		// Get initial count
		const initialText = await countButton.textContent();
		const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

		// Click the button
		await countButton.click();

		// Wait for state update
		await popupPage.waitForTimeout(100);

		// Verify count incremented
		const newText = await countButton.textContent();
		const newCount = parseInt(newText?.match(/\d+/)?.[0] || "0");
		expect(newCount).toBe(initialCount + 1);

		// Click again to verify it continues incrementing
		await countButton.click();
		await popupPage.waitForTimeout(100);

		const finalText = await countButton.textContent();
		const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || "0");
		expect(finalCount).toBe(initialCount + 2);

		await popupPage.close();
	});

	test("should have Open Options button that navigates to options page", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Find the Open Options button
		const openOptionsButton = popupPage.getByRole("button", {
			name: "Open Options",
		});
		await expect(openOptionsButton).toBeVisible();

		// Click the button and wait for options page to open
		const [optionsPage] = await Promise.all([
			extensionContext.waitForEvent("page"),
			openOptionsButton.click(),
		]);

		// Verify options page opened
		await optionsPage.waitForLoadState("networkidle");
		const optionsTitle = await optionsPage.title();
		expect(optionsTitle).toBe("Chrome Extension Options");

		// Verify options page content
		const optionsHeading = optionsPage.getByRole("heading", {
			name: "Extension Options",
		});
		await expect(optionsHeading).toBeVisible();

		await popupPage.close();
		await optionsPage.close();
	});

	test("should display current theme", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);
		await popupPage.waitForLoadState("networkidle");

		// Verify theme indicator shows a valid theme
		const themeIndicator = popupPage.getByText(
			/Theme: (light|dark|system)/
		);
		await expect(themeIndicator).toBeVisible();

		const themeText = await themeIndicator.textContent();
		expect(themeText).toMatch(/Theme: (light|dark|system)/);

		await popupPage.close();
	});

	test("should have correct popup dimensions", async ({
		extensionContext,
		extensionId,
	}) => {
		const popupPage = await openPopupPage(extensionContext, extensionId);

		// Verify the main container has the expected width class
		const mainContainer = popupPage.locator(".w-96");
		await expect(mainContainer).toBeVisible();

		await popupPage.close();
	});
});
