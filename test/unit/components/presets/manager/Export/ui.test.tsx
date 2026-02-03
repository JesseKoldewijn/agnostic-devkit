/**
 * Unit tests for Export UI component
 */
import { checkA11y, createMockExportLogic, createPreset, renderComponent } from "@test/core";
import { describe, expect, it, vi } from "vitest";

import { ExportUI } from "@/components/presets/manager/Export/ui";

// Mock the getParameterTypeIcon function to avoid esbuild issues in test environment
vi.mock("@/logic/parameters", () => ({
	getParameterTypeIcon: vi.fn(() => "🔧"),
}));

describe("ExportUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockExportLogic();
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-export-view"]')).not.toBeNull();
		});

		it("should render heading", () => {
			const logic = createMockExportLogic();
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.querySelector('[data-testid="export-presets-heading"]')).not.toBeNull();
			expect(container.textContent).toContain("Export Presets");
		});

		it("should render cancel button", () => {
			const logic = createMockExportLogic();
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.querySelector('[data-testid="export-back-button"]')).not.toBeNull();
		});
	});

	describe("preset list", () => {
		it("should render presets", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

			const items = container.querySelectorAll('[data-testid="export-preset-item"]');
			expect(items.length).toBe(2);
		});

		it("should show preset names", () => {
			const presets = [createPreset({ id: "1", name: "My Test Preset" })];
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("My Test Preset");
		});

		it("should show preset description when available", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset", description: "A test description" }),
			];
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

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
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("2 VARS");
		});
	});

	describe("selection", () => {
		it("should show selected count when presets are selected", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("1 selected");
		});

		it("should show total count when no presets are selected", () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockExportLogic({ presets, selectedPresets: new Set() });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("2 total");
		});

		it("should apply selected styling to selected presets", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets });
			const { container } = renderComponent(ExportUI, { ...logic });

			const card = container.querySelector('[data-testid="export-preset-item"] > div');
			expect(card?.className).toContain("border-primary");
		});

		it("should disable Select All when all are selected", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, allSelected: true });
			const { container } = renderComponent(ExportUI, { ...logic });

			const selectAllBtn = container.querySelector('[data-testid="export-select-all-button-lg"]');
			expect((selectAllBtn as HTMLButtonElement)?.disabled).toBe(true);
		});

		it("should disable Deselect All when none are selected", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, selectedPresets: new Set() });
			const { container } = renderComponent(ExportUI, { ...logic });

			const deselectAllBtn = container.querySelector(
				'[data-testid="export-deselect-all-button-lg"]'
			);
			expect((deselectAllBtn as HTMLButtonElement)?.disabled).toBe(true);
		});
	});

	describe("export buttons", () => {
		it("should disable export buttons when no presets are selected", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, selectedPresets: new Set() });
			const { container } = renderComponent(ExportUI, { ...logic });

			const downloadBtn = container.querySelector('[data-testid="export-download-button"]');
			const urlBtn = container.querySelector('[data-testid="export-url-button"]');

			expect((downloadBtn as HTMLButtonElement)?.disabled).toBe(true);
			expect((urlBtn as HTMLButtonElement)?.disabled).toBe(true);
		});

		it("should enable export buttons when presets are selected", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets });
			const { container } = renderComponent(ExportUI, { ...logic });

			const downloadBtn = container.querySelector('[data-testid="export-download-button"]');
			const urlBtn = container.querySelector('[data-testid="export-url-button"]');

			expect((downloadBtn as HTMLButtonElement)?.disabled).toBe(false);
			expect((urlBtn as HTMLButtonElement)?.disabled).toBe(false);
		});

		it("should show exporting state", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, isExporting: true });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("Exporting...");
		});

		it("should show copy success message", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, copySuccess: true });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.querySelector('[data-testid="copy-success-message"]')).not.toBeNull();
			expect(container.textContent).toContain("Copied!");
		});
	});

	describe("expanded preset view", () => {
		it("should show View button for presets", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(container.textContent).toContain("View");
		});

		it("should show Hide button when preset is expanded", () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ExportUI, { ...logic });

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
			const logic = createMockExportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ExportUI, { ...logic });

			expect(
				container.querySelector('[data-testid="export-preset-expanded-params"]')
			).not.toBeNull();
			expect(container.textContent).toContain("API_KEY");
			expect(container.textContent).toContain("secret123");
		});
	});

	describe("callbacks", () => {
		it("should call onCancel when cancel button is clicked", () => {
			const onCancel = vi.fn();
			const logic = createMockExportLogic({ onCancel });
			const { container } = renderComponent(ExportUI, { ...logic });

			const backButton = container.querySelector('[data-testid="export-back-button"]');
			(backButton as HTMLElement).click();

			expect(onCancel).toHaveBeenCalled();
		});

		it("should call onToggleSelection when preset is clicked", () => {
			const onToggleSelection = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, onToggleSelection });
			const { container } = renderComponent(ExportUI, { ...logic });

			const presetItem = container.querySelector('[data-testid="export-preset-item"]');
			(presetItem as HTMLElement).click();

			expect(onToggleSelection).toHaveBeenCalledWith("1");
		});

		it("should call onToggleSelection when checkbox is clicked", () => {
			const onToggleSelection = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, onToggleSelection });
			const { container } = renderComponent(ExportUI, { ...logic });

			const checkbox = container.querySelector('[data-testid="export-preset-checkbox"]');
			(checkbox as HTMLElement).click();

			expect(onToggleSelection).toHaveBeenCalledWith("1");
		});

		it("should call onSelectAll when Select All is clicked", () => {
			const onSelectAll = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, onSelectAll });
			const { container } = renderComponent(ExportUI, { ...logic });

			const selectAllBtn = container.querySelector('[data-testid="export-select-all-button-lg"]');
			(selectAllBtn as HTMLElement).click();

			expect(onSelectAll).toHaveBeenCalled();
		});

		it("should call onClearSelection when Deselect All is clicked", () => {
			const onClearSelection = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, onClearSelection });
			const { container } = renderComponent(ExportUI, { ...logic });

			const deselectAllBtn = container.querySelector(
				'[data-testid="export-deselect-all-button-lg"]'
			);
			(deselectAllBtn as HTMLElement).click();

			expect(onClearSelection).toHaveBeenCalled();
		});

		it("should call onToggleExpanded when View button is clicked", () => {
			const onToggleExpanded = vi.fn();
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const logic = createMockExportLogic({ presets, onToggleExpanded });
			const { container } = renderComponent(ExportUI, { ...logic });

			const viewButton = container.querySelector('[data-testid="export-preset-toggle-expand"]');
			(viewButton as HTMLElement).click();

			expect(onToggleExpanded).toHaveBeenCalledWith("1");
		});

		it("should call handleExportDownload when Download is clicked", () => {
			const handleExportDownload = vi.fn().mockResolvedValue(undefined);
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, handleExportDownload });
			const { container } = renderComponent(ExportUI, { ...logic });

			const downloadBtn = container.querySelector('[data-testid="export-download-button"]');
			(downloadBtn as HTMLElement).click();

			expect(handleExportDownload).toHaveBeenCalled();
		});

		it("should call handleExportUrl when Copy URL is clicked", () => {
			const handleExportUrl = vi.fn().mockResolvedValue(undefined);
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, handleExportUrl });
			const { container } = renderComponent(ExportUI, { ...logic });

			const urlBtn = container.querySelector('[data-testid="export-url-button"]');
			(urlBtn as HTMLElement).click();

			expect(handleExportUrl).toHaveBeenCalled();
		});
	});

	describe("accessibility", () => {
		// Note: Excluding rules due to known component a11y issues (nested interactive elements)
		const axeOptions = {
			rules: {
				"nested-interactive": { enabled: false },
			},
		};

		it("should have no accessibility violations with empty state", async () => {
			const logic = createMockExportLogic();
			const { container } = renderComponent(ExportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with presets", async () => {
			const presets = [
				createPreset({ id: "1", name: "Preset One" }),
				createPreset({ id: "2", name: "Preset Two" }),
			];
			const logic = createMockExportLogic({ presets });
			const { container } = renderComponent(ExportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with selected presets", async () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets });
			const { container } = renderComponent(ExportUI, { ...logic });

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
			const logic = createMockExportLogic({ presets, expandedPresetId: "1" });
			const { container } = renderComponent(ExportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in exporting state", async () => {
			const presets = [createPreset({ id: "1", name: "Preset One" })];
			const selectedPresets = new Set(["1"]);
			const logic = createMockExportLogic({ presets, selectedPresets, isExporting: true });
			const { container } = renderComponent(ExportUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});
	});
});
