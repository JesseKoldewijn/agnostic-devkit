/**
 * Repository module - Import presets from external Git repositories and URLs
 */

// Types and schemas
export {
	// Zod schemas
	ParameterSchema,
	ParameterTypeSchema,
	PresetSchema,
	PresetsArraySchema,
	PrimitiveTypeSchema,
	// Schema info for UI
	PRESET_SCHEMA_DESCRIPTION,
	PRESET_SCHEMA_EXAMPLE,
	// Types
	type FetchResult,
	type GitHubFileContent,
	type GitHubGistResponse,
	type ParsedGitHubUrl,
	type ProviderInstance,
	type ProviderType,
	type RepositoryProvider,
	type RepositorySource,
	type RepositorySourceType,
	type RepositoryStorageSchema,
	type ValidatedFile,
	// Helper functions
	createProviderInstance,
	createRepositorySource,
	generateRepositoryId,
	validatePresets,
} from "./types";

// Storage operations
export {
	addProviderInstance,
	addRepositorySource,
	clearRepositoryStorage,
	getProviderInstanceById,
	getProviderInstances,
	getRepositorySourceById,
	getRepositorySources,
	getSourcesWithProviders,
	onProviderInstancesChanged,
	onRepositorySourcesChanged,
	removeProviderInstance,
	removeRepositorySource,
	updateProviderInstance,
	updateRepositorySource,
} from "./storage";

// Providers
export { GitHubProvider, parseGitHubUrl } from "./providers/github";
export { UrlProvider } from "./providers/url";

// Cache utilities
export {
	ApiError,
	apiCache,
	cachedFetch,
	generateCacheKey,
	getErrorMessage,
	isRateLimitError,
} from "./providers/cache";
