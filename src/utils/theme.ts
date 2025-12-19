import { browser } from "wxt/browser";

export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";

/**
 * Gets the current theme from storage
 */
export async function getTheme(): Promise<Theme> {
	const result = (await browser.storage?.sync.get([THEME_STORAGE_KEY])) || {};
	return (result[THEME_STORAGE_KEY] as Theme) || "system";
}

/**
 * Sets the theme in storage
 */
export async function setTheme(theme: Theme): Promise<void> {
	await browser.storage?.sync.set({ [THEME_STORAGE_KEY]: theme });
}

/**
 * Gets the effective theme (resolves 'system' to 'light' or 'dark')
 */
export function getEffectiveTheme(theme: Theme): "light" | "dark" {
	if (theme === "system") {
		return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return theme;
}

/**
 * Applies the theme to the document
 */
export function applyTheme(theme: Theme): void {
	const effectiveTheme = getEffectiveTheme(theme);
	const html = document.documentElement;

	// Remove all theme classes
	html.classList.remove("light", "dark");

	// Add the effective theme class
	if (theme !== "system") {
		html.classList.add(effectiveTheme);
		html.classList.remove("system");
		return;
	}

	// If system, add 'system' class
	html.classList.remove("light", "dark", "system");
	html.classList.add("system");
}

/**
 * Initializes theme on page load
 */
export async function initTheme(): Promise<void> {
	const theme = await getTheme();
	applyTheme(theme);

	// Listen for system theme changes when in system mode
	globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", async () => {
		const currentTheme = await getTheme();
		if (currentTheme === "system") {
			applyTheme("system");
		}
	});

	// Listen for theme changes from storage
	browser.storage?.onChanged.addListener((changes, areaName) => {
		if (areaName === "sync" && changes[THEME_STORAGE_KEY]) {
			const newTheme = changes[THEME_STORAGE_KEY].newValue as Theme;
			applyTheme(newTheme);
		}
	});
}
