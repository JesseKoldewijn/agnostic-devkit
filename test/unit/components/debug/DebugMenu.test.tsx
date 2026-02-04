/**
 * Unit tests for DebugMenu component
 */
import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { checkA11y, render } from "@test/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import after vi.mock calls
import { DebugMenu } from "@/components/debug";
import {
	FEATURE_FLAG_CATEGORIES,
	FEATURE_FLAG_META,
	resetFeatureFlagOverrides,
	setFeatureFlagOverride,
} from "@/logic/featureFlags";

// Mock wxt/browser before importing modules that use it
vi.mock("wxt/browser", () => ({
	browser: {
		storage: {
			local: {
				get: vi.fn().mockResolvedValue({}),
				set: vi.fn().mockResolvedValue(undefined),
				remove: vi.fn().mockResolvedValue(undefined),
			},
		},
	},
}));

// Mock the featureFlags module with inline values (vi.mock is hoisted)
vi.mock("@/logic/featureFlags", () => ({
	FEATURE_FLAG_META: {
		debugLogging: {
			name: "Debug Logging",
			description: "Enable verbose debug logging to the console",
			category: "debugging",
			defaults: { development: true, canary: false, production: false },
		},
		experimentalFeatures: {
			name: "Experimental Features",
			description: "Enable experimental features that are still in development",
			category: "experimental",
			defaults: { development: true, canary: true, production: false },
		},
		mockApiResponses: {
			name: "Mock API Responses",
			description: "Use mock data instead of real API calls (for testing)",
			category: "testing",
			defaults: { development: false, canary: false, production: false },
		},
	},
	FEATURE_FLAG_CATEGORIES: {
		debugging: {
			name: "Debugging",
			description: "Tools for debugging and development",
		},
		experimental: {
			name: "Experimental",
			description: "Features still in active development",
		},
		testing: {
			name: "Testing",
			description: "Options for testing and QA",
		},
	},
	getDefaultFlags: vi.fn().mockReturnValue({
		debugLogging: true,
		experimentalFeatures: true,
		mockApiResponses: false,
	}),
	canOverrideFlags: vi.fn().mockReturnValue(true),
	getEffectiveProfile: vi.fn().mockReturnValue("development"),
	getForceProfile: vi.fn().mockReturnValue(null),
	getFeatureFlags: vi.fn().mockResolvedValue({
		debugLogging: true,
		experimentalFeatures: true,
		mockApiResponses: false,
	}),
	setFeatureFlagOverride: vi.fn().mockResolvedValue(undefined),
	resetFeatureFlagOverrides: vi.fn().mockResolvedValue(undefined),
}));

describe("DebugMenu", () => {
	const defaultProps = {
		open: true,
		onClose: vi.fn(),
	};

	beforeEach(() => {
		vi.stubGlobal("__EXTENSION_ENV__", "development");
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("should render the modal when open", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("Feature Flags")).toBeTruthy();
			});
		});

		it("should not render content when closed", () => {
			render(<DebugMenu open={false} onClose={vi.fn()} />);

			// Modal should not show content when closed
			expect(screen.queryByText("Feature Flags")).toBeNull();
		});

		it("should render all feature flags", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				for (const meta of Object.values(FEATURE_FLAG_META)) {
					expect(screen.getByText(meta.name)).toBeTruthy();
				}
			});
		});

		it("should render descriptions for each flag", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				for (const meta of Object.values(FEATURE_FLAG_META)) {
					expect(screen.getByText(meta.description)).toBeTruthy();
				}
			});
		});

		it("should render category sections", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				for (const category of Object.values(FEATURE_FLAG_CATEGORIES)) {
					expect(screen.getByText(category.name)).toBeTruthy();
				}
			});
		});

		it("should render reset button", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("Reset to Defaults")).toBeTruthy();
			});
		});

		it("should show checkboxes for all flags", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				const checkboxes = screen.getAllByRole("checkbox");
				expect(checkboxes.length).toBe(Object.keys(FEATURE_FLAG_META).length);
			});
		});

		it("should render search input", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search flags...")).toBeTruthy();
			});
		});
	});

	describe("search functionality", () => {
		it("should filter flags based on search query", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("Debug Logging")).toBeTruthy();
			});

			// Type in search
			const searchInput = screen.getByPlaceholderText("Search flags...");
			fireEvent.input(searchInput, { target: { value: "debug" } });

			await waitFor(() => {
				// Should show Debug Logging
				expect(screen.getByText("Debug Logging")).toBeTruthy();
				// Should hide other flags (checking by absence)
				expect(screen.queryByText("Mock API Responses")).toBeNull();
			});
		});

		it("should show no results message when search has no matches", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search flags...")).toBeTruthy();
			});

			const searchInput = screen.getByPlaceholderText("Search flags...");
			fireEvent.input(searchInput, { target: { value: "nonexistent" } });

			await waitFor(() => {
				expect(screen.getByText("No flags match your search")).toBeTruthy();
			});
		});
	});

	describe("interactions", () => {
		it("should call setFeatureFlagOverride when checkbox is clicked", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
			});

			const checkboxes = screen.getAllByRole("checkbox");
			const firstCheckbox = checkboxes[0];

			// Click to toggle
			fireEvent.click(firstCheckbox);

			await waitFor(() => {
				expect(setFeatureFlagOverride).toHaveBeenCalled();
			});
		});

		it("should call resetFeatureFlagOverrides when reset button is clicked", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("Reset to Defaults")).toBeTruthy();
			});

			const resetButton = screen.getByText("Reset to Defaults");
			fireEvent.click(resetButton);

			await waitFor(() => {
				expect(resetFeatureFlagOverrides).toHaveBeenCalledWith("development");
			});
		});

		it("should call onClose when close button is clicked", async () => {
			const onClose = vi.fn();
			render(<DebugMenu open={true} onClose={onClose} />);

			await waitFor(() => {
				expect(screen.getByText("Close")).toBeTruthy();
			});

			const closeButton = screen.getByText("Close");
			fireEvent.click(closeButton);

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe("environment awareness", () => {
		it("should show current environment profile", async () => {
			render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("development")).toBeTruthy();
			});
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations when open", async () => {
			const { container } = render(<DebugMenu {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("Feature Flags")).toBeTruthy();
			});

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});
	});
});
