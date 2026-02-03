import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	plugins: [tsconfigPaths(), WxtVitest(), solidPlugin()],
	test: {
		clearMocks: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "coverage/vitest",
		},
		environment: "jsdom",
		exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/*.spec.ts"],
		globals: true,
		include: ["test/unit/**/*.test.{ts,tsx}", "test/integration/**/*.test.{ts,tsx}"],
		restoreMocks: true,
		setupFiles: ["./test/core/setup.ts"],
	},
});
