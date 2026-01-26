import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/recommended";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
	{
		ignores: [
			"build-output",
			"node_modules",
			"coverage",
			".wxt",
			"dist",
			"playwright-report",
			"test-results",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	jsxA11y.flatConfigs.recommended,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["src/**/*.{ts,tsx}"],
		...solid,
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.webextensions,
			},
		},
	},
	{
		files: ["**/*.test.ts", "**/*.spec.ts", "src/test/**/*"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		files: ["scripts/**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	eslintConfigPrettier
);
