/**
 * Re-export fakeBrowser from wxt/testing with common setup utilities
 * This provides a centralized place for browser API mocking
 */
import { vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

export { fakeBrowser };

/**
 * Setup common browser API mocks for testing
 * Call this in beforeEach to get consistent mock behavior
 */
export function setupBrowserMocks(options: { tabUrl?: string; incognito?: boolean } = {}) {
	const mockTabUrl = { current: options.tabUrl ?? "https://example.com/page" };
	const mockIncognito = { current: options.incognito ?? false };

	fakeBrowser.reset();

	// Setup fake tabs.get
	(fakeBrowser.tabs.get as ReturnType<typeof vi.fn>) = vi.fn(async (tabId: number) => ({
		id: tabId,
		url: mockTabUrl.current,
		title: "Test Page",
		incognito: mockIncognito.current,
	}));

	// Setup fake tabs.query
	(fakeBrowser.tabs.query as ReturnType<typeof vi.fn>) = vi.fn(async () => [
		{
			id: 123,
			url: mockTabUrl.current,
			title: "Test Page",
			incognito: mockIncognito.current,
		},
	]);

	// Setup fake tabs.update
	(fakeBrowser.tabs.update as ReturnType<typeof vi.fn>) = vi.fn(
		async (tabId: number, props: { url?: string }) => {
			if (props.url) {
				mockTabUrl.current = props.url;
			}
			return {
				id: tabId,
				url: mockTabUrl.current,
				title: "Test Page",
				incognito: mockIncognito.current,
			};
		}
	);

	// Setup fake cookies
	(fakeBrowser.cookies.set as ReturnType<typeof vi.fn>) = vi.fn(async () => ({}));
	(fakeBrowser.cookies.get as ReturnType<typeof vi.fn>) = vi.fn(async () => null);
	(fakeBrowser.cookies.remove as ReturnType<typeof vi.fn>) = vi.fn(async () => ({}));

	// Setup fake scripting
	(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>) = vi.fn(async () => [
		{ result: undefined },
	]);

	return {
		mockTabUrl,
		mockIncognito,
		setTabUrl: (url: string) => {
			mockTabUrl.current = url;
		},
		getTabUrl: () => mockTabUrl.current,
		setIncognito: (value: boolean) => {
			mockIncognito.current = value;
		},
	};
}

/**
 * Setup fetch mock for API testing
 */
export function setupFetchMock() {
	const originalFetch = globalThis.fetch;

	const mockFetch = vi.fn();
	globalThis.fetch = mockFetch;

	return {
		mockFetch,
		restore: () => {
			globalThis.fetch = originalFetch;
		},
		mockResponse: (data: unknown, options: { ok?: boolean; status?: number } = {}) => {
			mockFetch.mockResolvedValueOnce({
				ok: options.ok ?? true,
				status: options.status ?? 200,
				json: () => Promise.resolve(data),
				text: () => Promise.resolve(JSON.stringify(data)),
			});
		},
		mockError: (status: number, message: string) => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status,
				json: () => Promise.resolve({ message }),
				text: () => Promise.resolve(JSON.stringify({ message })),
			});
		},
	};
}
