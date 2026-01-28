import { beforeAll, describe, expect, it, vi } from "vitest";

import { getLatestRelease, getUpdateInfo } from "../logic/releaseService";

describe("releaseService", () => {
	beforeAll(() => {
		// Mock global constants

		const globalAny = global as any;
		globalAny.__REPO_URL__ = "https://github.com/owner/repo";
		globalAny.__EXTENSION_ENV__ = "development";
	});

	const mockReleases = [
		{
			tag_name: "v1.2.0",
			prerelease: false,
			html_url: "https://github.com/owner/repo/releases/tag/v1.2.0",
		},
		{
			tag_name: "v1.3.0-canary.1",
			prerelease: true,
			html_url: "https://github.com/owner/repo/releases/tag/v1.3.0-canary.1",
		},
		{
			tag_name: "v1.1.0",
			prerelease: false,
			html_url: "https://github.com/owner/repo/releases/tag/v1.1.0",
		},
	];

	it("should correctly identify the latest production release", async () => {
		vi.spyOn(global, "fetch").mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockReleases),
		} as Response);

		const release = await getLatestRelease("production");
		expect(release?.tag_name).toBe("v1.2.0");
		expect(release?.prerelease).toBeFalsy();
	});

	it("should correctly identify the latest canary release", async () => {
		vi.spyOn(global, "fetch").mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockReleases),
		} as Response);

		const release = await getLatestRelease("canary");
		expect(release?.tag_name).toBe("v1.3.0-canary.1");
		expect(release?.prerelease).toBeTruthy();
	});

	describe("getUpdateInfo", () => {
		it("should return update available when a newer production version exists", async () => {
			vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockReleases),
			} as Response);

			const currentVersion = "1.1.0";
			const info = await getUpdateInfo(currentVersion, "production");

			expect(info.isUpdateAvailable).toBeTruthy();
			expect(info.latestVersion).toBe("v1.2.0");
		});

		it("should return no update when on the latest production version", async () => {
			vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockReleases),
			} as Response);

			const currentVersion = "1.2.0";
			const info = await getUpdateInfo(currentVersion, "production");

			expect(info.isUpdateAvailable).toBeFalsy();
		});

		it("should return update available when a newer canary version exists", async () => {
			vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockReleases),
			} as Response);

			const currentVersion = "1.2.0";
			const info = await getUpdateInfo(currentVersion, "canary");

			expect(info.isUpdateAvailable).toBeTruthy();
			expect(info.latestVersion).toBe("v1.3.0-canary.1");
		});
	});
});
