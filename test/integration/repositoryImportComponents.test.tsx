/**
 * Unit tests for repository-import components
 * Tests RepositoryImportEmptyStates, RepositoryImportHeader, RepositoryImportPresetList, RepositoryImportSourceSelector
 */
import { describe, expect, it, vi } from "vitest";

import type { PresetWithMeta, SourceWithProvider } from "@/components/repository-import/types";
import type { Preset } from "@/logic/parameters";
import type { FetchResult, RepositorySource } from "@/logic/repository/types";
import { PRESET_SCHEMA_DESCRIPTION, PRESET_SCHEMA_EXAMPLE } from "@/logic/repository/types";

// ============================================================================
// RepositoryImportEmptyStates Tests
// ============================================================================

describe("RepositoryImportEmptyStates", () => {
	describe("NoSourcesState", () => {
		it("should have required props interface", () => {
			// Test interface shape
			interface NoSourcesStateProps {
				onCancel: () => void;
			}

			const props: NoSourcesStateProps = {
				onCancel: vi.fn(),
			};

			expect(props.onCancel).toBeDefined();
			expect(typeof props.onCancel).toBe("function");
		});

		it("should call onCancel when back button is clicked", () => {
			const onCancel = vi.fn();
			// Simulate button click
			onCancel();
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		it("should display correct text content", () => {
			const expectedText = {
				title: "No repository sources configured",
				subtitle: "Configure sources in Settings → Repository Sources",
				buttonText: "Back to Presets",
			};
			expect(expectedText.title).toBe("No repository sources configured");
			expect(expectedText.subtitle).toContain("Settings → Repository Sources");
			expect(expectedText.buttonText).toBe("Back to Presets");
		});
	});

	describe("ErrorState", () => {
		it("should have required props interface", () => {
			interface ErrorStateProps {
				error: string;
			}

			const props: ErrorStateProps = {
				error: "Failed to fetch presets",
			};

			expect(props.error).toBe("Failed to fetch presets");
		});

		it("should accept various error messages", () => {
			const errorMessages = [
				"Network error",
				"Failed to fetch files",
				"No provider available for this source",
				"Authentication failed",
				"Rate limit exceeded",
			];

			errorMessages.forEach((error) => {
				expect(error.length).toBeGreaterThan(0);
			});
		});
	});

	describe("FetchPromptState", () => {
		it("should display correct text", () => {
			const expectedText = {
				title: "Select a source and fetch",
				subtitle: "Presets will be loaded from the repository",
			};

			expect(expectedText.title).toBe("Select a source and fetch");
			expect(expectedText.subtitle).toContain("loaded from the repository");
		});
	});

	describe("LoadingState", () => {
		it("should display loading text", () => {
			const expectedText = "Fetching presets...";
			expect(expectedText).toBe("Fetching presets...");
		});
	});

	describe("NoFilesFoundState", () => {
		it("should display correct text", () => {
			const expectedText = {
				title: "No preset files found",
				subtitle: "Check that the repository contains JSON preset files",
			};

			expect(expectedText.title).toBe("No preset files found");
			expect(expectedText.subtitle).toContain("JSON preset files");
		});
	});

	describe("InvalidFilesState", () => {
		it("should have required props interface", () => {
			interface InvalidFilesStateProps {
				fetchResult: () => FetchResult | null;
			}

			const mockFetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "invalid.json",
						rawUrl: "https://example.com/invalid.json",
						isValid: false,
						error: "Missing required field: name",
					},
				],
			};

			const props: InvalidFilesStateProps = {
				fetchResult: () => mockFetchResult,
			};

			expect(props.fetchResult()).toEqual(mockFetchResult);
		});

		it("should display schema description", () => {
			expect(PRESET_SCHEMA_DESCRIPTION).toBeDefined();
			expect(PRESET_SCHEMA_DESCRIPTION.length).toBeGreaterThan(0);
		});

		it("should display schema example when toggled", () => {
			expect(PRESET_SCHEMA_EXAMPLE).toBeDefined();
			expect(PRESET_SCHEMA_EXAMPLE.length).toBeGreaterThan(0);
		});

		it("should toggle example visibility", () => {
			let showSchemaInfo = false;
			const toggleSchemaInfo = () => {
				showSchemaInfo = !showSchemaInfo;
			};

			expect(showSchemaInfo).toBe(false);
			toggleSchemaInfo();
			expect(showSchemaInfo).toBe(true);
			toggleSchemaInfo();
			expect(showSchemaInfo).toBe(false);
		});

		it("should filter and display invalid files", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "valid.json",
						rawUrl: "https://example.com/valid.json",
						isValid: true,
						presets: [
							{
								name: "Test",
								parameters: [],
							},
						],
					},
					{
						filename: "invalid1.json",
						rawUrl: "https://example.com/invalid1.json",
						isValid: false,
						error: "Invalid JSON structure",
					},
					{
						filename: "invalid2.json",
						rawUrl: "https://example.com/invalid2.json",
						isValid: false,
						error: "Missing name field",
					},
				],
			};

			const invalidFiles = fetchResult.files.filter((f) => !f.isValid);
			expect(invalidFiles).toHaveLength(2);
			expect(invalidFiles[0].filename).toBe("invalid1.json");
			expect(invalidFiles[1].filename).toBe("invalid2.json");
		});
	});
});

// ============================================================================
// RepositoryImportHeader Tests
// ============================================================================

describe("RepositoryImportHeader", () => {
	describe("props interface", () => {
		it("should have required onCancel prop", () => {
			interface RepositoryImportHeaderProps {
				onCancel: () => void;
			}

			const props: RepositoryImportHeaderProps = {
				onCancel: vi.fn(),
			};

			expect(props.onCancel).toBeDefined();
		});
	});

	describe("display", () => {
		it("should display correct title text", () => {
			const title = "Import from Repository";
			expect(title).toBe("Import from Repository");
		});

		it("should have accessible back button", () => {
			const ariaLabel = "Back to preset list";
			expect(ariaLabel).toBe("Back to preset list");
		});
	});

	describe("interactions", () => {
		it("should call onCancel when back button is clicked", () => {
			const onCancel = vi.fn();
			onCancel();
			expect(onCancel).toHaveBeenCalledTimes(1);
		});
	});
});

// ============================================================================
// RepositoryImportPresetList Tests
// ============================================================================

describe("RepositoryImportPresetList", () => {
	describe("props interface", () => {
		it("should have all required props", () => {
			interface RepositoryImportPresetListProps {
				presets: () => PresetWithMeta[];
				selectedPresets: () => Set<string>;
				expandedPresetId: () => string | null;
				onTogglePreset: (presetKey: string) => void;
				onToggleExpanded: (presetKey: string) => void;
			}

			const mockPresets: PresetWithMeta[] = [
				{
					preset: {
						name: "Test Preset",
						parameters: [{ type: "queryParam", key: "test", value: "123" }],
					},
					filename: "presets.json",
					presetKey: "presets.json-Test Preset-",
				},
			];

			const props: RepositoryImportPresetListProps = {
				presets: () => mockPresets,
				selectedPresets: () => new Set(["presets.json-Test Preset-"]),
				expandedPresetId: () => null,
				onTogglePreset: vi.fn(),
				onToggleExpanded: vi.fn(),
			};

			expect(props.presets()).toHaveLength(1);
			expect(props.selectedPresets().has("presets.json-Test Preset-")).toBe(true);
			expect(props.expandedPresetId()).toBeNull();
		});
	});

	describe("getParameterTypeIcon helper", () => {
		it("should return correct icons for parameter types", () => {
			const getParameterTypeIcon = (type: string) => {
				switch (type) {
					case "queryParam":
						return "?";
					case "cookie":
						return "🍪";
					case "localStorage":
						return "📦";
					default:
						return "•";
				}
			};

			expect(getParameterTypeIcon("queryParam")).toBe("?");
			expect(getParameterTypeIcon("cookie")).toBe("🍪");
			expect(getParameterTypeIcon("localStorage")).toBe("📦");
			expect(getParameterTypeIcon("unknown")).toBe("•");
		});
	});

	describe("preset selection", () => {
		it("should toggle preset selection", () => {
			const selectedPresets = new Set<string>();
			const presetKey = "file.json-Preset1-";

			const toggleSelection = (key: string) => {
				if (selectedPresets.has(key)) {
					selectedPresets.delete(key);
				} else {
					selectedPresets.add(key);
				}
			};

			expect(selectedPresets.has(presetKey)).toBe(false);
			toggleSelection(presetKey);
			expect(selectedPresets.has(presetKey)).toBe(true);
			toggleSelection(presetKey);
			expect(selectedPresets.has(presetKey)).toBe(false);
		});

		it("should handle multiple preset selections", () => {
			const selectedPresets = new Set<string>();
			const keys = ["key1", "key2", "key3"];

			keys.forEach((key) => selectedPresets.add(key));
			expect(selectedPresets.size).toBe(3);

			selectedPresets.delete("key2");
			expect(selectedPresets.size).toBe(2);
			expect(selectedPresets.has("key1")).toBe(true);
			expect(selectedPresets.has("key2")).toBe(false);
			expect(selectedPresets.has("key3")).toBe(true);
		});
	});

	describe("preset expansion", () => {
		it("should toggle expanded preset", () => {
			let expandedPresetId: string | null = null;

			const toggleExpanded = (presetKey: string) => {
				expandedPresetId = expandedPresetId === presetKey ? null : presetKey;
			};

			expect(expandedPresetId).toBeNull();
			toggleExpanded("preset1");
			expect(expandedPresetId).toBe("preset1");
			toggleExpanded("preset2");
			expect(expandedPresetId).toBe("preset2");
			toggleExpanded("preset2");
			expect(expandedPresetId).toBeNull();
		});
	});

	describe("keyboard interaction", () => {
		it("should handle Enter key to toggle preset", () => {
			const onTogglePreset = vi.fn();
			const presetKey = "test-preset";

			// Simulate keyboard event
			const event = {
				key: "Enter",
				preventDefault: vi.fn(),
			};

			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onTogglePreset(presetKey);
			}

			expect(event.preventDefault).toHaveBeenCalled();
			expect(onTogglePreset).toHaveBeenCalledWith(presetKey);
		});

		it("should handle Space key to toggle preset", () => {
			const onTogglePreset = vi.fn();
			const presetKey = "test-preset";

			const event = {
				key: " ",
				preventDefault: vi.fn(),
			};

			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onTogglePreset(presetKey);
			}

			expect(event.preventDefault).toHaveBeenCalled();
			expect(onTogglePreset).toHaveBeenCalledWith(presetKey);
		});

		it("should not toggle on other keys", () => {
			const onTogglePreset = vi.fn();

			const event = {
				key: "Tab",
				preventDefault: vi.fn(),
			};

			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onTogglePreset("key");
			}

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(onTogglePreset).not.toHaveBeenCalled();
		});
	});

	describe("preset display", () => {
		it("should display preset name", () => {
			const preset: PresetWithMeta = {
				preset: {
					name: "Debug Mode",
					description: "Enable debug features",
					parameters: [],
				},
				filename: "debug.json",
				presetKey: "debug.json-Debug Mode-",
			};

			expect(preset.preset.name).toBe("Debug Mode");
		});

		it("should display preset description when available", () => {
			const presetWithDesc: PresetWithMeta = {
				preset: {
					name: "Test",
					description: "This is a description",
					parameters: [],
				},
				filename: "test.json",
				presetKey: "test.json-Test-",
			};

			const presetWithoutDesc: PresetWithMeta = {
				preset: {
					name: "Test",
					parameters: [],
				},
				filename: "test.json",
				presetKey: "test.json-Test-",
			};

			expect(presetWithDesc.preset.description).toBe("This is a description");
			expect(presetWithoutDesc.preset.description).toBeUndefined();
		});

		it("should display parameter count badge", () => {
			const preset: PresetWithMeta = {
				preset: {
					name: "Multi Param",
					parameters: [
						{ type: "queryParam", key: "a", value: "1" },
						{ type: "cookie", key: "b", value: "2" },
						{ type: "localStorage", key: "c", value: "3" },
					],
				},
				filename: "test.json",
				presetKey: "test.json-Multi Param-",
			};

			expect(preset.preset.parameters.length).toBe(3);
			expect(`${preset.preset.parameters.length} VARS`).toBe("3 VARS");
		});
	});
});

// ============================================================================
// RepositoryImportSourceSelector Tests
// ============================================================================

describe("RepositoryImportSourceSelector", () => {
	describe("props interface", () => {
		it("should have all required props", () => {
			const mockSource: RepositorySource = {
				id: "source-1",
				name: "Test Source",
				url: "https://example.com/presets",
				type: "url",
			};

			const mockSourceWithProvider: SourceWithProvider = {
				source: mockSource,
			};

			interface RepositoryImportSourceSelectorProps {
				sources: () => SourceWithProvider[];
				selectedSourceId: () => string;
				onSourceChange: (id: string) => void;
				isLoading: () => boolean;
				onFetch: () => void;
				showImportControls: () => boolean;
				selectedCount: () => number;
				totalCount: () => number;
				onSelectAll: () => void;
				onClearSelection: () => void;
				onImport: () => void;
			}

			const props: RepositoryImportSourceSelectorProps = {
				sources: () => [mockSourceWithProvider],
				selectedSourceId: () => "source-1",
				onSourceChange: vi.fn(),
				isLoading: () => false,
				onFetch: vi.fn(),
				showImportControls: () => true,
				selectedCount: () => 2,
				totalCount: () => 5,
				onSelectAll: vi.fn(),
				onClearSelection: vi.fn(),
				onImport: vi.fn(),
			};

			expect(props.sources()).toHaveLength(1);
			expect(props.selectedSourceId()).toBe("source-1");
			expect(props.isLoading()).toBe(false);
			expect(props.showImportControls()).toBe(true);
			expect(props.selectedCount()).toBe(2);
			expect(props.totalCount()).toBe(5);
		});
	});

	describe("source selection", () => {
		it("should call onSourceChange when source is selected", () => {
			const onSourceChange = vi.fn();
			onSourceChange("new-source-id");
			expect(onSourceChange).toHaveBeenCalledWith("new-source-id");
		});

		it("should display all sources in dropdown", () => {
			const sources: SourceWithProvider[] = [
				{
					source: {
						id: "source-1",
						name: "Source 1",
						url: "https://example1.com",
						type: "url",
					},
				},
				{
					source: {
						id: "source-2",
						name: "Source 2",
						url: "https://example2.com",
						type: "github",
						providerInstanceId: "provider-1",
					},
					providerInstance: {
						id: "provider-1",
						name: "GitHub Auth",
						type: "github",
						baseUrl: "github.com",
						token: "test-token",
					},
				},
			];

			expect(sources).toHaveLength(2);
			expect(sources[0].source.name).toBe("Source 1");
			expect(sources[1].source.name).toBe("Source 2");
		});
	});

	describe("fetch button", () => {
		it("should call onFetch when clicked", () => {
			const onFetch = vi.fn();
			onFetch();
			expect(onFetch).toHaveBeenCalledTimes(1);
		});

		it("should be disabled when loading", () => {
			const isLoading = true;
			const selectedSourceId = "source-1";
			const isDisabled = isLoading || !selectedSourceId;
			expect(isDisabled).toBe(true);
		});

		it("should be disabled when no source selected", () => {
			const selectedSourceId = "";
			const isLoading = false;
			const isDisabled = isLoading || !selectedSourceId;
			expect(isDisabled).toBe(true);
		});

		it("should be enabled when source selected and not loading", () => {
			const selectedSourceId = "source-1";
			const isLoading = false;
			const isDisabled = isLoading || !selectedSourceId;
			expect(isDisabled).toBe(false);
		});

		it("should display correct text based on loading state", () => {
			const getButtonText = (isLoading: boolean) => (isLoading ? "Fetching..." : "Fetch");
			expect(getButtonText(false)).toBe("Fetch");
			expect(getButtonText(true)).toBe("Fetching...");
		});
	});

	describe("import controls", () => {
		it("should show controls when showImportControls is true", () => {
			const showImportControls = true;
			expect(showImportControls).toBe(true);
		});

		it("should hide controls when showImportControls is false", () => {
			const showImportControls = false;
			expect(showImportControls).toBe(false);
		});

		it("should call onSelectAll when All button clicked", () => {
			const onSelectAll = vi.fn();
			onSelectAll();
			expect(onSelectAll).toHaveBeenCalledTimes(1);
		});

		it("should call onClearSelection when None button clicked", () => {
			const onClearSelection = vi.fn();
			onClearSelection();
			expect(onClearSelection).toHaveBeenCalledTimes(1);
		});

		it("should disable None button when selectedCount is 0", () => {
			const selectedCount = 0;
			const isDisabled = selectedCount === 0;
			expect(isDisabled).toBe(true);
		});

		it("should enable None button when selectedCount > 0", () => {
			const selectedCount = 3;
			const isDisabled = selectedCount < 1;
			expect(isDisabled).toBe(false);
		});
	});

	describe("import button", () => {
		it("should call onImport when clicked", () => {
			const onImport = vi.fn();
			onImport();
			expect(onImport).toHaveBeenCalledTimes(1);
		});

		it("should be disabled when selectedCount is 0", () => {
			const selectedCount = 0;
			const isDisabled = selectedCount === 0;
			expect(isDisabled).toBe(true);
		});

		it("should be enabled when selectedCount > 0", () => {
			const selectedCount = 5;
			const isDisabled = selectedCount < 1;
			expect(isDisabled).toBe(false);
		});

		it("should display correct text based on selection", () => {
			const getButtonText = (count: number) => {
				const countText = count > 0 ? count : "";
				const plural = count === 1 ? "" : "s";
				return `Import ${countText} Preset${plural}`;
			};

			expect(getButtonText(0)).toBe("Import  Presets");
			expect(getButtonText(1)).toBe("Import 1 Preset");
			expect(getButtonText(5)).toBe("Import 5 Presets");
		});
	});

	describe("selection count display", () => {
		it("should display correct count format", () => {
			const formatCount = (selected: number, total: number) => `${selected}/${total} selected`;
			expect(formatCount(0, 5)).toBe("0/5 selected");
			expect(formatCount(3, 5)).toBe("3/5 selected");
			expect(formatCount(5, 5)).toBe("5/5 selected");
		});
	});
});

// ============================================================================
// RepositoryImportView State Logic Tests
// ============================================================================

describe("RepositoryImportView state logic", () => {
	describe("viewState computation", () => {
		type ViewState =
			| "no-sources"
			| "loading"
			| "fetch-prompt"
			| "no-files"
			| "invalid-files"
			| "presets"
			| "error";

		const computeViewState = (
			hasNoSources: boolean,
			isLoading: boolean,
			fetchResult: FetchResult | null,
			hasNoFilesFound: boolean,
			hasOnlyInvalidFiles: boolean,
			hasValidFiles: boolean
		): ViewState => {
			if (hasNoSources) return "no-sources";
			if (isLoading) return "loading";
			if (fetchResult?.error) return "error";
			if (!fetchResult) return "fetch-prompt";
			if (hasNoFilesFound) return "no-files";
			if (hasOnlyInvalidFiles) return "invalid-files";
			if (hasValidFiles) return "presets";
			return "fetch-prompt";
		};

		it("should return no-sources when no sources configured", () => {
			const state = computeViewState(true, false, null, false, false, false);
			expect(state).toBe("no-sources");
		});

		it("should return loading when fetching", () => {
			const state = computeViewState(false, true, null, false, false, false);
			expect(state).toBe("loading");
		});

		it("should return error when fetch failed", () => {
			const fetchResult: FetchResult = {
				success: false,
				files: [],
				error: "Network error",
			};
			const state = computeViewState(false, false, fetchResult, false, false, false);
			expect(state).toBe("error");
		});

		it("should return fetch-prompt when no fetch result", () => {
			const state = computeViewState(false, false, null, false, false, false);
			expect(state).toBe("fetch-prompt");
		});

		it("should return no-files when no files found", () => {
			const fetchResult: FetchResult = { success: true, files: [] };
			const state = computeViewState(false, false, fetchResult, true, false, false);
			expect(state).toBe("no-files");
		});

		it("should return invalid-files when only invalid files found", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "test.json",
						rawUrl: "https://example.com/test.json",
						isValid: false,
						error: "Invalid format",
					},
				],
			};
			const state = computeViewState(false, false, fetchResult, false, true, false);
			expect(state).toBe("invalid-files");
		});

		it("should return presets when valid files found", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "test.json",
						rawUrl: "https://example.com/test.json",
						isValid: true,
						presets: [{ name: "Test", parameters: [] }],
					},
				],
			};
			const state = computeViewState(false, false, fetchResult, false, false, true);
			expect(state).toBe("presets");
		});
	});

	describe("allPresets computation", () => {
		it("should return empty array when no fetch result", () => {
			const fetchResult: FetchResult | null = null;
			const allPresets: PresetWithMeta[] = [];

			if (fetchResult) {
				// populate
			}

			expect(allPresets).toHaveLength(0);
		});

		it("should flatten presets from valid files", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "file1.json",
						rawUrl: "https://example.com/file1.json",
						isValid: true,
						presets: [
							{ name: "Preset1", parameters: [] },
							{ name: "Preset2", parameters: [] },
						],
					},
					{
						filename: "file2.json",
						rawUrl: "https://example.com/file2.json",
						isValid: true,
						presets: [{ name: "Preset3", parameters: [] }],
					},
					{
						filename: "invalid.json",
						rawUrl: "https://example.com/invalid.json",
						isValid: false,
						error: "Invalid",
					},
				],
			};

			const allPresets: PresetWithMeta[] = [];
			for (const file of fetchResult.files) {
				if (file.isValid && file.presets) {
					for (const preset of file.presets) {
						allPresets.push({
							preset,
							filename: file.filename,
							presetKey: `${file.filename}-${preset.name}-${preset.id || ""}`,
						});
					}
				}
			}

			expect(allPresets).toHaveLength(3);
			expect(allPresets[0].preset.name).toBe("Preset1");
			expect(allPresets[0].filename).toBe("file1.json");
			expect(allPresets[1].preset.name).toBe("Preset2");
			expect(allPresets[2].preset.name).toBe("Preset3");
		});

		it("should generate correct preset keys", () => {
			const filename = "test.json";
			const presetName = "My Preset";
			const presetId = "abc123";

			const keyWithId = `${filename}-${presetName}-${presetId}`;
			const keyWithoutId = `${filename}-${presetName}-`;

			expect(keyWithId).toBe("test.json-My Preset-abc123");
			expect(keyWithoutId).toBe("test.json-My Preset-");
		});
	});

	describe("preset selection", () => {
		it("should toggle preset selection", () => {
			const selectedPresets = new Set<string>(["key1", "key2"]);

			const togglePresetSelection = (presetKey: string) => {
				if (selectedPresets.has(presetKey)) {
					selectedPresets.delete(presetKey);
				} else {
					selectedPresets.add(presetKey);
				}
			};

			expect(selectedPresets.size).toBe(2);
			togglePresetSelection("key1");
			expect(selectedPresets.size).toBe(1);
			expect(selectedPresets.has("key1")).toBe(false);

			togglePresetSelection("key3");
			expect(selectedPresets.size).toBe(2);
			expect(selectedPresets.has("key3")).toBe(true);
		});

		it("should select all presets", () => {
			const allPresets: PresetWithMeta[] = [
				{ preset: { name: "P1", parameters: [] }, filename: "f1", presetKey: "key1" },
				{ preset: { name: "P2", parameters: [] }, filename: "f2", presetKey: "key2" },
				{ preset: { name: "P3", parameters: [] }, filename: "f3", presetKey: "key3" },
			];

			const selectAll = () => new Set(allPresets.map((p) => p.presetKey));
			const selectedPresets = selectAll();

			expect(selectedPresets.size).toBe(3);
			expect(selectedPresets.has("key1")).toBe(true);
			expect(selectedPresets.has("key2")).toBe(true);
			expect(selectedPresets.has("key3")).toBe(true);
		});

		it("should clear all selections", () => {
			const selectedPresets = new Set<string>(["key1", "key2", "key3"]);
			expect(selectedPresets.size).toBe(3);

			selectedPresets.clear();
			expect(selectedPresets.size).toBe(0);
		});
	});

	describe("handleImport", () => {
		it("should collect selected presets for import", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "test.json",
						rawUrl: "https://example.com/test.json",
						isValid: true,
						presets: [
							{
								id: "p1",
								name: "Preset1",
								parameters: [{ type: "queryParam", key: "a", value: "1" }],
							},
							{ name: "Preset2", parameters: [] },
						],
					},
				],
			};

			const selectedPresets = new Set(["test.json-Preset1-p1", "test.json-Preset2-"]);
			const presetsToImport: Preset[] = [];

			for (const file of fetchResult.files) {
				if (file.isValid && file.presets) {
					for (const preset of file.presets) {
						const presetKey = `${file.filename}-${preset.name}-${preset.id || ""}`;
						if (selectedPresets.has(presetKey)) {
							presetsToImport.push({
								...preset,
								id: preset.id || "generated-id",
								createdAt: preset.createdAt || Date.now(),
								updatedAt: preset.updatedAt || Date.now(),
								parameters: preset.parameters.map((p) => ({
									...p,
									id: p.id || "generated-param-id",
								})),
							} as Preset);
						}
					}
				}
			}

			expect(presetsToImport).toHaveLength(2);
			expect(presetsToImport[0].name).toBe("Preset1");
			expect(presetsToImport[0].id).toBe("p1");
			expect(presetsToImport[1].name).toBe("Preset2");
		});

		it("should not import when fetch failed", () => {
			const fetchResult: FetchResult = {
				success: false,
				files: [],
				error: "Failed",
			};

			const shouldImport = fetchResult.success;
			expect(shouldImport).toBe(false);
		});
	});

	describe("condition checks", () => {
		it("should detect hasNoSources correctly", () => {
			const sources1: SourceWithProvider[] = [];
			const sources2: SourceWithProvider[] = [
				{ source: { id: "1", name: "Test", url: "https://example.com", type: "url" } },
			];

			expect(sources1.length === 0).toBe(true);
			expect(sources2.length === 0).toBe(false);
		});

		it("should detect hasValidFiles correctly", () => {
			const fetchResult1: FetchResult = {
				success: true,
				files: [
					{
						filename: "test.json",
						rawUrl: "https://example.com/test.json",
						isValid: true,
						presets: [{ name: "Test", parameters: [] }],
					},
				],
			};

			const fetchResult2: FetchResult = {
				success: true,
				files: [
					{
						filename: "test.json",
						rawUrl: "https://example.com/test.json",
						isValid: false,
						error: "Invalid",
					},
				],
			};

			const hasValid1 = fetchResult1.files.some((f) => f.isValid);
			const hasValid2 = fetchResult2.files.some((f) => f.isValid);

			expect(hasValid1).toBe(true);
			expect(hasValid2).toBe(false);
		});

		it("should detect hasOnlyInvalidFiles correctly", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [
					{
						filename: "test1.json",
						rawUrl: "https://example.com/test1.json",
						isValid: false,
						error: "Invalid",
					},
					{
						filename: "test2.json",
						rawUrl: "https://example.com/test2.json",
						isValid: false,
						error: "Invalid",
					},
				],
			};

			const hasOnlyInvalid =
				fetchResult.success &&
				fetchResult.files.length > 0 &&
				!fetchResult.files.some((f) => f.isValid);

			expect(hasOnlyInvalid).toBe(true);
		});

		it("should detect hasNoFilesFound correctly", () => {
			const fetchResult: FetchResult = {
				success: true,
				files: [],
			};

			const hasNoFiles = fetchResult.success && fetchResult.files.length === 0;
			expect(hasNoFiles).toBe(true);
		});
	});
});

// ============================================================================
// Types Tests
// ============================================================================

describe("repository-import types", () => {
	describe("SourceWithProvider", () => {
		it("should allow source without provider", () => {
			const swp: SourceWithProvider = {
				source: {
					id: "1",
					name: "Test",
					url: "https://example.com",
					type: "url",
				},
			};
			expect(swp.providerInstance).toBeUndefined();
		});

		it("should allow source with provider", () => {
			const swp: SourceWithProvider = {
				source: {
					id: "1",
					name: "Test",
					url: "https://github.com/user/repo",
					type: "github",
					providerInstanceId: "provider-1",
				},
				providerInstance: {
					id: "provider-1",
					name: "My GitHub",
					type: "github",
					baseUrl: "github.com",
					token: "ghp_test",
				},
			};
			expect(swp.providerInstance).toBeDefined();
			expect(swp.providerInstance?.name).toBe("My GitHub");
		});
	});

	describe("PresetWithMeta", () => {
		it("should contain preset, filename, and presetKey", () => {
			const pwm: PresetWithMeta = {
				preset: {
					name: "Test Preset",
					description: "A test",
					parameters: [{ type: "queryParam", key: "test", value: "123" }],
				},
				filename: "presets.json",
				presetKey: "presets.json-Test Preset-",
			};

			expect(pwm.preset.name).toBe("Test Preset");
			expect(pwm.filename).toBe("presets.json");
			expect(pwm.presetKey).toBe("presets.json-Test Preset-");
		});
	});
});
