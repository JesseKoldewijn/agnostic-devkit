/**
 * Unit tests for PresetToggleList UI component
 */
import {
	checkA11y,
	createMockPresetToggleListLogic,
	createPreset,
	createPresetWithParams,
	createPresetsWithActiveState,
	renderComponent,
} from "@test/core";
import { describe, expect, it, vi } from "vitest";

import { PresetToggleListUI } from "@/components/presets/PresetToggleList/ui";

// Mock the getParameterTypeIcon function
vi.mock("@/logic/parameters", () => ({
	getParameterTypeIcon: vi.fn(() => "🔧"),
}));

describe("PresetToggleListUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockPresetToggleListLogic();
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-toggle-list"]')).not.toBeNull();
		});

		it("should render heading", () => {
			const logic = createMockPresetToggleListLogic();
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const heading = container.querySelector('[data-testid="presets-heading"]');
			expect(heading).not.toBeNull();
			expect(heading?.textContent).toBe("Active Presets");
		});

		it("should render manage button when onManagePresets is provided", () => {
			const logic = createMockPresetToggleListLogic({ onManagePresets: vi.fn() });
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.querySelector('[data-testid="manage-presets-button"]')).not.toBeNull();
		});

		it("should not render manage button when onManagePresets is not provided", () => {
			const logic = createMockPresetToggleListLogic();
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.querySelector('[data-testid="manage-presets-button"]')).toBeNull();
		});
	});

	describe("loading state", () => {
		it("should render loading spinner when loading", () => {
			const logic = createMockPresetToggleListLogic({ loading: true });
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			// Check for spinner (animate-spin class)
			const spinner = container.querySelector(".animate-spin");
			expect(spinner).not.toBeNull();
		});

		it("should not render presets container when loading", () => {
			const logic = createMockPresetToggleListLogic({ loading: true });
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			expect(container.querySelector('[data-testid="presets-container"]')).toBeNull();
		});
	});

	describe("empty state", () => {
		it("should render empty state when not loading and no presets", () => {
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets: [],
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			expect(container.textContent).toContain("No presets active");
		});

		it("should render create first preset button when onManagePresets provided", () => {
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets: [],
				onManagePresets: vi.fn(),
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.querySelector('[data-testid="create-first-preset-button"]')).not.toBeNull();
		});
	});

	describe("presets list", () => {
		it("should render preset items", () => {
			const presets = createPresetsWithActiveState(
				[
					createPreset({ id: "p1", name: "Preset 1" }),
					createPreset({ id: "p2", name: "Preset 2" }),
				],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const items = container.querySelectorAll('[data-testid="preset-toggle-item"]');
			expect(items).toHaveLength(2);
		});

		it("should render preset name", () => {
			const presets = createPresetsWithActiveState(
				[createPreset({ id: "p1", name: "My Test Preset" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const name = container.querySelector('[data-testid="preset-toggle-name"]');
			expect(name?.textContent).toBe("My Test Preset");
		});

		it("should render preset description when present", () => {
			const presets = createPresetsWithActiveState(
				[createPreset({ id: "p1", name: "Test", description: "Test description" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const description = container.querySelector('[data-testid="preset-toggle-description"]');
			expect(description?.textContent).toBe("Test description");
		});

		it("should not render description when not present", () => {
			const presets = createPresetsWithActiveState(
				[createPreset({ id: "p1", name: "Test" })], // No description
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-toggle-description"]')).toBeNull();
		});

		it("should render parameter count badge", () => {
			const presets = createPresetsWithActiveState(
				[createPresetWithParams(3, { id: "p1", name: "Test" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			expect(container.textContent).toContain("3 VARS");
		});

		it("should render toggle switch for each preset", () => {
			const presets = createPresetsWithActiveState(
				[
					createPreset({ id: "p1", name: "Preset 1" }),
					createPreset({ id: "p2", name: "Preset 2" }),
				],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const switches = container.querySelectorAll('[data-testid="preset-toggle-checkbox"]');
			expect(switches).toHaveLength(2);
		});

		it("should apply active styling when preset is active", () => {
			const presets = createPresetsWithActiveState(
				[createPreset({ id: "p1", name: "Active Preset" })],
				["p1"]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const item = container.querySelector('[data-testid="preset-toggle-item"]');
			expect(item?.className).toContain("bg-primary/5");
		});
	});

	describe("expanded state", () => {
		it("should show view details text when expanded prop is true", () => {
			const presets = createPresetsWithActiveState([createPreset({ id: "p1", name: "Test" })], []);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				expandedPresetId: null,
				expanded: true,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.textContent).toContain("View Details");
		});

		it("should not show view details when expanded prop is false", () => {
			const presets = createPresetsWithActiveState([createPreset({ id: "p1", name: "Test" })], []);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				expanded: false,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.textContent).not.toContain("View Details");
		});

		it("should render parameters when preset is expanded", () => {
			const presets = createPresetsWithActiveState(
				[createPresetWithParams(2, { id: "p1", name: "Test" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				expandedPresetId: "p1",
				expanded: true,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			const params = container.querySelectorAll('[data-testid="preset-expanded-param"]');
			expect(params).toHaveLength(2);
		});

		it("should not render parameters when preset is not expanded", () => {
			const presets = createPresetsWithActiveState(
				[createPresetWithParams(2, { id: "p1", name: "Test" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				expandedPresetId: null, // Not expanded
				expanded: true,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			expect(container.querySelector('[data-testid="preset-expanded-params"]')).toBeNull();
		});
	});

	describe("interactions", () => {
		it("should call onToggle when switch is clicked", () => {
			const onToggle = vi.fn().mockResolvedValue(undefined);
			const presets = createPresetsWithActiveState([createPreset({ id: "p1", name: "Test" })], []);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				onToggle,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			const switchButton = container.querySelector('[data-testid="preset-toggle-checkbox"]');
			(switchButton as HTMLElement)?.click();

			expect(onToggle).toHaveBeenCalledWith("p1");
		});

		it("should call onToggleExpanded when expand button is clicked", () => {
			const onToggleExpanded = vi.fn();
			const presets = createPresetsWithActiveState([createPreset({ id: "p1", name: "Test" })], []);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				onToggleExpanded,
				expanded: true,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			const expandButton = container.querySelector('[data-testid="preset-expand-button"]');
			(expandButton as HTMLElement)?.click();

			expect(onToggleExpanded).toHaveBeenCalledWith("p1");
		});

		it("should call onManagePresets when manage button is clicked", () => {
			const onManagePresets = vi.fn();
			const logic = createMockPresetToggleListLogic({ loading: false, onManagePresets });
			const { container } = renderComponent(PresetToggleListUI, logic);

			const manageButton = container.querySelector('[data-testid="manage-presets-button"]');
			(manageButton as HTMLElement)?.click();

			expect(onManagePresets).toHaveBeenCalled();
		});

		it("should disable switch when toggling preset", () => {
			const presets = createPresetsWithActiveState([createPreset({ id: "p1", name: "Test" })], []);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				togglingPreset: "p1",
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			const switchInput = container.querySelector(
				'[data-testid="preset-toggle-checkbox"]'
			) as HTMLInputElement;
			expect(switchInput?.disabled).toBe(true);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations in loading state", async () => {
			const logic = createMockPresetToggleListLogic({ loading: true });
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in empty state", async () => {
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets: [],
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with presets", async () => {
			const presets = createPresetsWithActiveState(
				[
					createPreset({ id: "p1", name: "Preset 1", description: "First preset" }),
					createPreset({ id: "p2", name: "Preset 2" }),
				],
				["p1"]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
			});
			const { container } = renderComponent(PresetToggleListUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with expanded preset", async () => {
			const presets = createPresetsWithActiveState(
				[createPresetWithParams(2, { id: "p1", name: "Expanded Preset" })],
				[]
			);
			const logic = createMockPresetToggleListLogic({
				loading: false,
				presets,
				expandedPresetId: "p1",
				expanded: true,
			});
			const { container } = renderComponent(PresetToggleListUI, logic);

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});
	});
});
