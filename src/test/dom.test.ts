import { describe, it, expect, beforeEach, vi } from "vitest";
import { createIsolatedElement } from "../utils/dom";

describe("dom utilities", () => {
	let mockShadowRoot: any;

	beforeEach(() => {
		// Create a mock shadow root
		mockShadowRoot = {
			mode: "open",
			appendChild: vi.fn(),
			querySelector: vi.fn(),
			querySelectorAll: vi.fn(),
		};

		// Mock document.createElement
		vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
			const element = {
				tagName: tagName.toUpperCase(),
				className: "",
				classList: {
					add: vi.fn(),
					remove: vi.fn(),
					contains: vi.fn(),
				},
				attachShadow: vi.fn().mockReturnValue(mockShadowRoot),
				appendChild: vi.fn(),
				setAttribute: vi.fn(),
				getAttribute: vi.fn(),
				style: {},
			} as any;

			return element;
		});
	});

	describe("createIsolatedElement", () => {
		it("should create a div container element", () => {
			createIsolatedElement();
			expect(document.createElement).toHaveBeenCalledWith("div");
		});

		it("should set the class name to chrome-extension-root", () => {
			createIsolatedElement();

			const createElementCall = (document.createElement as any).mock.results[0].value;
			expect(createElementCall.className).toBe("chrome-extension-root");
		});

		it("should attach a shadow DOM in open mode", () => {
			createIsolatedElement();

			const createElementCall = (document.createElement as any).mock.results[0].value;
			expect(createElementCall.attachShadow).toHaveBeenCalledWith({ mode: "open" });
		});

		it("should return the shadow root", () => {
			const result = createIsolatedElement();
			expect(result).toBe(mockShadowRoot);
		});

		it("should create isolated elements for CSS encapsulation", () => {
			// Reset the mock count before this specific test
			(document.createElement as any).mockClear();
			
			// Create two isolated elements to verify independent creation
			createIsolatedElement();
			createIsolatedElement();

			// Each call should create a new element
			expect(document.createElement).toHaveBeenCalledTimes(2);
		});

		it("should allow appending content to shadow root", () => {
			const shadowRoot = createIsolatedElement();

			// Verify the shadow root has expected methods
			expect(shadowRoot.appendChild).toBeDefined();
			expect(shadowRoot.querySelector).toBeDefined();
			expect(shadowRoot.querySelectorAll).toBeDefined();
		});
	});
});

