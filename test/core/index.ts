/**
 * Test core module - exports all shared test utilities
 */

// Mocks
export { fakeBrowser, setupBrowserMocks, setupFetchMock } from "./mocks/fakeBrowser";
export {
	createMockPresetToggleListLogic,
	createPresetsWithActiveState,
	type PresetToggleListLogic,
	type PresetToggleListProps,
} from "./mocks/mockPresetToggle";
export {
	createMockRepositoryImportViewLogic,
	type RepositoryImportViewLogic,
	type RepositoryImportViewProps,
	type ViewState,
} from "./mocks/mockRepositoryImport";
export {
	createMockRepositoryConfigurationLogic,
	type RepositoryConfigurationLogic,
} from "./mocks/mockRepositoryConfig";
export {
	createMockPresetManagerLogic,
	type PresetManagerLogic,
	type PresetManagerProps,
} from "./mocks/mockPresetManager";
export {
	createMockExportLogic,
	createMockShareImportLogic,
	type ExportLogic,
	type ExportProps,
	type ShareImportLogic,
	type ShareImportProps,
} from "./mocks/mockSubcomponents";

// Fixtures - Presets
export {
	createParameter,
	createPreset,
	createPresetWithParams,
	invalidPresets,
	samplePresets,
} from "./fixtures/presets";

// Fixtures - Repository Sources
export {
	createFetchResult,
	createProviderInstance,
	createRepositorySource,
	createSourceWithProvider,
	createValidatedFile,
	sampleFetchResults,
	sampleProviderInstances,
	sampleRepositorySources,
	sampleSourcesWithProviders,
	sampleValidatedFiles,
} from "./fixtures/repositorySources";

// Helpers
export {
	createDeferred,
	createTestUrl,
	deepClone,
	expectAsyncError,
	sleep,
	uniqueId,
	waitFor,
} from "./helpers/testUtils";

// Render utilities for component testing
export {
	checkA11y,
	render,
	renderComponent,
	renderComponentWithA11y,
	renderWithA11y,
} from "./helpers/renderUtils";
export type { RenderResult } from "./helpers/renderUtils";
