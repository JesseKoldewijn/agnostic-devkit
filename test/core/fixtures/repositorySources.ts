/**
 * Shared test fixtures for repository sources and provider instances
 */
import type { SourceWithProvider } from "@/components/repository/import/types";
import type {
	FetchResult,
	ProviderInstance,
	ProviderType,
	RepositorySource,
	RepositorySourceType,
	ValidatedFile,
} from "@/logic/repository/types";

/**
 * Create a valid provider instance for testing
 */
export function createProviderInstance(
	overrides: Partial<ProviderInstance> = {}
): ProviderInstance {
	return {
		id: `provider-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		name: "Test GitHub Instance",
		type: "github" as ProviderType,
		baseUrl: "github.com",
		...overrides,
	};
}

/**
 * Create a valid repository source for testing
 */
export function createRepositorySource(
	overrides: Partial<RepositorySource> = {}
): RepositorySource {
	return {
		id: `source-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		name: "Test Repository",
		url: "https://github.com/test/repo",
		type: "github" as RepositorySourceType,
		...overrides,
	};
}

/**
 * Create a source with provider for testing
 */
export function createSourceWithProvider(
	sourceOverrides: Partial<RepositorySource> = {},
	providerOverrides?: Partial<ProviderInstance>
): SourceWithProvider {
	const source = createRepositorySource(sourceOverrides);
	const providerInstance = providerOverrides
		? createProviderInstance(providerOverrides)
		: undefined;

	if (providerInstance) {
		source.providerInstanceId = providerInstance.id;
	}

	return { source, providerInstance };
}

/**
 * Create a validated file result for testing
 */
export function createValidatedFile(overrides: Partial<ValidatedFile> = {}): ValidatedFile {
	return {
		filename: "presets.json",
		rawUrl: "https://raw.githubusercontent.com/test/repo/main/presets.json",
		isValid: true,
		presets: [],
		...overrides,
	};
}

/**
 * Create a fetch result for testing
 */
export function createFetchResult(overrides: Partial<FetchResult> = {}): FetchResult {
	return {
		success: true,
		files: [],
		...overrides,
	};
}

/**
 * Sample provider instances for common test scenarios
 */
export const sampleProviderInstances = {
	publicGitHub: createProviderInstance({
		id: "provider-public-github",
		name: "Public GitHub",
		type: "github",
		baseUrl: "github.com",
	}),

	enterpriseGitHub: createProviderInstance({
		id: "provider-enterprise",
		name: "Enterprise GitHub",
		type: "github",
		baseUrl: "git.company.com",
		token: "github_pat_test_token_12345",
	}),

	withToken: createProviderInstance({
		id: "provider-with-token",
		name: "GitHub with Token",
		type: "github",
		baseUrl: "github.com",
		token: "github_pat_abc123xyz",
	}),
};

/**
 * Sample repository sources for common test scenarios
 */
export const sampleRepositorySources = {
	publicRepo: createRepositorySource({
		id: "source-public-repo",
		name: "Public Repository",
		url: "https://github.com/user/public-presets",
		type: "github",
	}),

	privateRepo: createRepositorySource({
		id: "source-private-repo",
		name: "Private Repository",
		url: "https://github.com/company/private-presets",
		type: "github",
		providerInstanceId: "provider-with-token",
	}),

	gist: createRepositorySource({
		id: "source-gist",
		name: "Preset Gist",
		url: "https://gist.github.com/user/abc123",
		type: "github",
	}),

	directUrl: createRepositorySource({
		id: "source-direct-url",
		name: "Direct JSON URL",
		url: "https://example.com/presets.json",
		type: "url",
	}),
};

/**
 * Sample sources with providers for common test scenarios
 */
export const sampleSourcesWithProviders: SourceWithProvider[] = [
	{
		source: sampleRepositorySources.publicRepo,
		providerInstance: undefined,
	},
	{
		source: sampleRepositorySources.privateRepo,
		providerInstance: sampleProviderInstances.withToken,
	},
	{
		source: sampleRepositorySources.gist,
		providerInstance: undefined,
	},
];

/**
 * Sample validated files for common test scenarios
 */
export const sampleValidatedFiles = {
	validWithPresets: createValidatedFile({
		filename: "presets.json",
		isValid: true,
		presets: [
			{
				name: "Debug Mode",
				parameters: [{ type: "queryParam", key: "debug", value: "true" }],
			},
		],
	}),

	validEmpty: createValidatedFile({
		filename: "empty.json",
		isValid: true,
		presets: [],
	}),

	invalidSchema: createValidatedFile({
		filename: "invalid.json",
		isValid: false,
		presets: undefined,
		error: "Invalid preset schema: missing required field 'name'",
	}),

	invalidJson: createValidatedFile({
		filename: "broken.json",
		isValid: false,
		presets: undefined,
		error: "Failed to parse JSON",
	}),
};

/**
 * Sample fetch results for common test scenarios
 */
export const sampleFetchResults = {
	success: createFetchResult({
		success: true,
		files: [sampleValidatedFiles.validWithPresets],
	}),

	successMultipleFiles: createFetchResult({
		success: true,
		files: [sampleValidatedFiles.validWithPresets, sampleValidatedFiles.validEmpty],
	}),

	successWithInvalid: createFetchResult({
		success: true,
		files: [sampleValidatedFiles.validWithPresets, sampleValidatedFiles.invalidSchema],
	}),

	allInvalid: createFetchResult({
		success: true,
		files: [sampleValidatedFiles.invalidSchema, sampleValidatedFiles.invalidJson],
	}),

	noFiles: createFetchResult({
		success: true,
		files: [],
	}),

	error: createFetchResult({
		success: false,
		files: [],
		error: "Failed to fetch repository: 404 Not Found",
	}),
};
