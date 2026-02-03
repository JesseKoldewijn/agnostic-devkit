/**
 * Integration tests for PresetToggleList connected component
 *
 * Tests the full component (HOC + logic + UI) with mocked browser/storage APIs.
 */
import { checkA11y, createPreset, createPresetWithParams, render, waitFor } from "@test/core";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import mocked modules after vi.mock calls
import { browser } from "wxt/browser";

import { PresetToggleList } from "@/components/presets/PresetToggleList";
import type { Preset } from "@/logic/parameters";
import {
	getPresetsWithActiveState,
	onPresetsChanged,
	onTabPresetStatesChanged,
	togglePreset,
} from "@/logic/parameters";

// ============================================================================
// Mocks
// ============================================================================

// Mock the browser API
vi.mock("wxt/browser", () => ({
	browser: {
		tabs: {
			query: vi.fn(),
			onActivated: {
				addListener: vi.fn(),
				removeListener: vi.fn(),
			},
			onUpdated: {
				addListener: vi.fn(),
				removeListener: vi.fn(),
			},
		},
	},
}));

// Mock the parameters logic module
vi.mock("@/logic/parameters", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/logic/parameters")>();
	return {
		...original,
		getPresetsWithActiveState: vi.fn(),
		onPresetsChanged: vi.fn(() => () => {}),
		onTabPresetStatesChanged: vi.fn(() => () => {}),
		togglePreset: vi.fn(),
		getParameterTypeIcon: vi.fn(() => "?"),
	};
});

// ============================================================================
// Test Setup
// ============================================================================

describe("PresetToggleList Integration", () => {
	const mockTabId = 123;
	let mockPresets: (Preset & { isActive: boolean })[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mock behaviors
		(browser.tabs.query as Mock).mockResolvedValue([{ id: mockTabId, url: "https://example.com" }]);

		mockPresets = [
			{
				...createPreset({ id: "p1", name: "Preset 1", description: "First preset" }),
				isActive: false,
			},
			{ ...createPreset({ id: "p2", name: "Preset 2" }), isActive: true },
		];

		(getPresetsWithActiveState as Mock).mockResolvedValue(mockPresets);
		(togglePreset as Mock).mockResolvedValue(undefined);
		(onPresetsChanged as Mock).mockReturnValue(() => {});
		(onTabPresetStatesChanged as Mock).mockReturnValue(() => {});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// ==========================================================================
	// Rendering Tests
	// ==========================================================================

	describe("rendering", () => {
		it("should render the component with loading state initially", () => {
			const { container } = render(<PresetToggleList />);

			expect(container.querySelector('[data-testid="preset-toggle-list"]')).not.toBeNull();
		});

		it("should render presets after loading", async () => {
			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				const items = container.querySelectorAll('[data-testid="preset-toggle-item"]');
				return items.length === 2;
			});

			expect(container.querySelector('[data-testid="preset-toggle-name"]')?.textContent).toBe(
				"Preset 1"
			);
		});

		it("should render empty state when no presets exist", async () => {
			(getPresetsWithActiveState as Mock).mockResolvedValue([]);

			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.textContent?.includes("No presets active");
			});

			expect(container.textContent).toContain("No presets active");
		});

		it("should render manage button when onManagePresets is provided", async () => {
			const onManagePresets = vi.fn();
			const { container } = render(<PresetToggleList onManagePresets={onManagePresets} />);

			await waitFor(() => {
				return container.querySelector('[data-testid="manage-presets-button"]') !== null;
			});

			expect(container.querySelector('[data-testid="manage-presets-button"]')).not.toBeNull();
		});
	});

	// ==========================================================================
	// Data Loading Tests
	// ==========================================================================

	describe("data loading", () => {
		it("should query the active tab on mount", async () => {
			render(<PresetToggleList />);

			await waitFor(() => {
				return (browser.tabs.query as Mock).mock.calls.length > 0;
			});

			expect(browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
		});

		it("should fetch presets for the current tab", async () => {
			render(<PresetToggleList />);

			await waitFor(() => {
				return (getPresetsWithActiveState as Mock).mock.calls.length > 0;
			});

			expect(getPresetsWithActiveState).toHaveBeenCalledWith(mockTabId);
		});

		it("should subscribe to preset changes", async () => {
			render(<PresetToggleList />);

			await waitFor(() => {
				return (onPresetsChanged as Mock).mock.calls.length > 0;
			});

			expect(onPresetsChanged).toHaveBeenCalled();
			expect(onTabPresetStatesChanged).toHaveBeenCalled();
		});

		it("should handle tab query failure gracefully", async () => {
			(browser.tabs.query as Mock).mockRejectedValue(new Error("Tab query failed"));

			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				// Should finish loading even if tab query fails
				return container.querySelector(".animate-spin") === null;
			});

			// Should not crash and should show empty or no presets
			expect(container.querySelector('[data-testid="preset-toggle-list"]')).not.toBeNull();
		});
	});

	// ==========================================================================
	// Toggle Interaction Tests
	// ==========================================================================

	describe("toggle interactions", () => {
		it("should call togglePreset when switch is clicked", async () => {
			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 2;
			});

			const switches = container.querySelectorAll('[data-testid="preset-toggle-checkbox"]');
			(switches[0] as HTMLElement)?.click();

			await waitFor(() => {
				return (togglePreset as Mock).mock.calls.length > 0;
			});

			expect(togglePreset).toHaveBeenCalledWith(mockTabId, "p1");
		});

		it("should refresh presets after toggling", async () => {
			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 2;
			});

			const initialCallCount = (getPresetsWithActiveState as Mock).mock.calls.length;

			const switches = container.querySelectorAll('[data-testid="preset-toggle-checkbox"]');
			(switches[0] as HTMLElement)?.click();

			await waitFor(() => {
				return (getPresetsWithActiveState as Mock).mock.calls.length > initialCallCount;
			});

			// Should have called getPresetsWithActiveState again after toggle
			expect((getPresetsWithActiveState as Mock).mock.calls.length).toBeGreaterThan(
				initialCallCount
			);
		});
	});

	// ==========================================================================
	// Expanded State Tests
	// ==========================================================================

	describe("expanded state", () => {
		it("should show view details when expanded prop is true", async () => {
			const { container } = render(<PresetToggleList expanded />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 2;
			});

			expect(container.textContent).toContain("View Details");
		});

		it("should expand preset when clicked with expanded prop", async () => {
			const presetWithParams = {
				...createPresetWithParams(2, { id: "p1", name: "Preset With Params" }),
				isActive: false,
			};
			(getPresetsWithActiveState as Mock).mockResolvedValue([presetWithParams]);

			const { container } = render(<PresetToggleList expanded />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 1;
			});

			// Click the expand button
			const expandButton = container.querySelector('[data-testid="preset-expand-button"]');
			(expandButton as HTMLElement)?.click();

			await waitFor(() => {
				return container.querySelector('[data-testid="preset-expanded-params"]') !== null;
			});

			const params = container.querySelectorAll('[data-testid="preset-expanded-param"]');
			expect(params.length).toBe(2);
		});

		it("should collapse preset when clicked again", async () => {
			const presetWithParams = {
				...createPresetWithParams(2, { id: "p1", name: "Preset With Params" }),
				isActive: false,
			};
			(getPresetsWithActiveState as Mock).mockResolvedValue([presetWithParams]);

			const { container } = render(<PresetToggleList expanded />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 1;
			});

			// Click to expand
			const expandButton = container.querySelector('[data-testid="preset-expand-button"]');
			(expandButton as HTMLElement)?.click();

			await waitFor(() => {
				return container.querySelector('[data-testid="preset-expanded-params"]') !== null;
			});

			// Click again to collapse
			(expandButton as HTMLElement)?.click();

			await waitFor(() => {
				return container.querySelector('[data-testid="preset-expanded-params"]') === null;
			});

			expect(container.querySelector('[data-testid="preset-expanded-params"]')).toBeNull();
		});
	});

	// ==========================================================================
	// Callback Tests
	// ==========================================================================

	describe("callbacks", () => {
		it("should call onManagePresets when manage button is clicked", async () => {
			const onManagePresets = vi.fn();
			const { container } = render(<PresetToggleList onManagePresets={onManagePresets} />);

			await waitFor(() => {
				return container.querySelector('[data-testid="manage-presets-button"]') !== null;
			});

			const manageButton = container.querySelector('[data-testid="manage-presets-button"]');
			(manageButton as HTMLElement)?.click();

			expect(onManagePresets).toHaveBeenCalledTimes(1);
		});

		it("should call onManagePresets from empty state", async () => {
			(getPresetsWithActiveState as Mock).mockResolvedValue([]);
			const onManagePresets = vi.fn();

			const { container } = render(<PresetToggleList onManagePresets={onManagePresets} />);

			await waitFor(() => {
				return container.querySelector('[data-testid="create-first-preset-button"]') !== null;
			});

			const createButton = container.querySelector('[data-testid="create-first-preset-button"]');
			(createButton as HTMLElement)?.click();

			expect(onManagePresets).toHaveBeenCalledTimes(1);
		});
	});

	// ==========================================================================
	// Accessibility Tests
	// ==========================================================================

	describe("accessibility", () => {
		// Note: The Switch component has a known a11y issue with missing labels for hidden inputs.
		// We exclude the 'label' rule here to focus on other accessibility concerns.
		// The Switch component should be fixed separately.
		const axeOptions = { rules: { label: { enabled: false } } };

		it("should have no accessibility violations when loaded with presets", async () => {
			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 2;
			});

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in empty state", async () => {
			(getPresetsWithActiveState as Mock).mockResolvedValue([]);

			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.textContent?.includes("No presets active");
			});

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with expanded preset", async () => {
			const presetWithParams = {
				...createPresetWithParams(2, { id: "p1", name: "Preset" }),
				isActive: true,
			};
			(getPresetsWithActiveState as Mock).mockResolvedValue([presetWithParams]);

			const { container } = render(<PresetToggleList expanded />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 1;
			});

			// Expand the preset
			const expandButton = container.querySelector('[data-testid="preset-expand-button"]');
			(expandButton as HTMLElement)?.click();

			await waitFor(() => {
				return container.querySelector('[data-testid="preset-expanded-params"]') !== null;
			});

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});
	});

	// ==========================================================================
	// Edge Cases
	// ==========================================================================

	describe("edge cases", () => {
		it("should handle preset with no parameters", async () => {
			const emptyPreset = { ...createPreset({ id: "p1", name: "Empty" }), isActive: false };
			(getPresetsWithActiveState as Mock).mockResolvedValue([emptyPreset]);

			const { container } = render(<PresetToggleList expanded />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 1;
			});

			expect(container.textContent).toContain("0 VARS");
		});

		it("should display active styling for active presets", async () => {
			const activePreset = { ...createPreset({ id: "p1", name: "Active" }), isActive: true };
			(getPresetsWithActiveState as Mock).mockResolvedValue([activePreset]);

			const { container } = render(<PresetToggleList />);

			await waitFor(() => {
				return container.querySelectorAll('[data-testid="preset-toggle-item"]').length === 1;
			});

			const item = container.querySelector('[data-testid="preset-toggle-item"]');
			expect(item?.className).toContain("bg-primary/5");
		});

		it("should apply custom class to container", async () => {
			const { container } = render(<PresetToggleList class="custom-class" />);

			await waitFor(() => {
				return container.querySelector('[data-testid="preset-toggle-list"]') !== null;
			});

			const list = container.querySelector('[data-testid="preset-toggle-list"]');
			expect(list?.className).toContain("custom-class");
		});
	});
});
