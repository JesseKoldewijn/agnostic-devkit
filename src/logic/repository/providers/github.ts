/**
 * GitHub Repository Provider
 * Supports GitHub.com, GitHub Enterprise (custom domains), and GitHub Gists
 * Uses REST API with optional PAT authentication, falls back to raw URLs for public repos
 */
import {
	type FetchResult,
	type GitHubFileContent,
	type GitHubGistResponse,
	type ParsedGitHubUrl,
	type ProviderInstance,
	type RepositoryProvider,
	type RepositorySource,
	type ValidatedFile,
	validatePresets,
} from "../types";
import { cachedFetch, getErrorMessage } from "./cache";

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse a GitHub URL into its components
 * Supports multiple URL formats and custom domains for GitHub Enterprise
 */
export function parseGitHubUrl(
	url: string,
	baseUrl: string = "github.com"
): ParsedGitHubUrl | null {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		const pathParts = urlObj.pathname.split("/").filter(Boolean);

		// Normalize baseUrl for comparison
		const normalizedBaseUrl = baseUrl.toLowerCase().replace(/^https?:\/\//, "");

		// Check for raw URLs (raw.githubusercontent.com or {enterprise}/raw/)
		if (hostname === "raw.githubusercontent.com" || hostname === `raw.${normalizedBaseUrl}`) {
			// Format: raw.githubusercontent.com/user/repo/ref/path/to/file.json
			if (pathParts.length < 4) return null;
			return {
				owner: pathParts[0],
				path: pathParts.slice(3).join("/"),
				ref: pathParts[2],
				repo: pathParts[1],
				type: "raw",
			};
		}

		// Check for gist URLs
		if (hostname === "gist.github.com" || hostname === `gist.${normalizedBaseUrl}`) {
			// Format: gist.github.com/user/gistid
			if (pathParts.length < 2) return null;

			// Handle optional filename in hash: #file-presets-json
			let filename: string | undefined;
			if (urlObj.hash) {
				const hashMatch = new RegExp(/^#file-(.+)$/).exec(urlObj.hash);
				if (hashMatch) {
					// Convert file-presets-json to presets.json
					filename = hashMatch[1].replace(/-([^-]+)$/, ".$1");
				}
			}

			return {
				filename,
				gistId: pathParts[1],
				owner: pathParts[0],
				type: "gist",
			};
		}

		// Check for raw gist URLs
		if (hostname === "gist.githubusercontent.com" || hostname === `gist.${normalizedBaseUrl}`) {
			// Format: gist.githubusercontent.com/user/gistid/raw/[revision]/filename
			if (pathParts.length < 4) return null;
			return {
				filename: pathParts.at(-1),
				gistId: pathParts[1],
				owner: pathParts[0],
				ref: pathParts[3] === "raw" ? undefined : pathParts[3],
				type: "gist",
			};
		}

		// Check if this matches the configured base URL
		if (hostname !== normalizedBaseUrl && hostname !== `www.${normalizedBaseUrl}`) {
			return null;
		}

		// Repository URL patterns
		if (pathParts.length >= 2) {
			const owner = pathParts[0];
			const repo = pathParts[1];

			// Check for blob URL: /user/repo/blob/ref/path
			if (pathParts.length >= 4 && pathParts[2] === "blob") {
				return {
					owner,
					path: pathParts.slice(4).join("/"),
					ref: pathParts[3],
					repo,
					type: "blob",
				};
			}

			// Check for tree URL: /user/repo/tree/ref
			if (pathParts.length >= 4 && pathParts[2] === "tree") {
				return {
					owner,
					path: pathParts.slice(4).join("/") || undefined,
					ref: pathParts[3],
					repo,
					type: "repo",
				};
			}

			// Check for raw URL pattern on enterprise: /user/repo/raw/ref/path
			if (pathParts.length >= 4 && pathParts[2] === "raw") {
				return {
					owner,
					path: pathParts.slice(4).join("/"),
					ref: pathParts[3],
					repo,
					type: "raw",
				};
			}

			// Basic repo URL: /user/repo
			return {
				owner,
				ref: "main", // Default branch
				repo,
				type: "repo",
			};
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Build API URL for GitHub Contents API
 */
function buildContentsApiUrl(parsed: ParsedGitHubUrl, baseUrl: string, path?: string): string {
	const apiBase = baseUrl === "github.com" ? "https://api.github.com" : `https://${baseUrl}/api/v3`;

	const targetPath = path ?? parsed.path ?? "";
	const ref = parsed.ref ?? "main";

	return `${apiBase}/repos/${parsed.owner}/${parsed.repo}/contents/${targetPath}?ref=${ref}`;
}

/**
 * Build API URL for Gist API
 */
function buildGistApiUrl(gistId: string, baseUrl: string): string {
	const apiBase = baseUrl === "github.com" ? "https://api.github.com" : `https://${baseUrl}/api/v3`;

	return `${apiBase}/gists/${gistId}`;
}

/**
 * Build raw URL for a file
 */
function buildRawUrl(parsed: ParsedGitHubUrl, baseUrl: string, path?: string): string {
	if (baseUrl === "github.com") {
		return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.ref ?? "main"}/${path ?? parsed.path ?? ""}`;
	}

	// GitHub Enterprise uses different raw URL format
	return `https://${baseUrl}/${parsed.owner}/${parsed.repo}/raw/${parsed.ref ?? "main"}/${path ?? parsed.path ?? ""}`;
}

// ============================================================================
// API Fetching
// ============================================================================

/**
 * Create headers for GitHub API requests
 */
function createHeaders(token?: string): HeadersInit {
	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "AgnosticDevkit-Extension",
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	return headers;
}

// Cache TTL: 5 minutes for API responses, 10 minutes for file contents
const API_CACHE_TTL = 5 * 60 * 1000;
const CONTENT_CACHE_TTL = 10 * 60 * 1000;

/**
 * Fetch directory contents from GitHub API with caching
 */
async function fetchDirectoryContents(
	apiUrl: string,
	token?: string
): Promise<{ data: GitHubFileContent[] | null; error?: string }> {
	try {
		const { data } = await cachedFetch<GitHubFileContent | GitHubFileContent[]>(apiUrl, {
			headers: createHeaders(token),
			token,
			cacheTtl: API_CACHE_TTL,
		});

		return { data: Array.isArray(data) ? data : [data] };
	} catch (error) {
		// Return user-friendly error message
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * Fetch a Gist from GitHub API with caching
 */
async function fetchGist(
	apiUrl: string,
	token?: string
): Promise<{ data: GitHubGistResponse | null; error?: string }> {
	try {
		const { data } = await cachedFetch<GitHubGistResponse>(apiUrl, {
			headers: createHeaders(token),
			token,
			cacheTtl: API_CACHE_TTL,
		});

		return { data };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * Fetch JSON content from a URL with caching
 */
async function fetchJsonContent(url: string, token?: string): Promise<unknown> {
	const headers: HeadersInit = {
		"User-Agent": "AgnosticDevkit-Extension",
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const { data } = await cachedFetch<unknown>(url, {
		headers,
		token,
		cacheTtl: CONTENT_CACHE_TTL,
	});

	return data;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate JSON file content against preset schema
 */
async function validateJsonFile(
	filename: string,
	rawUrl: string,
	token?: string
): Promise<ValidatedFile> {
	try {
		const content = await fetchJsonContent(rawUrl, token);
		const validation = validatePresets(content);

		if (validation.success) {
			return {
				filename,
				isValid: true,
				presets: validation.presets,
				rawUrl,
			};
		}

		return {
			error: validation.error,
			filename,
			isValid: false,
			rawUrl,
		};
	} catch (error) {
		// Use the user-friendly error message
		return {
			error: getErrorMessage(error),
			filename,
			isValid: false,
			rawUrl,
		};
	}
}

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Fetch files from a repository
 */
async function fetchFromRepository(
	parsed: ParsedGitHubUrl,
	baseUrl: string,
	token?: string
): Promise<FetchResult> {
	// If pointing to a specific file
	if (parsed.path?.endsWith(".json")) {
		const rawUrl = buildRawUrl(parsed, baseUrl);
		const validated = await validateJsonFile(parsed.path.split("/").pop()!, rawUrl, token);
		return {
			files: [validated],
			success: true,
		};
	}

	// Try API first for directory listing
	const apiUrl = buildContentsApiUrl(parsed, baseUrl, parsed.path);
	const { data: contents, error: apiError } = await fetchDirectoryContents(apiUrl, token);

	if (contents) {
		// Filter to JSON files and validate each
		const jsonFiles = contents.filter(
			(item) => item.type === "file" && item.name.endsWith(".json")
		);

		const validationPromises = jsonFiles.map((file) => {
			const rawUrl = file.download_url ?? buildRawUrl(parsed, baseUrl, file.path);
			return validateJsonFile(file.name, rawUrl, token);
		});

		const validatedFiles = await Promise.all(validationPromises);
		return {
			files: validatedFiles,
			success: true,
		};
	}

	// API failed - if we have a specific path, try raw URL directly
	if (parsed.path) {
		const rawUrl = buildRawUrl(parsed, baseUrl);
		try {
			const validated = await validateJsonFile(
				parsed.path.split("/").pop() ?? "presets.json",
				rawUrl,
				token
			);
			return {
				files: [validated],
				success: true,
			};
		} catch (error) {
			// Use the specific error from the API if available
			return {
				error: apiError || getErrorMessage(error),
				files: [],
				success: false,
			};
		}
	}

	// Return the API error if we have one
	return {
		error: apiError || "Could not access repository. Check the URL and ensure you have access.",
		files: [],
		success: false,
	};
}

/**
 * Fetch files from a Gist
 */
async function fetchFromGist(
	parsed: ParsedGitHubUrl,
	baseUrl: string,
	token?: string
): Promise<FetchResult> {
	const apiUrl = buildGistApiUrl(parsed.gistId!, baseUrl);
	const { data: gist, error: apiError } = await fetchGist(apiUrl, token);

	if (!gist) {
		return {
			error: apiError || "Failed to fetch Gist. It may be private or the ID is invalid.",
			files: [],
			success: false,
		};
	}

	// Get all JSON files from the gist
	const jsonFiles = Object.values(gist.files).filter((file) => file.filename.endsWith(".json"));

	if (jsonFiles.length === 0) {
		return {
			files: [],
			success: true,
		};
	}

	// If a specific filename was requested, filter to that
	const filesToProcess = parsed.filename
		? jsonFiles.filter((f) => f.filename === parsed.filename)
		: jsonFiles;

	const validationPromises = filesToProcess.map(async (file) => {
		// If content is included and not truncated, validate directly
		if (file.content && !file.truncated) {
			try {
				const data = JSON.parse(file.content);
				const validation = validatePresets(data);

				if (validation.success) {
					return {
						filename: file.filename,
						isValid: true,
						presets: validation.presets,
						rawUrl: file.raw_url,
					} as ValidatedFile;
				}

				return {
					error: validation.error,
					filename: file.filename,
					isValid: false,
					rawUrl: file.raw_url,
				} as ValidatedFile;
			} catch (error) {
				console.debug("[GitHubProvider] JSON validation error:", error);
				return {
					error: "Invalid JSON",
					filename: file.filename,
					isValid: false,
					rawUrl: file.raw_url,
				} as ValidatedFile;
			}
		}

		// Otherwise fetch from raw_url
		return validateJsonFile(file.filename, file.raw_url, token);
	});

	const files = await Promise.all(validationPromises);

	return {
		files,
		success: true,
	};
}

/**
 * Fetch from a raw URL directly
 */
async function fetchFromRawUrl(
	parsed: ParsedGitHubUrl,
	baseUrl: string,
	token?: string
): Promise<FetchResult> {
	const rawUrl = buildRawUrl(parsed, baseUrl);
	const filename = parsed.path?.split("/").pop() ?? "presets.json";

	const validated = await validateJsonFile(filename, rawUrl, token);

	return {
		files: [validated],
		success: true,
	};
}

/**
 * GitHub Repository Provider implementation
 */
export const GitHubProvider: RepositoryProvider = {
	type: "github",

	validateUrl(url: string, baseUrl: string = "github.com"): boolean {
		return parseGitHubUrl(url, baseUrl) !== null;
	},

	async fetchFiles(
		source: RepositorySource,
		providerInstance?: ProviderInstance
	): Promise<FetchResult> {
		const baseUrl = providerInstance?.baseUrl ?? "github.com";
		const token = providerInstance?.token;

		const parsed = parseGitHubUrl(source.url, baseUrl);

		if (!parsed) {
			return {
				error: `Invalid GitHub URL: ${source.url}`,
				files: [],
				success: false,
			};
		}

		switch (parsed.type) {
			case "gist":
				return fetchFromGist(parsed, baseUrl, token);
			case "raw":
				return fetchFromRawUrl(parsed, baseUrl, token);
			case "repo":
			case "blob":
				return fetchFromRepository(parsed, baseUrl, token);
			default:
				return {
					error: "Unknown URL type",
					files: [],
					success: false,
				};
		}
	},
};
