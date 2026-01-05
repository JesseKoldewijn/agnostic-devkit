export interface GitHubRelease {
	tag_name: string;
	prerelease: boolean;
	html_url: string;
	name: string;
	published_at: string;
}

export interface UpdateInfo {
	isUpdateAvailable: boolean;
	latestVersion: string;
	url: string;
	publishedAt: string;
}

/**
 * Normalizes a version string by removing 'v' prefix
 */
function normalizeVersion(version: string): string {
	return version.replace(/^v/, "");
}

/**
 * Simple semantic version comparison
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
	const partsA = normalizeVersion(a).split(/[.-]/);
	const partsB = normalizeVersion(b).split(/[.-]/);

	for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
		const partA = partsA[i];
		const partB = partsB[i];

		if (partA === partB) {
			continue;
		}
		if (partA === undefined) {
			return -1;
		}
		if (partB === undefined) {
			return 1;
		}

		const numA = Number.parseInt(partA, 10);
		const numB = Number.parseInt(partB, 10);

		if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
			if (numA !== numB) {
				return numA - numB;
			}
		} else {
			// String comparison for pre-release tags (e.g., canary.1)
			if (partA < partB) {
				return -1;
			}
			if (partA > partB) {
				return 1;
			}
		}
	}
	return 0;
}

/**
 * Gets the latest release from GitHub API based on environment
 */
export async function getLatestRelease(
	env: "production" | "canary" | "development"
): Promise<GitHubRelease | null> {
	try {
		// Extract owner/repo from __REPO_URL__ (e.g., https://github.com/owner/repo)
		const repoPath = __REPO_URL__.replace("https://github.com/", "");
		const response = await fetch(`https://api.github.com/repos/${repoPath}/releases`);

		if (!response.ok) {
			return null;
		}

		const releases: GitHubRelease[] = await response.json();

		if (env === "production") {
			// Find the latest stable release (prerelease: false)
			return releases.find((r) => !r.prerelease) || null;
		} else if (env === "canary") {
			// Find the latest prerelease
			return releases.find((r) => r.prerelease) || null;
		}
		// For development, just take the absolute latest
		return releases[0] || null;
	} catch (error) {
		console.error("Failed to fetch releases:", error);
		return null;
	}
}

/**
 * Compares current version with remote and returns update info
 */
export async function getUpdateInfo(
	currentVersion: string,
	env: "production" | "canary" | "development"
): Promise<UpdateInfo> {
	const latest = await getLatestRelease(env);

	if (!latest) {
		return {
			isUpdateAvailable: false,
			latestVersion: currentVersion,
			url: "",
			publishedAt: "",
		};
	}

	const isNewer = compareVersions(latest.tag_name, currentVersion) > 0;

	return {
		isUpdateAvailable: isNewer,
		latestVersion: latest.tag_name,
		url: latest.html_url,
		publishedAt: latest.published_at,
	};
}
