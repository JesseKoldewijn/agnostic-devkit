/**
 * API Response Cache
 * Provides in-memory caching to prevent rate limiting from GitHub and other APIs
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	expiresAt: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_ENTRIES = 100;

/**
 * Simple LRU-like cache for API responses
 */
class ApiCache {
	private cache = new Map<string, CacheEntry<unknown>>();
	private accessOrder: string[] = [];
	private maxEntries: number;

	constructor(maxEntries: number = DEFAULT_MAX_ENTRIES) {
		this.maxEntries = maxEntries;
	}

	/**
	 * Get a cached value if it exists and hasn't expired
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			this.accessOrder = this.accessOrder.filter((k) => k !== key);
			return null;
		}

		// Update access order (move to end)
		this.accessOrder = this.accessOrder.filter((k) => k !== key);
		this.accessOrder.push(key);

		return entry.data as T;
	}

	/**
	 * Set a cached value with TTL
	 */
	set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
		// Evict oldest entries if at capacity
		while (this.cache.size >= this.maxEntries && this.accessOrder.length > 0) {
			const oldestKey = this.accessOrder.shift()!;
			this.cache.delete(oldestKey);
		}

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			expiresAt: Date.now() + ttl,
		};

		this.cache.set(key, entry);
		this.accessOrder.push(key);
	}

	/**
	 * Check if a key exists and is not expired
	 */
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Remove a specific entry
	 */
	delete(key: string): void {
		this.cache.delete(key);
		this.accessOrder = this.accessOrder.filter((k) => k !== key);
	}

	/**
	 * Clear all cached entries
	 */
	clear(): void {
		this.cache.clear();
		this.accessOrder = [];
	}

	/**
	 * Get cache statistics
	 */
	stats(): { size: number; maxEntries: number } {
		return {
			size: this.cache.size,
			maxEntries: this.maxEntries,
		};
	}
}

// Global cache instance for API responses
export const apiCache = new ApiCache();

/**
 * Generate a cache key for a fetch request
 */
export function generateCacheKey(url: string, options?: { token?: string }): string {
	// Include presence of token in key (but not the token itself for security)
	const authMarker = options?.token ? ":auth" : ":public";
	return `${url}${authMarker}`;
}

/**
 * Cached fetch wrapper
 * Returns cached response if available, otherwise fetches and caches
 */
export async function cachedFetch<T>(
	url: string,
	options: RequestInit & { token?: string; cacheTtl?: number } = {}
): Promise<{ data: T; fromCache: boolean }> {
	const { token, cacheTtl = DEFAULT_TTL, ...fetchOptions } = options;
	const cacheKey = generateCacheKey(url, { token });

	// Check cache first
	const cached = apiCache.get<T>(cacheKey);
	if (cached !== null) {
		return { data: cached, fromCache: true };
	}

	// Fetch fresh data
	const response = await fetch(url, fetchOptions);

	if (!response.ok) {
		// Don't cache error responses, throw to be handled by caller
		throw await createApiError(response);
	}

	const data = (await response.json()) as T;

	// Cache successful response
	apiCache.set(cacheKey, data, cacheTtl);

	return { data, fromCache: false };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * API Error with human-readable message
 */
export class ApiError extends Error {
	public readonly status: number;
	public readonly statusText: string;
	public readonly apiMessage?: string;
	public readonly documentationUrl?: string;

	constructor(status: number, statusText: string, apiMessage?: string, documentationUrl?: string) {
		// Create human-readable message
		const humanMessage = formatApiErrorMessage(status, statusText, apiMessage);
		super(humanMessage);

		this.name = "ApiError";
		this.status = status;
		this.statusText = statusText;
		this.apiMessage = apiMessage;
		this.documentationUrl = documentationUrl;
	}
}

/**
 * GitHub API error response structure
 */
interface GitHubApiErrorResponse {
	message?: string;
	documentation_url?: string;
}

/**
 * Create an ApiError from a fetch response
 */
async function createApiError(response: Response): Promise<ApiError> {
	let apiMessage: string | undefined;
	let documentationUrl: string | undefined;

	try {
		const errorData = (await response.json()) as GitHubApiErrorResponse;
		apiMessage = errorData.message;
		documentationUrl = errorData.documentation_url;
	} catch {
		// Response body is not JSON, that's fine
	}

	return new ApiError(response.status, response.statusText, apiMessage, documentationUrl);
}

/**
 * Format API error into human-readable message
 */
function formatApiErrorMessage(status: number, statusText: string, apiMessage?: string): string {
	// Handle rate limiting specifically
	if (status === 403 && apiMessage?.toLowerCase().includes("rate limit")) {
		return formatRateLimitError(apiMessage);
	}

	if (status === 429) {
		return "Too many requests. Please wait a few minutes before trying again.";
	}

	// Handle common HTTP errors with friendly messages
	switch (status) {
		case 401:
			return "Authentication required. Please configure a personal access token in Settings.";
		case 403:
			if (apiMessage?.toLowerCase().includes("access")) {
				return "Access denied. You may not have permission to view this resource.";
			}
			return apiMessage
				? extractFriendlyMessage(apiMessage)
				: "Access forbidden. The resource may be private or require authentication.";
		case 404:
			return "Resource not found. Please check the URL and try again.";
		case 500:
		case 502:
		case 503:
			return "GitHub is experiencing issues. Please try again later.";
		default:
			if (apiMessage) {
				return extractFriendlyMessage(apiMessage);
			}
			return `Request failed: ${statusText || `HTTP ${status}`}`;
	}
}

/**
 * Format rate limit error message
 */
function formatRateLimitError(apiMessage: string): string {
	// Check if it mentions authentication
	if (apiMessage.toLowerCase().includes("authenticated")) {
		return "GitHub API rate limit exceeded. Add a Personal Access Token in Settings to increase your rate limit.";
	}

	return "GitHub API rate limit exceeded. Please wait a few minutes before trying again, or add a Personal Access Token to increase your rate limit.";
}

/**
 * Extract a friendly message from API error response
 * Removes technical details like IP addresses
 */
function extractFriendlyMessage(message: string): string {
	// Remove IP addresses from the message
	const withoutIp = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[your IP]");

	// Remove parenthetical explanations that are too technical
	// Keep the main message, remove "But here's the good news..." parentheticals
	const simplified = withoutIp.replace(/\s*\(But here's the good news:.*?\)/gi, "");

	// Clean up any double spaces
	return simplified.replace(/\s+/g, " ").trim();
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
	if (error instanceof ApiError) {
		return (
			error.status === 429 ||
			(error.status === 403 && error.apiMessage?.toLowerCase().includes("rate limit") === true)
		);
	}
	return false;
}

/**
 * Parse error into user-friendly message
 * Works with any error type
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message;
	}

	if (error instanceof Error) {
		// Check for network errors
		if (error.message.includes("fetch")) {
			return "Network error. Please check your internet connection.";
		}
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "An unexpected error occurred. Please try again.";
}
