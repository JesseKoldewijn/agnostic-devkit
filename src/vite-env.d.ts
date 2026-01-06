/// <reference types="vite/client" />

declare const __REPO_URL__: string;
declare const __EXTENSION_ENV__: "development" | "canary" | "production";
declare const __EXTENSION_VERSION__: string;

interface Window {
	__LOGIC__: typeof import("./logic/parameters");
}

// extend the process.env type
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production";
			PORT: string;
			CI: boolean;
			NO_HEADLESS: boolean;
		}
	}
}
