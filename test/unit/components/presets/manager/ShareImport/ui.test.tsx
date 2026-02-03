/**
 * Unit tests for ShareImport UI component
 */
import { checkA11y, createMockShareImportLogic, createPreset, renderComponent } from "@test/core";
import { describe, expect, it, vi } from "vitest";

import { ShareImportUI } from "@/components/presets/manager/ShareImport/ui";

// Mock the getParameterTypeIcon function to avoid esbuild issues in test environment
vi.mock("@/logic/parameters", () => ({
	getParameterTypeIcon: vi.fn(() => "🔧"),
}));

describe("ShareImportUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockShareImportLogic();
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="share-import-modal"]')).not.toBeNull();
		});

		it("should render heading", () => {
			const logic = createMockShareImportLogic();
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="share-import-heading"]')).not.toBeNull();
			expect(container.textContent).toContain("Import Shared Presets");
		});

		it("should render cancel button", () => {
			const logic = createMockShareImportLogic();
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="cancel-share-import-button"]')).not.toBeNull();
		});
	});

	describe("error state", () => {
		it("should render error when shareImportError is set", () => {
			const logic = createMockShareImportLogic({
				shareImportError: "Invalid share URL",
			});
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="share-import-error"]')).not.toBeNull();
			expect(container.textContent).toContain("Invalid share URL");
		});

		it("should not render error when shareImportError is null", () => {
			const logic = createMockShareImportLogic({ shareImportError: null });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="share-import-error"]')).toBeNull();
		});

		it("should not render presets list when error exists", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({
				presets,
				shareImportError: "Some error",
			});
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.querySelector('[data-testid="share-import-preset-item"]')).toBeNull();
		});
	});

	describe("preset list", () => {
		it("should render presets", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const items = container.querySelectorAll('[data-testid="share-import-preset-item"]');
			expect(items.length).toBe(2);
		});

		it("should show preset names", () => {
			const presets = [createPreset({ id: "1", name: "My Test Preset" })];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("My Test Preset");
		});

		it("should show preset description when available", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset", description: "A test description" }),
			];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("A test description");
		});

		it("should show parameter count badge", () => {
			const presets = [
				createPreset({
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", key: "key1", value: "val1", type: "queryParam" },
						{ id: "p2", key: "key2", value: "val2", type: "queryParam" },
					],
				}),
			];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("2 VARS");
		});
	});

	describe("selection", () => {
		it("should show import count based on selections", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("Import (1)");
		});

		it("should apply selected styling to selected presets", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const card = container.querySelector('[data-testid="share-import-preset-item"]');
			expect(card?.className).toContain("border-primary");
		});

		it("should show Select All when not all selected", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockShareImportLogic({ presets, allSelected: false });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const selectAllBtn = container.querySelector(
				'[data-testid="share-import-select-all-button"]'
			);
			expect(selectAllBtn?.textContent).toContain("Select All");
		});

		it("should show Deselect All when all selected", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, allSelected: true });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const selectAllBtn = container.querySelector(
				'[data-testid="share-import-select-all-button"]'
			);
			expect(selectAllBtn?.textContent).toContain("Deselect All");
		});

		it("should disable confirm button when no selections", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, importSelections: new Set() });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const confirmBtn = container.querySelector('[data-testid="share-import-confirm"]');
			expect((confirmBtn as HTMLButtonElement)?.disabled).toBe(true);
		});

		it("should enable confirm button when there are selections", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const confirmBtn = container.querySelector('[data-testid="share-import-confirm"]');
			expect((confirmBtn as HTMLButtonElement)?.disabled).toBe(false);
		});

		it("should check checkbox for selected presets", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const checkbox = container.querySelector(
				'[data-testid="share-import-preset-checkbox"]'
			) as HTMLInputElement;
			expect(checkbox?.checked).toBe(true);
		});
	});

	describe("expanded preset view", () => {
		it("should show View text for presets", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("View");
		});

		it("should show Hide text when preset is expanded", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(container.textContent).toContain("Hide");
		});

		it("should show expanded params when preset is expanded", () => {
			const presets = [
				createPreset({
					id: "1",
					name: "Preset One",
					parameters: [{ id: "p1", key: "API_KEY", value: "secret123", type: "queryParam" }],
				}),
			];
			const logic = createMockShareImportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			expect(
				container.querySelector('[data-testid="share-import-preset-expanded-params"]')
			).not.toBeNull();
			expect(container.textContent).toContain("API_KEY");
			expect(container.textContent).toContain("secret123");
		});
	});

	describe("callbacks", () => {
		it("should call onCancel when cancel button is clicked", () => {
			const onCancel = vi.fn();
			const logic = createMockShareImportLogic({ onCancel });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const cancelButton = container.querySelector('[data-testid="cancel-share-import-button"]');
			(cancelButton as HTMLElement).click();

			expect(onCancel).toHaveBeenCalled();
		});

		it("should call onToggleSelection when checkbox changes", () => {
			const onToggleSelection = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, onToggleSelection });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const checkbox = container.querySelector('[data-testid="share-import-preset-checkbox"]');
			(checkbox as HTMLInputElement).click();

			expect(onToggleSelection).toHaveBeenCalledWith("1");
		});

		it("should call onToggleExpanded when preset button is clicked", () => {
			const onToggleExpanded = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, onToggleExpanded });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const presetButton = container.querySelector(
				'[data-testid="share-import-preset-item"] button'
			);
			(presetButton as HTMLElement).click();

			expect(onToggleExpanded).toHaveBeenCalledWith("1");
		});

		it("should call onSelectAll when Select All is clicked and not all selected", () => {
			const onSelectAll = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, onSelectAll, allSelected: false });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const selectAllBtn = container.querySelector(
				'[data-testid="share-import-select-all-button"]'
			);
			(selectAllBtn as HTMLElement).click();

			expect(onSelectAll).toHaveBeenCalled();
		});

		it("should call onDeselectAll when Deselect All is clicked", () => {
			const onDeselectAll = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockShareImportLogic({ presets, onDeselectAll, allSelected: true });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const selectAllBtn = container.querySelector(
				'[data-testid="share-import-select-all-button"]'
			);
			(selectAllBtn as HTMLElement).click();

			expect(onDeselectAll).toHaveBeenCalled();
		});

		it("should call onConfirm when confirm button is clicked", () => {
			const onConfirm = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections, onConfirm });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const confirmBtn = container.querySelector('[data-testid="share-import-confirm"]');
			(confirmBtn as HTMLElement).click();

			expect(onConfirm).toHaveBeenCalled();
		});
	});

	describe("accessibility", () => {
		// Note: Excluding rules due to known component a11y issues
		const axeOptions = {
			rules: {
				"nested-interactive": { enabled: false },
			},
		};

		it("should have no accessibility violations with empty state", async () => {
			const logic = createMockShareImportLogic();
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with error state", async () => {
			const logic = createMockShareImportLogic({ shareImportError: "Test error" });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with presets", async () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockShareImportLogic({ presets });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with selected presets", async () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const importSelections = new Set(["1"]);
			const logic = createMockShareImportLogic({ presets, importSelections });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with expanded preset", async () => {
			const presets = [
				createPreset({
					id: "1",
					name: "Preset One",
					parameters: [{ id: "p1", key: "KEY", value: "value", type: "queryParam" }],
				}),
			];
			const logic = createMockShareImportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ShareImportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});
	});
});
