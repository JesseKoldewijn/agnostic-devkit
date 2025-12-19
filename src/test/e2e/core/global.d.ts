import { Browser, BrowserContext } from "@playwright/test";

declare global {
	var __extensionBrowser: Browser | undefined;
	var __extensionContext: BrowserContext | undefined;
}
