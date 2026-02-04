import { beforeEach, describe, expect, it, vi } from "vitest";

import { createIsolatedElement } from "@/utils/dom";

describe("dom utilities", () => {
	let mockShadowRoot: {
		appendChild: ReturnType<typeof vi.fn>;
		mode: string;
		querySelector: ReturnType<typeof vi.fn>;
		querySelectorAll: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		// Create a mock shadow root
		mockShadowRoot = {
			appendChild: vi.fn(),
			mode: "open",
			querySelector: vi.fn(),
			querySelectorAll: vi.fn(),
		};

		// Mock document.createElement
		vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
			const element = {
				appendChild: vi.fn(),
				attachShadow: vi.fn().mockReturnValue(mockShadowRoot),
				classList: {
					add: vi.fn(),
					contains: vi.fn(),
					remove: vi.fn(),
				},
				className: "",
				getAttribute: vi.fn(),
				setAttribute: vi.fn(),
				style: {},
				tagName: tagName.toUpperCase(),
			};

			return element as unknown as HTMLElement;
		});
	});

	describe("createIsolatedElement", () => {
		it("should create a div container element", () => {
			createIsolatedElement();
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			expect(document.createElement).toHaveBeenCalledWith("div");
		});

		it("should set the class name to chrome-extension-root", () => {
			createIsolatedElement();

			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			const createElementCall = vi.mocked(document.createElement).mock.results[0].value;
			expect(createElementCall.className).toBe("chrome-extension-root");
		});

		it("should attach a shadow DOM in open mode", () => {
			createIsolatedElement();

			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			const createElementCall = vi.mocked(document.createElement).mock.results[0].value;
			expect(createElementCall.attachShadow).toHaveBeenCalledWith({ mode: "open" });
		});

		it("should return the shadow root", () => {
			const result = createIsolatedElement();
			expect(result).toBe(mockShadowRoot);
		});

		it("should create isolated elements for CSS encapsulation", () => {
			// Reset the mock count before this specific test
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			vi.mocked(document.createElement).mockClear();

			// Create two isolated elements to verify independent creation
			createIsolatedElement();
			createIsolatedElement();

			// Each call should create a new element
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			expect(document.createElement).toHaveBeenCalledTimes(2);
		});

		it("should allow appending content to shadow root", () => {
			const shadowRoot = createIsolatedElement();

			// Verify the shadow root has expected methods
			expect(shadowRoot.appendChild).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			expect(shadowRoot.querySelector).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing mocked DOM method
			expect(shadowRoot.querySelectorAll).toBeDefined();
		});
	});
});
