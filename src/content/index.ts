chrome.runtime?.onInstalled?.addListener(() => {
	try {
		// Example: Send a message to the background script
		chrome.runtime?.sendMessage(
			{ type: "CONTENT_LOADED" },
			(response: any) => {
				console.debug("Response from background:", response);
			}
		);

		// Example: Listen for messages from the popup or background
		chrome.runtime?.onMessage.addListener(
			(
				message: any,
				_sender: any,
				sendResponse: (response?: any) => void
			) => {
				console.debug("Content script received message:", message);
				sendResponse({ received: true });

				return true as const;
			}
		);
	} catch (error) {
		console.error("Error in content script:", error);
	}
});

// Ensure that the background script gets remounted if inactive on startup
chrome.runtime?.onStartup?.addListener(() => {
	try {
		chrome.runtime?.sendMessage(
			{ type: "CONTENT_LOADED_ON_STARTUP" },
			(response: any) => {
				console.debug("Response from background on startup:", response);
			}
		);
	} catch (error) {
		console.error("Error on startup in content script:", error);
	}
});
