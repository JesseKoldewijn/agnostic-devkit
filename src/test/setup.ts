import { vi } from "vitest";

// Mock chrome API
const mockChrome = {
	storage: {
		sync: {
			get: vi.fn(),
			set: vi.fn(),
		},
		onChanged: {
			addListener: vi.fn(),
		},
	},
	runtime: {
		onInstalled: {
			addListener: vi.fn(),
		},
		onStartup: {
			addListener: vi.fn(),
		},
		onMessage: {
			addListener: vi.fn(),
		},
		lastError: null,
	},
	tabs: {
		onUpdated: {
			addListener: vi.fn(),
		},
	},
	action: {
		setPopup: vi.fn(),
		getPopup: vi.fn(),
		onClicked: {
			addListener: vi.fn(),
		},
	},
	sidePanel: {
		setOptions: vi.fn(),
		setPanelBehavior: vi.fn(),
		open: vi.fn(),
		getOptions: vi.fn(),
	},
	notifications: {
		create: vi.fn(),
		clear: vi.fn(),
		update: vi.fn(),
		getAll: vi.fn(),
		onClicked: {
			addListener: vi.fn(),
		},
		onClosed: {
			addListener: vi.fn(),
		},
		onButtonClicked: {
			addListener: vi.fn(),
		},
	},
	contextMenus: {
		create: vi.fn(),
		removeAll: vi.fn(),
		onClicked: {
			addListener: vi.fn(),
		},
	},
};

globalThis.chrome = mockChrome as any;
