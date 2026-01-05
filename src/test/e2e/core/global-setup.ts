import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, BrowserContext } from "@playwright/test";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = resolve(__dirname, "../../../dist");

// Global storage for browser and context
declare global {
	var __extensionBrowser: Browser | undefined;
	var __extensionContext: BrowserContext | undefined;
}

async function globalSetup() {
	console.log(`Setting up extension at: ${extensionPath}`);

	// Launch browser with extension
	const browser = await chromium.launch({
		headless: true,
		channel: "chrome", // Use actual Chrome instead of Chromium for extension support
		args: [
			`--disable-extensions-except=${extensionPath}`,
			`--load-extension=${extensionPath}`,
			"--disable-web-security",
			"--disable-features=IsolateOrigins,site-per-process",
			"--disable-site-isolation-trials",
			"--allow-running-insecure-content",
			"--disable-blink-features=AutomationControlled",
		],
	});

	const context = await browser.newContext();

	// Wait for extension to initialize
	await new Promise((resolve) => setTimeout(resolve, 3000));

	// Store globally for use in tests
	global.__extensionBrowser = browser;
	global.__extensionContext = context;

	console.log("Extension browser and context initialized");
}

export default globalSetup;
