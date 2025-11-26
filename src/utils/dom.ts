/**
 * Helper function to create isolated extension UI elements
 * Wraps elements in a scoped container to prevent CSS leakage
 */
export function createIsolatedElement() {
	const container = document.createElement("div");
	container.className = "chrome-extension-root";

	return container.attachShadow({ mode: "open" });
}
