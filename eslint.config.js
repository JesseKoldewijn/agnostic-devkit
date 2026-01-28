import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import jsxA11y from "eslint-plugin-jsx-a11y";
import solid from "eslint-plugin-solid/configs/recommended";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config for the project.
 * Uses ESLint's defineConfig() for type-safe configuration.
 *
 * Config order matters - later configs override earlier ones.
 * eslint-config-prettier MUST be last to disable rules that conflict with Prettier.
 */
export default defineConfig(
	// Global ignores - applied to all files
	{
		ignores: [
			"build-output/**",
			"node_modules/**",
			"coverage/**",
			".wxt/**",
			"dist/**",
			"playwright-report/**",
			"test-results/**",
		],
	},

	// Base JavaScript rules
	js.configs.recommended,

	// TypeScript rules
	tseslint.configs.recommended,

	// Accessibility rules for JSX
	jsxA11y.flatConfigs.recommended,

	// Tailwind CSS rules
	betterTailwindcss.configs.recommended,
	{
		settings: {
			"better-tailwindcss": {
				entryPoint: "src/styles/main.css",
			},
		},
		rules: {
			// Disable class order - Prettier handles it via prettier-plugin-tailwindcss
			"better-tailwindcss/enforce-consistent-class-order": "off",
			// Disable line wrapping - prefer single-line classes
			"better-tailwindcss/enforce-consistent-line-wrapping": "off",
			// Disable canonical-classes - overlaps with other rules
			"better-tailwindcss/enforce-canonical-classes": "off",
			// Disable no-unknown-classes - false positives with object keys
			"better-tailwindcss/no-unknown-classes": "off",
			// Enable canonical important position (suffix ! instead of prefix !)
			"better-tailwindcss/enforce-consistent-important-position": "warn",
			// Enable shorthand classes (e.g., size-full instead of w-full h-full)
			"better-tailwindcss/enforce-shorthand-classes": "warn",
		},
	},

	// TypeScript-specific rules
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

	// SolidJS rules for source files
	{
		files: ["src/**/*.{ts,tsx}"],
		...solid,
		languageOptions: {
			...solid.languageOptions,
			globals: {
				...globals.browser,
				...globals.webextensions,
			},
		},
	},

	// Test files - relax some rules
	{
		files: ["**/*.test.ts", "**/*.spec.ts", "src/test/**/*"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},

	// Node.js scripts
	{
		files: ["scripts/**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	// Prettier - MUST be last to disable conflicting rules
	eslintConfigPrettier
);
