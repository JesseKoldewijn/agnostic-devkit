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

// Render utilities for component testing
export {
	checkA11y,
	render,
	renderComponent,
	renderComponentWithA11y,
	renderWithA11y,
} from "./helpers/renderUtils";
export type { RenderResult } from "./helpers/renderUtils";
