export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_end",
	main() {
		try {
			// Example: Send a message to the background script
			browser.runtime?.sendMessage(
				{ type: "CONTENT_LOADED" },
				(response: any) => {
					console.debug("Response from background:", response);
				}
			);

			// Example: Listen for messages from the popup or background
			browser.runtime?.onMessage.addListener(
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
	},
});

