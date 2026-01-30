/**
 * URL Repository Provider
 * Fetches presets from direct JSON file URLs (public, no authentication)
 */
import {
	type FetchResult,
	type ProviderInstance,
	type RepositoryProvider,
	type RepositorySource,
	type ValidatedFile,
	validatePresets,
} from "../types";
import { cachedFetch, getErrorMessage } from "./cache";

// Cache TTL: 10 minutes for URL content
const CONTENT_CACHE_TTL = 10 * 60 * 1000;

/**
 * Check if a URL points to a JSON file
 */
function isJsonUrl(url: string): boolean {
	try {
		const urlObj = new URL(url);
		// Check for .json extension or common JSON content-type patterns
		return (
			urlObj.pathname.endsWith(".json") ||
			(urlObj.searchParams.has("format") && urlObj.searchParams.get("format") === "json")
		);
	} catch {
		return false;
	}
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const filename = pathname.split("/").pop();
		return filename?.endsWith(".json") ? filename : "presets.json";
	} catch {
		return "presets.json";
	}
}

/**
 * Fetch and validate JSON from a URL with caching
 */
async function fetchAndValidateJson(url: string): Promise<ValidatedFile> {
	const filename = getFilenameFromUrl(url);

	try {
		const { data } = await cachedFetch<unknown>(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "AgnosticDevkit-Extension",
			},
			cacheTtl: CONTENT_CACHE_TTL,
		});

		const validation = validatePresets(data);

		if (validation.success) {
			return {
				filename,
				isValid: true,
				presets: validation.presets,
				rawUrl: url,
			};
		}

		return {
			error: validation.error,
			filename,
			isValid: false,
			rawUrl: url,
		};
	} catch (error) {
		// Use the user-friendly error message
		return {
			error: getErrorMessage(error),
			filename,
			isValid: false,
			rawUrl: url,
		};
	}
}

/**
 * URL Provider implementation
 * Handles direct JSON file URLs without authentication
 */
export const UrlProvider: RepositoryProvider = {
	type: "url",

	validateUrl(url: string): boolean {
		try {
			const urlObj = new URL(url);
			// Must be http or https
			return urlObj.protocol === "http:" || urlObj.protocol === "https:";
		} catch {
			return false;
		}
	},

	async fetchFiles(
		source: RepositorySource,
		_providerInstance?: ProviderInstance // Unused for URL provider
	): Promise<FetchResult> {
		// Validate URL format
		if (!this.validateUrl(source.url)) {
			return {
				error: `Invalid URL: ${source.url}`,
				files: [],
				success: false,
			};
		}

		// Warn if URL doesn't look like JSON
		if (!isJsonUrl(source.url)) {
			// Still try to fetch, but the content might not be JSON
		}

		const validated = await fetchAndValidateJson(source.url);

		return {
			files: [validated],
			success: true,
		};
	},
};
