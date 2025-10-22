import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserDetector } from "../utils/browserClasses";

describe("BrowserDetector", () => {
	beforeEach(() => {
		// Reset navigator
		vi.stubGlobal("navigator", {
			userAgent: "",
			brave: undefined,
		});
	});

	describe("isChrome", () => {
		it("should detect Chrome browser", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			expect(BrowserDetector.isChrome()).toBe(true);
		});

		it("should not detect Edge as Chrome", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
			});

			expect(BrowserDetector.isChrome()).toBe(false);
		});

		it("should not detect Opera as Chrome", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
			});

			expect(BrowserDetector.isChrome()).toBe(false);
		});

		it("should not detect Brave as Chrome", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				brave: {},
			});

			expect(BrowserDetector.isChrome()).toBe(false);
		});
	});

	describe("isBrave", () => {
		it("should detect Brave browser", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				brave: {},
			});

			expect(BrowserDetector.isBrave()).toBe(true);
		});

		it("should not detect non-Brave as Brave", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			expect(BrowserDetector.isBrave()).toBe(false);
		});
	});

	describe("isEdge", () => {
		it("should detect Edge browser", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
			});

			expect(BrowserDetector.isEdge()).toBe(true);
		});

		it("should not detect non-Edge as Edge", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			expect(BrowserDetector.isEdge()).toBe(false);
		});
	});

	describe("isOpera", () => {
		it("should detect Opera browser", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
			});

			expect(BrowserDetector.isOpera()).toBe(true);
		});

		it("should not detect non-Opera as Opera", () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			expect(BrowserDetector.isOpera()).toBe(false);
		});
	});

	describe("getBrowserName", () => {
		it('should return "Chrome" for Chrome', () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			expect(BrowserDetector.getBrowserName()).toBe("Chrome");
		});

		it('should return "Brave" for Brave', () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				brave: {},
			});

			expect(BrowserDetector.getBrowserName()).toBe("Brave");
		});

		it('should return "Edge" for Edge', () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
			});

			expect(BrowserDetector.getBrowserName()).toBe("Edge");
		});

		it('should return "Opera" for Opera', () => {
			vi.stubGlobal("navigator", {
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
			});

			expect(BrowserDetector.getBrowserName()).toBe("Opera");
		});

		it('should return "Unknown" for unknown browser', () => {
			vi.stubGlobal("navigator", {
				userAgent: "Unknown Browser",
			});

			expect(BrowserDetector.getBrowserName()).toBe("Unknown");
		});
	});
});
