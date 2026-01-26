import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/recommended";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

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
	betterTailwindcss.configs.recommended,
	{
		settings: {
			"better-tailwindcss": {
				entryPoint: "src/styles/main.css",
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			// Disable class order since Prettier handles it via prettier-plugin-tailwindcss
			"better-tailwindcss/enforce-consistent-class-order": "off",
			// Disable line wrapping since we prefer single-line classes
			"better-tailwindcss/enforce-consistent-line-wrapping": "off",
			// Disable canonical-classes as it overlaps with other rules
			"better-tailwindcss/enforce-canonical-classes": "off",
			// Disable no-unknown-classes as it has false positives with object keys
			"better-tailwindcss/no-unknown-classes": "off",
			// Enable canonical important position (suffix ! instead of prefix !)
			"better-tailwindcss/enforce-consistent-important-position": "warn",
			// Enable shorthand classes
			"better-tailwindcss/enforce-shorthand-classes": "warn",
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
