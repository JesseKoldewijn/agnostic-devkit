import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { cleanupTabState } from "@/logic/parameters";
import { logBrowserInfo } from "@/utils/browser";
import { initDisplayMode } from "@/utils/displayMode";

async function isTabIncognito(tabId: number): Promise<boolean> {
	try {
		const tab = await browser.tabs?.get(tabId);
		return tab?.incognito === true;
	} catch {
		return false;
	}
}

/** Returns true for error names that indicate localStorage is blocked (private mode, storage disabled). */
export function isStorageUnavailableError(errorName?: string): boolean {
	return errorName === "QuotaExceededError" || errorName === "SecurityError";
}

async function buildScriptErrorResponse(
	error: Error,
	tabId: number,
	operation: string,
	errorName?: string
): Promise<{ success: false; error: string; reason?: string; incognito?: boolean }> {
	const incognito = await isTabIncognito(tabId);
	const errorMsg = error.message || String(error);

	if (isStorageUnavailableError(errorName)) {
		return {
			error: `${operation} failed: localStorage is unavailable (private/restricted window)`,
			incognito,
			reason: "storage_unavailable",
			success: false,
		};
	}

	const isPermissionError =
		errorMsg.includes("Cannot access") ||
		errorMsg.includes("No tab with id") ||
		errorMsg.includes("permission") ||
		errorMsg.includes("Missing host permission");

	if (incognito && isPermissionError) {
		console.error(
			`[Background] ${operation} failed on incognito tab ${tabId}: ${errorMsg}. ` +
				`The extension may not have "Allow in incognito" enabled.`
		);
		return {
			error:
				`${operation} failed on incognito tab: ${errorMsg}. ` +
				`Ensure the extension has "Allow in incognito" enabled in your browser's extension settings.`,
			incognito: true,
			reason: "incognito_not_allowed",
			success: false,
		};
	}

	if (incognito) {
		console.error(`[Background] ${operation} failed on incognito tab ${tabId}: ${errorMsg}`);
		return {
			error: `${operation} failed on incognito tab: ${errorMsg}`,
			incognito: true,
			reason: "incognito_script_error",
			success: false,
		};
	}

	console.error(`[Background] ${operation} failed on tab ${tabId}: ${errorMsg}`);
	return {
		error: `${operation} failed: ${errorMsg}`,
		reason: "script_error",
		success: false,
	};
}

export type LSOpResult =
	| { success: true; value?: string | null }
	| { success: false; error: string; reason?: string; incognito?: boolean };

/** In-memory fallback store for tabs where localStorage is unavailable (private/restricted windows). */
export const privateWindowStorage = new Map<number, Map<string, string>>();

function getTabStore(
	storage: Map<number, Map<string, string>>,
	tabId: number
): Map<string, string> {
	if (!storage.has(tabId)) {
		storage.set(tabId, new Map());
	}
	return storage.get(tabId)!;
}

type ScriptedWriteResult =
	| { success: true }
	| { success: false; errorName: string; error: string };
type ScriptedReadResult =
	| { success: true; value: string | null }
	| { success: false; errorName: string; error: string };

export async function handleApplyLS(
	tabId: number,
	key: string,
	value: string,
	storage: Map<number, Map<string, string>> = privateWindowStorage
): Promise<LSOpResult> {
	if (!browser.scripting) {
		return { success: false, error: "browser.scripting not available" };
	}

	try {
		const results = await browser.scripting.executeScript({
			args: [key, value] as [string, string],
			func: (k: string, v: string): ScriptedWriteResult => {
				try {
					localStorage.setItem(k, v);
					return { success: true };
				} catch (e) {
					const err = e as Error;
					return { success: false, errorName: err.name, error: err.message };
				}
			},
			target: { tabId },
			world: "MAIN",
		});

		const result = results[0]?.result as ScriptedWriteResult | undefined;
		if (result && !result.success) {
			if (isStorageUnavailableError(result.errorName)) {
				getTabStore(storage, tabId).set(key, value);
				return { success: true };
			}
			return buildScriptErrorResponse(
				new Error(result.error),
				tabId,
				"APPLY_LS",
				result.errorName
			);
		}

		return { success: true };
	} catch (error) {
		return buildScriptErrorResponse(error as Error, tabId, "APPLY_LS");
	}
}

export async function handleRemoveLS(
	tabId: number,
	key: string,
	storage: Map<number, Map<string, string>> = privateWindowStorage
): Promise<LSOpResult> {
	if (!browser.scripting) {
		return { success: false, error: "browser.scripting not available" };
	}

	try {
		const results = await browser.scripting.executeScript({
			args: [key] as [string],
			func: (k: string): ScriptedWriteResult => {
				try {
					localStorage.removeItem(k);
					return { success: true };
				} catch (e) {
					const err = e as Error;
					return { success: false, errorName: err.name, error: err.message };
				}
			},
			target: { tabId },
			world: "MAIN",
		});

		const result = results[0]?.result as ScriptedWriteResult | undefined;
		if (result && !result.success) {
			if (isStorageUnavailableError(result.errorName)) {
				storage.get(tabId)?.delete(key);
				return { success: true };
			}
			return buildScriptErrorResponse(
				new Error(result.error),
				tabId,
				"REMOVE_LS",
				result.errorName
			);
		}

		return { success: true };
	} catch (error) {
		return buildScriptErrorResponse(error as Error, tabId, "REMOVE_LS");
	}
}

export async function handleGetLS(
	tabId: number,
	key: string,
	storage: Map<number, Map<string, string>> = privateWindowStorage
): Promise<LSOpResult> {
	if (!browser.scripting) {
		return { success: false, error: "browser.scripting not available" };
	}

	try {
		const results = await browser.scripting.executeScript({
			args: [key] as [string],
			func: (k: string): ScriptedReadResult => {
				try {
					return { success: true, value: localStorage.getItem(k) };
				} catch (e) {
					const err = e as Error;
					return { success: false, errorName: err.name, error: err.message };
				}
			},
			target: { tabId },
			world: "MAIN",
		});

		const result = results[0]?.result as ScriptedReadResult | undefined;
		if (result && !result.success) {
			if (isStorageUnavailableError(result.errorName)) {
				const memValue = storage.get(tabId)?.get(key) ?? null;
				return { success: true, value: memValue };
			}
			return buildScriptErrorResponse(
				new Error(result.error),
				tabId,
				"GET_LS",
				result.errorName
			);
		}

		return { success: true, value: result?.value ?? null };
	} catch (error) {
		return buildScriptErrorResponse(error as Error, tabId, "GET_LS");
	}
}

export default defineBackground(() => {
	browser.runtime?.onInstalled.addListener(async () => {
		console.log("Extension installed");
		logBrowserInfo();
		await initDisplayMode();

		const popup = await browser.action?.getPopup({});
		console.log("[Background] Current popup after init:", popup);
	});

	browser.runtime?.onStartup.addListener(async () => {
		logBrowserInfo();
		await initDisplayMode();

		const popup = await browser.action?.getPopup({});
		console.log("[Background] Current popup after init:", popup);
	});

	// Chrome extension message listeners must return true to indicate async response handling
	// eslint-disable-next-line sonarjs/no-invariant-returns
	browser.runtime?.onMessage.addListener((msg, _sender, sendResponse) => {
		console.log(`[Background] Received message:`, JSON.stringify(msg));

		if (msg.type === "APPLY_LS") {
			const { tabId, key, value } = msg;
			handleApplyLS(tabId, key, value).then(sendResponse);
			return true;
		}

		if (msg.type === "REMOVE_LS") {
			const { tabId, key } = msg;
			handleRemoveLS(tabId, key).then(sendResponse);
			return true;
		}

		if (msg.type === "GET_LS") {
			const { tabId, key } = msg;
			handleGetLS(tabId, key).then(sendResponse);
			return true;
		}

		sendResponse({ msg, success: true });
		return true;
	});

	browser.storage?.onChanged.addListener((changes, areaName) => {
		console.log("[Background] Storage changed:", areaName, changes);
		if (areaName === "sync" && changes.displayMode) {
			console.log(
				"[Background] Display mode changed:",
				changes.displayMode.oldValue,
				"->",
				changes.displayMode.newValue
			);
			initDisplayMode();
		}
	});

	browser.tabs?.onRemoved.addListener(async (tabId, _removeInfo) => {
		console.log("[Background] Tab closed, cleaning up preset state:", tabId);
		privateWindowStorage.delete(tabId);
		try {
			await cleanupTabState(tabId);
		} catch (error) {
			console.error("[Background] Failed to cleanup tab state:", error);
		}
	});
});
