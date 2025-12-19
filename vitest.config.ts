import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		clearMocks: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "coverage/vitest",
		},
		environment: "happy-dom",
		exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/*.spec.ts"],
		globals: true,
		include: ["src/test/**/*.test.ts"],
		restoreMocks: true,
	},
});
