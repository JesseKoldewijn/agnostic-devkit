/**
 * Browser detection utility class
 * Provides static methods for detecting different browsers
 */
export class BrowserDetector {
	/**
	 * Check if running in Chrome
	 */
	static isChrome(): boolean {
		return (
			/Chrome/.test(navigator.userAgent) &&
			!/Edg|OPR/.test(navigator.userAgent) &&
			!(navigator as any).brave
		);
	}

	/**
	 * Check if running in Brave
	 */
	static isBrave(): boolean {
		return !!(navigator as any).brave;
	}

	/**
	 * Check if running in Edge
	 */
	static isEdge(): boolean {
		return /Edg/.test(navigator.userAgent);
	}

	/**
	 * Check if running in Opera
	 */
	static isOpera(): boolean {
		return /OPR/.test(navigator.userAgent);
	}

	/**
	 * Get the browser name
	 */
	static getBrowserName(): string {
		if (this.isBrave()) return "Brave";
		if (this.isEdge()) return "Edge";
		if (this.isOpera()) return "Opera";
		if (this.isChrome()) return "Chrome";
		return "Unknown";
	}
}

/**
 * SidePanel API wrapper class
 * Handles cross-browser sidebar/sidePanel functionality
 */
export class SidePanelManager {
	/**
	 * Check if any sidebar API is available
	 */
	static isAvailable(): boolean {
		if (typeof chrome === "undefined") return false;
		return !!(chrome.sidePanel || (chrome as any).sidebarAction);
	}

	/**
	 * Set sidebar panel options
	 */
	static async setOptions(options: {
		enabled?: boolean;
		path?: string;
	}): Promise<void> {
		if (chrome.sidePanel) {
			await chrome.sidePanel.setOptions(options);
		} else if ((chrome as any).sidebarAction) {
			if (options.path) {
				await (chrome as any).sidebarAction.setPanel({
					panel: options.path,
				});
			}
		} else {
			console.warn("[SidePanel] API not available in this browser");
		}
	}

	/**
	 * Set panel behavior (e.g., openPanelOnActionClick)
	 */
	static async setPanelBehavior(behavior: {
		openPanelOnActionClick?: boolean;
	}): Promise<void> {
		if (
			typeof chrome !== "undefined" &&
			chrome.sidePanel?.setPanelBehavior
		) {
			await chrome.sidePanel.setPanelBehavior(behavior);
		} else {
			console.warn("[SidePanel] setPanelBehavior not available");
		}
	}

	/**
	 * Open the sidebar programmatically
	 */
	static async open(options?: { windowId?: number }): Promise<void> {
		if (typeof chrome === "undefined") {
			throw new TypeError("Chrome API is undefined");
		}

		if (chrome.sidePanel?.open) {
			if (options?.windowId) {
				await chrome.sidePanel.open({ windowId: options.windowId });
			} else {
				await chrome.sidePanel.open({} as any);
			}
		} else if ((chrome as any).sidebarAction?.open) {
			await (chrome as any).sidebarAction.open();
		} else {
			throw new Error("Sidebar API not available");
		}
	}

	/**
	 * Get sidebar options
	 */
	static async getOptions(options?: { tabId?: number }): Promise<any> {
		if (chrome.sidePanel?.getOptions) {
			return await chrome.sidePanel.getOptions(options || {});
		}
		return null;
	}
}

/**
 * Display mode type
 */
export type DisplayMode = "popup" | "sidebar";

/**
 * Display mode management class
 * Handles popup vs sidebar configuration
 */
export class DisplayModeManager {
	private static readonly STORAGE_KEY = "displayMode";

	/**
	 * Get the current display mode from storage
	 */
	static async getDisplayMode(): Promise<DisplayMode> {
		if (typeof chrome === "undefined" || !chrome.storage) {
			return "popup";
		}

		const result = await chrome.storage.sync.get([this.STORAGE_KEY]);
		return (result[this.STORAGE_KEY] as DisplayMode | undefined) ?? "popup";
	}

	/**
	 * Set the display mode in storage
	 */
	static async setDisplayMode(mode: DisplayMode): Promise<void> {
		if (typeof chrome === "undefined" || !chrome.storage) {
			throw new TypeError("Chrome storage API is undefined");
		}

		await chrome.storage.sync.set({ [this.STORAGE_KEY]: mode });
	}

	/**
	 * Apply the display mode by updating extension action and sidebar
	 */
	static async applyDisplayMode(mode: DisplayMode): Promise<void> {
		if (typeof chrome === "undefined") {
			throw new TypeError("Chrome API is undefined");
		}

		if (mode === "sidebar") {
			if (!SidePanelManager.isAvailable()) {
				console.warn(
					`[DisplayMode] Sidebar not supported in ${BrowserDetector.getBrowserName()}, falling back to popup`
				);
				await chrome.action?.setPopup({
					popup: "src/sidebar/index.html",
				});
				return;
			}

			await SidePanelManager.setOptions({
				enabled: true,
				path: "src/sidebar/index.html",
			});

			await SidePanelManager.setPanelBehavior({
				openPanelOnActionClick: true,
			});

			await chrome.action?.setPopup({ popup: "" });
		} else {
			await chrome.action?.setPopup({ popup: "src/popup/index.html" });

			if (SidePanelManager.isAvailable()) {
				await SidePanelManager.setOptions({
					enabled: false,
				});
			}
		}
	}
}

/**
 * Theme type
 */
export type Theme = "light" | "dark" | "system";

/**
 * Theme management class
 */
export class ThemeManager {
	private static readonly STORAGE_KEY = "theme";

	/**
	 * Get the current theme from storage
	 */
	static async getTheme(): Promise<Theme> {
		if (typeof chrome === "undefined" || !chrome.storage) {
			return "system";
		}

		const result = await chrome.storage.sync.get([this.STORAGE_KEY]);
		return (result[this.STORAGE_KEY] as Theme | undefined) ?? "system";
	}

	/**
	 * Set the theme in storage
	 */
	static async setTheme(theme: Theme): Promise<void> {
		if (typeof chrome === "undefined" || !chrome.storage) {
			throw new TypeError("Chrome storage API is undefined");
		}

		await chrome.storage.sync.set({ [this.STORAGE_KEY]: theme });
	}

	/**
	 * Determine the actual theme to apply based on system preference
	 */
	static resolveTheme(theme: Theme): "light" | "dark" {
		if (theme === "system") {
			return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		return theme;
	}
}
