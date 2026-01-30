/**
 * Test core module - exports all shared test utilities
 */

// Mocks
export { fakeBrowser, setupBrowserMocks, setupFetchMock } from "./mocks/fakeBrowser";

// Fixtures
export {
	createParameter,
	createPreset,
	createPresetWithParams,
	invalidPresets,
	samplePresets,
} from "./fixtures/presets";

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
