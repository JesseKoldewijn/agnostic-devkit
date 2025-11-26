async function globalTeardown() {
	// Clean up global browser and context
	if (global.__extensionContext) {
		await global.__extensionContext.close();
	}
	if (global.__extensionBrowser) {
		await global.__extensionBrowser.close();
	}
	console.log("Extension browser and context cleaned up");
}

export default globalTeardown;
