import { showNotification } from "~/utils/browser";
import { ContextMenuItem } from "~/utils/contextMenu";

const cleanCopyUrl = (url: string) => {
	try {
		const isValidUrl = URL.canParse(url);
		if (!isValidUrl) {
			console.warn("Provided string is not a valid URL:", url);
			return "";
		}
		console.log("Cleaning URL:", url);
		const parsedUrl = new URL(url);
		return parsedUrl.origin + parsedUrl.pathname;
	} catch (error) {
		console.error("Invalid URL:", error);
		return url;
	}
};

export const cleanCopyUrlAction = () => {
	// This action can be used in context menus when right-clicking a link

	return {
		title: "Clean Copy URL",
		contexts: ["link", "selection"],
		action: async ({ selection, tab }) => {
			try {
				const cleanedUrl = cleanCopyUrl(selection ?? "");
				let finalUrl = cleanedUrl;

				// If the selection is not a valid URL, try to find a link in the page
				if (cleanedUrl === "") {
					const findLinkBySelectionIfNotLink = async (
						selection?: string
					) => {
						if (!selection) return null;

						const anchorElements = await chrome.scripting
							.executeScript({
								target: { tabId: tab?.id ?? 0 },
								func: (selection) => {
									const anchors =
										document.querySelectorAll("a") ?? [];
									for (const anchor of anchors) {
										if (
											anchor.href === selection ||
											anchor.innerText === selection
										) {
											return anchor.href;
										}
									}
								},
								args: [selection],
							})
							.then((x) => {
								if (x.length > 0) {
									return x[0].result;
								}
								return null;
							});

						console.warn("Anchor elements found:", anchorElements);

						if (anchorElements) {
							return anchorElements;
						}

						return null;
					};

					const resultByLinkText = await findLinkBySelectionIfNotLink(
						selection
					);
					if (resultByLinkText) {
						finalUrl = cleanCopyUrl(resultByLinkText);
					}
				}

				if (!finalUrl || finalUrl === "") {
					const message = {
						title: "Clean Copy URL",
						content: `No valid URL found to copy.`,
					};
					console.warn(message.title, message.content);
					showNotification(message.title, message.content, true);
					return;
				}

				console.debug("Attempting to copy cleaned URL in tab:", {
					cleanedUrl,
					tab,
				});
				const result = await chrome.scripting
					.executeScript({
						target: {
							tabId: tab.id ?? 0,
						},
						func: (url: string) => {
							navigator.clipboard.writeText(url).catch((err) => {
								console.error("Failed to copy text: ", err);
							});
						},
						args: [finalUrl],
						injectImmediately: true,
					})
					.then((x) => x[0].result);
				if (result !== undefined) {
					console.log(
						"Cleaned URL copied to clipboard in tab:",
						finalUrl
					);
					return;
				}
			} catch (err) {
				console.warn(
					"Error while copying cleaned URL to clipboard:",
					err
				);

				if (tab) {
					const message = {
						title: "Clean Copy URL",
						content: `An error occurred while copying the cleaned URL to the clipboard. \
							Possible cause: Clipboard API not available or current tab is not HTTP/HTTPS.`,
					};
					console.warn(message.title, message.content);
					showNotification(message.title, message.content, true);
				}

				return;
			}

			console.warn("Clipboard API not available. Cannot copy URL.");
		},
	} as const satisfies ContextMenuItem;
};
