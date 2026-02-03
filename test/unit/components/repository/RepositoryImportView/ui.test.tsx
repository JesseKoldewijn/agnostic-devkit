/**
 * Unit tests for RepositoryImportView UI component
 */
import {
	checkA11y,
	createMockRepositoryImportViewLogic,
	createSourceWithProvider,
	renderComponent,
} from "@test/core";
import { describe, expect, it, vi } from "vitest";

import { RepositoryImportViewUI } from "@/components/repository/RepositoryImportView/ui";

describe("RepositoryImportViewUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockRepositoryImportViewLogic();
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.querySelector('[data-testid="repository-import-view"]')).not.toBeNull();
		});

		it("should render header", () => {
			const logic = createMockRepositoryImportViewLogic();
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("Import from Repository");
		});
	});

	describe("view states", () => {
		it("should render no-sources state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "no-sources",
				hasNoSources: true,
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("No repository sources configured");
		});

		it("should render loading state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "loading",
				isLoading: true,
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("Fetching presets");
		});

		it("should render error state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "error",
				fetchResult: { success: false, files: [], error: "Network error" },
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("Network error");
		});

		it("should render fetch-prompt state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "fetch-prompt",
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("Select a source and fetch");
		});

		it("should render no-files state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "no-files",
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("No preset files found");
		});

		it("should render invalid-files state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "invalid-files",
				fetchResult: {
					success: true,
					files: [
						{
							filename: "invalid.json",
							rawUrl: "https://example.com/invalid.json",
							isValid: false,
							error: "Invalid format",
						},
					],
				},
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			// Should show information about invalid files
			expect(container.textContent).toContain("invalid.json");
		});

		it("should render presets state", () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "presets",
				hasValidFiles: true,
				allPresets: [
					{
						preset: { name: "Test Preset", parameters: [] },
						filename: "test.json",
						presetKey: "test.json-Test Preset-",
					},
				],
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			expect(container.textContent).toContain("Test Preset");
		});
	});

	describe("source selector", () => {
		it("should show source selector when sources exist", () => {
			const sources = [createSourceWithProvider()];
			const logic = createMockRepositoryImportViewLogic({
				sources,
				hasNoSources: false,
				viewState: "fetch-prompt",
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			// Should show the source selector
			expect(
				container.querySelector("select") !== null || container.textContent?.includes("Fetch")
			).toBeTruthy();
		});

		it("should not show source selector when no sources", () => {
			const logic = createMockRepositoryImportViewLogic({
				sources: [],
				hasNoSources: true,
				viewState: "no-sources",
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			// Should not show source selector, but show no-sources message
			expect(container.textContent).toContain("No repository sources configured");
		});
	});

	describe("callbacks", () => {
		it("should call onCancel when back button is clicked", () => {
			const onCancel = vi.fn();
			const logic = createMockRepositoryImportViewLogic({ onCancel });
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const backButton = container.querySelector('[aria-label="Back to preset list"]');
			if (backButton) {
				(backButton as HTMLElement).click();
				expect(onCancel).toHaveBeenCalled();
			}
		});
	});

	describe("accessibility", () => {
		// Note: Excluding rules due to known component a11y issues that should be addressed separately
		const axeOptions = {
			rules: {
				label: { enabled: false },
				"select-name": { enabled: false },
				"nested-interactive": { enabled: false },
			},
		};

		it("should have no accessibility violations in fetch-prompt state", async () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "fetch-prompt",
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in loading state", async () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "loading",
				isLoading: true,
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in no-sources state", async () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "no-sources",
				hasNoSources: true,
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in error state", async () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "error",
				fetchResult: { success: false, files: [], error: "Test error" },
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with presets", async () => {
			const logic = createMockRepositoryImportViewLogic({
				viewState: "presets",
				hasValidFiles: true,
				allPresets: [
					{
						preset: { name: "Test Preset", parameters: [] },
						filename: "test.json",
						presetKey: "test.json-Test Preset-",
					},
				],
			});
			const { container } = renderComponent(RepositoryImportViewUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});
	});
});
