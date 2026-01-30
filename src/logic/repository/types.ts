/**
 * Repository types and Zod schemas for importing presets from external sources
 */
import { z } from "zod";

// ============================================================================
// Zod Schemas - For validating imported preset files
// ============================================================================

/**
 * Schema for parameter types
 */
export const ParameterTypeSchema = z.enum(["queryParam", "cookie", "localStorage"]);

/**
 * Schema for primitive types
 */
export const PrimitiveTypeSchema = z.enum(["string", "boolean"]);

/**
 * Schema for a single parameter
 * Required: type, key, value
 * Optional: id, description, primitiveType
 */
export const ParameterSchema = z.object({
	id: z.string().optional(),
	type: ParameterTypeSchema,
	key: z.string(),
	value: z.string(),
	description: z.string().optional(),
	primitiveType: PrimitiveTypeSchema.optional(),
});

/**
 * Schema for a preset
 * Required: name, parameters
 * Optional: id, description, createdAt, updatedAt
 */
export const PresetSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Preset name is required"),
	description: z.string().optional(),
	parameters: z.array(ParameterSchema),
	createdAt: z.number().optional(),
	updatedAt: z.number().optional(),
});

/**
 * Schema for an array of presets (the expected format of preset files)
 */
export const PresetsArraySchema = z.array(PresetSchema);

// ============================================================================
// Schema Info - Human-readable description for UI
// ============================================================================

export const PRESET_SCHEMA_DESCRIPTION = `Preset files must be a JSON array containing preset objects.

Each preset must have:
• name (string) - The display name of the preset
• parameters (array) - List of parameters to apply

Each parameter must have:
• type - One of: "queryParam", "cookie", or "localStorage"
• key (string) - The parameter name
• value (string) - The value to set

Optional fields:
• id, description, createdAt, updatedAt for presets
• id, description, primitiveType for parameters`;

export const PRESET_SCHEMA_EXAMPLE = `[
  {
    "name": "Debug Mode",
    "description": "Enable debug features",
    "parameters": [
      {
        "type": "queryParam",
        "key": "debug",
        "value": "true"
      },
      {
        "type": "localStorage",
        "key": "devTools",
        "value": "enabled"
      }
    ]
  }
]`;

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Supported provider types
 * - "github": GitHub, GitHub Enterprise, or Gist
 * - "url": Direct JSON file URL (public)
 */
export type ProviderType = "github" | "url";

/**
 * A configured provider instance (e.g., a specific GitHub Enterprise server)
 * Users can configure multiple instances per provider type
 */
export interface ProviderInstance {
	/** Unique identifier */
	id: string;
	/** Display name (e.g., "Company GitHub", "Personal GitHub") */
	name: string;
	/** Provider type */
	type: ProviderType;
	/** Base URL/domain (e.g., "github.com", "git.company.com") */
	baseUrl: string;
	/** Optional Personal Access Token for private repos */
	token?: string;
}

/**
 * Source type for repository sources
 */
export type RepositorySourceType = "github" | "url";

/**
 * A repository source that can be fetched for presets
 */
export interface RepositorySource {
	/** Unique identifier */
	id: string;
	/** Display name for the source */
	name: string;
	/** The URL to the repository, gist, or JSON file */
	url: string;
	/**
	 * The source type
	 * - "github": GitHub repository or Gist (uses GitHub API)
	 * - "url": Direct JSON URL (fetches raw content)
	 */
	type: RepositorySourceType;
	/**
	 * The provider instance to use for authentication
	 * - If set, uses the linked provider instance for auth/API calls
	 * - If not set, treated as a public URL (for "url" type sources)
	 */
	providerInstanceId?: string;
}

/**
 * Result of validating a JSON file against the preset schema
 */
export interface ValidatedFile {
	/** Filename or path */
	filename: string;
	/** Raw URL to fetch the file content */
	rawUrl: string;
	/** Whether the file passed schema validation */
	isValid: boolean;
	/** The validated presets (only if isValid is true) */
	presets?: z.infer<typeof PresetsArraySchema>;
	/** Validation error message (only if isValid is false) */
	error?: string;
}

/**
 * Result of fetching files from a repository source
 */
export interface FetchResult {
	/** Whether the fetch was successful */
	success: boolean;
	/** List of JSON files found (both valid and invalid) */
	files: ValidatedFile[];
	/** Error message if fetch failed */
	error?: string;
}

/**
 * Interface for repository providers
 */
export interface RepositoryProvider {
	/** Provider type identifier */
	type: ProviderType;

	/**
	 * Check if a URL is valid for this provider
	 */
	validateUrl(url: string, baseUrl?: string): boolean;

	/**
	 * Fetch and validate JSON files from a source
	 * @param source - The repository source configuration
	 * @param providerInstance - Optional provider instance for auth
	 * @returns Fetch result with validated files
	 */
	fetchFiles(source: RepositorySource, providerInstance?: ProviderInstance): Promise<FetchResult>;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Storage schema for repository configuration in browser.storage.local
 */
export interface RepositoryStorageSchema {
	/** Configured provider instances */
	providerInstances: ProviderInstance[];
	/** Configured repository sources */
	repositorySources: RepositorySource[];
}

// ============================================================================
// URL Parsing Types (for GitHub provider)
// ============================================================================

/**
 * Parsed GitHub URL information
 */
export interface ParsedGitHubUrl {
	/** Type of GitHub resource */
	type: "repo" | "gist" | "raw" | "blob";
	/** Repository owner (username or org) */
	owner: string;
	/** Repository name (for repo type) */
	repo?: string;
	/** Gist ID (for gist type) */
	gistId?: string;
	/** Branch or ref */
	ref?: string;
	/** Path to specific file */
	path?: string;
	/** Filename (for gist) */
	filename?: string;
}

/**
 * GitHub API file content response
 */
export interface GitHubFileContent {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string | null;
	type: "file" | "dir";
	content?: string;
	encoding?: string;
}

/**
 * GitHub API Gist response
 */
export interface GitHubGistResponse {
	id: string;
	description: string | null;
	files: Record<
		string,
		{
			filename: string;
			type: string;
			language: string | null;
			raw_url: string;
			size: number;
			truncated?: boolean;
			content?: string;
		}
	>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for provider instances and sources
 */
export function generateRepositoryId(): string {
	return `repo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new provider instance with defaults
 */
export function createProviderInstance(
	type: ProviderType,
	name: string,
	baseUrl: string,
	token?: string
): ProviderInstance {
	return {
		baseUrl,
		id: generateRepositoryId(),
		name,
		token,
		type,
	};
}

/**
 * Create a new repository source with defaults
 */
export function createRepositorySource(
	name: string,
	url: string,
	type: RepositorySourceType = "github",
	providerInstanceId?: string
): RepositorySource {
	return {
		id: generateRepositoryId(),
		name,
		providerInstanceId,
		type,
		url,
	};
}

/**
 * Validate preset data against the schema
 * @returns Validated presets or null with error message
 */
export function validatePresets(
	data: unknown
):
	| { success: true; presets: z.infer<typeof PresetsArraySchema> }
	| { success: false; error: string } {
	const result = PresetsArraySchema.safeParse(data);

	if (result.success) {
		return { presets: result.data, success: true };
	}

	// Format Zod errors into a readable message (Zod 4 uses .issues)
	const issues = result.error.issues ?? [];
	const errors = issues.map((issue) => {
		const path = issue.path.join(".");
		return path ? `${path}: ${issue.message}` : issue.message;
	});

	return { error: errors.join("; "), success: false };
}
