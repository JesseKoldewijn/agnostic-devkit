import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const BUILD_CONFIGS = {
	chrome: {
		name: "Chrome (MV3)",
		path: "build-output/chrome-mv3",
		// web-ext is Firefox-focused, so we use basic validation for Chrome
		useWebExt: false,
	},
	firefox: {
		name: "Firefox (MV2)",
		path: "build-output/firefox-mv2",
		useWebExt: true,
	},
};

/**
 * Parse CLI arguments for --browser flag
 * @returns {string | null} Browser name or null for all browsers
 */
function parseBrowserArg() {
	const args = process.argv.slice(2);
	const browserIndex = args.indexOf("--browser");

	if (browserIndex === -1) {
		return null;
	}

	const browser = args[browserIndex + 1];
	if (!browser || !Object.keys(BUILD_CONFIGS).includes(browser)) {
		console.error(`❌ Invalid browser: ${browser}`);
		console.error(`   Valid options: ${Object.keys(BUILD_CONFIGS).join(", ")}`);
		process.exit(1);
	}

	return browser;
}

/**
 * Check if a build directory exists and contains files
 * @param {string} buildPath - Path to the build directory
 * @returns {boolean}
 */
function validateBuildExists(buildPath) {
	if (!existsSync(buildPath)) {
		return false;
	}

	const files = readdirSync(buildPath);
	return files.length > 0 && files.includes("manifest.json");
}

/**
 * Validate Chrome extension build (basic manifest and structure validation)
 * Since web-ext is Firefox-focused, we do basic validation for Chrome
 * @param {string} name - Display name for the build
 * @param {string} buildPath - Path to the build directory
 * @returns {{ success: boolean, errors: number, warnings: number, messages: Array<{type: string, message: string}> }}
 */
function validateChromeBuild(name, buildPath) {
	console.log(`\n🔍 Validating ${name}...`);
	console.log(`   Path: ${buildPath}`);

	const messages = [];
	let errors = 0;
	let warnings = 0;

	try {
		const manifestPath = resolve(buildPath, "manifest.json");
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

		// Check manifest version
		if (manifest.manifest_version !== 3) {
			messages.push({
				message: `Expected manifest_version 3, got ${manifest.manifest_version}`,
				type: "error",
			});
			errors++;
		}

		// Check required fields
		const requiredFields = ["name", "version", "manifest_version"];
		for (const field of requiredFields) {
			if (!manifest[field]) {
				messages.push({ message: `Missing required field: ${field}`, type: "error" });
				errors++;
			}
		}

		// Check for background service worker (MV3)
		if (!manifest.background?.service_worker) {
			messages.push({
				message: "Missing background.service_worker (required for MV3)",
				type: "error",
			});
			errors++;
		}

		// Check background.js exists
		if (!existsSync(resolve(buildPath, "background.js"))) {
			messages.push({ message: "Missing background.js file", type: "error" });
			errors++;
		}

		// Check for action (MV3 uses 'action' instead of 'browser_action')
		if (!manifest.action && !manifest.browser_action) {
			messages.push({ message: "Missing action or browser_action", type: "warning" });
			warnings++;
		}

		// Check icons exist
		if (manifest.icons) {
			for (const [size, iconPath] of Object.entries(manifest.icons)) {
				// Remove leading slash if present (manifest paths can be absolute or relative)
				const relativePath = iconPath.startsWith("/") ? iconPath.slice(1) : iconPath;
				const fullPath = resolve(buildPath, relativePath);
				if (!existsSync(fullPath)) {
					messages.push({ message: `Missing icon file: ${iconPath} (${size}px)`, type: "warning" });
					warnings++;
				}
			}
		}

		// Check HTML entry points exist
		const htmlFiles = ["popup.html", "settings.html", "sidepanel.html"];
		for (const file of htmlFiles) {
			if (!existsSync(resolve(buildPath, file))) {
				messages.push({ message: `Missing expected file: ${file}`, type: "warning" });
				warnings++;
			}
		}

		return { errors, messages, success: errors === 0, warnings };
	} catch (error) {
		messages.push({ message: `Failed to validate: ${error.message}`, type: "error" });
		return { errors: 1, messages, success: false, warnings: 0 };
	}
}

/**
 * Run web-ext lint on a build directory (Firefox)
 * @param {string} name - Display name for the build
 * @param {string} buildPath - Path to the build directory
 * @returns {{ success: boolean, errors: number, warnings: number, output: string }}
 */
function runWebExtLint(name, buildPath) {
	console.log(`\n🔍 Validating ${name}...`);
	console.log(`   Path: ${buildPath}`);

	try {
		const output = execSync(`npx web-ext lint --source-dir "${buildPath}" --output=json`, {
			cwd: projectRoot,
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		const result = JSON.parse(output);
		return {
			errors: result.errors?.length ?? 0,
			output,
			success: true,
			warnings: result.warnings?.length ?? 0,
		};
	} catch (error) {
		// web-ext exits with code 1 when there are errors
		// but the output is still valid JSON
		const stdout = error.stdout?.toString() ?? "";
		const stderr = error.stderr?.toString() ?? "";

		try {
			const result = JSON.parse(stdout || stderr);
			return {
				errors: result.errors?.length ?? 0,
				output: stdout || stderr,
				success: false,
				warnings: result.warnings?.length ?? 0,
			};
		} catch {
			// If we can't parse the output, return the raw error
			return {
				errors: 1,
				output: stderr || stdout || error.message,
				success: false,
				warnings: 0,
			};
		}
	}
}

/**
 * Format and display validation results for Chrome builds
 * @param {string} name - Display name for the build
 * @param {{ success: boolean, errors: number, warnings: number, messages: Array<{type: string, message: string}> }} result
 */
function displayChromeResults(name, result) {
	const errorMessages = result.messages.filter((m) => m.type === "error");
	const warningMessages = result.messages.filter((m) => m.type === "warning");

	if (errorMessages.length > 0) {
		console.log(`\n   ❌ Errors (${errorMessages.length}):`);
		for (const error of errorMessages) {
			console.log(`      • ${error.message}`);
		}
	}

	if (warningMessages.length > 0) {
		console.log(`\n   ⚠️  Warnings (${warningMessages.length}):`);
		for (const warning of warningMessages) {
			console.log(`      • ${warning.message}`);
		}
	}

	if (result.errors === 0 && result.warnings === 0) {
		console.log(`   ✅ ${name}: No issues found`);
	} else if (result.errors === 0) {
		console.log(`   ✅ ${name}: Passed with ${result.warnings} warning(s)`);
	} else {
		console.log(`   ❌ ${name}: Failed with ${result.errors} error(s)`);
	}
}

/**
 * Format and display validation results for Firefox builds (web-ext output)
 * @param {string} name - Display name for the build
 * @param {{ success: boolean, errors: number, warnings: number, output: string }} result
 */
function displayResults(name, result) {
	try {
		const parsed = JSON.parse(result.output);

		if (parsed.errors?.length > 0) {
			console.log(`\n   ❌ Errors (${parsed.errors.length}):`);
			for (const error of parsed.errors) {
				console.log(`      • ${error.message}`);
				if (error.file) {
					console.log(`        File: ${error.file}${error.line ? `:${error.line}` : ""}`);
				}
			}
		}

		if (parsed.warnings?.length > 0) {
			console.log(`\n   ⚠️  Warnings (${parsed.warnings.length}):`);
			for (const warning of parsed.warnings) {
				console.log(`      • ${warning.message}`);
				if (warning.file) {
					console.log(`        File: ${warning.file}${warning.line ? `:${warning.line}` : ""}`);
				}
			}
		}

		if (result.errors === 0 && result.warnings === 0) {
			console.log(`   ✅ ${name}: No issues found`);
		} else if (result.errors === 0) {
			console.log(`   ✅ ${name}: Passed with ${result.warnings} warning(s)`);
		} else {
			console.log(`   ❌ ${name}: Failed with ${result.errors} error(s)`);
		}
	} catch {
		// If output isn't JSON, display raw
		console.log(`   Output: ${result.output}`);
	}
}

// Main execution
console.log("🧪 Build Validation Script");
console.log("==========================");

const selectedBrowser = parseBrowserArg();
const browsersToValidate = selectedBrowser ? [selectedBrowser] : Object.keys(BUILD_CONFIGS);

let totalErrors = 0;
let totalWarnings = 0;
let missingBuilds = [];

for (const browser of browsersToValidate) {
	const config = BUILD_CONFIGS[browser];
	const buildPath = resolve(projectRoot, config.path);

	if (!validateBuildExists(buildPath)) {
		console.log(`\n⚠️  ${config.name}: Build not found at ${config.path}`);
		console.log(`   Run 'yarn build:${browser}' first to create the build.`);
		missingBuilds.push(browser);
		continue;
	}

	let result;
	if (config.useWebExt) {
		result = runWebExtLint(config.name, buildPath);
		displayResults(config.name, result);
	} else {
		result = validateChromeBuild(config.name, buildPath);
		displayChromeResults(config.name, result);
	}

	totalErrors += result.errors;
	totalWarnings += result.warnings;
}

// Summary
console.log("\n==========================");
console.log("📊 Summary");

if (missingBuilds.length > 0) {
	console.log(`   ⚠️  Missing builds: ${missingBuilds.join(", ")}`);
}

if (totalErrors > 0) {
	console.log(`   ❌ Total errors: ${totalErrors}`);
	console.log(`   ⚠️  Total warnings: ${totalWarnings}`);
	console.log("\n❌ Build validation failed!");
	process.exit(1);
} else if (missingBuilds.length === browsersToValidate.length) {
	console.log("\n❌ No builds found to validate!");
	console.log("   Run 'yarn build:all' to create builds first.");
	process.exit(1);
} else {
	console.log(`   ✅ All validated builds passed`);
	if (totalWarnings > 0) {
		console.log(`   ⚠️  Total warnings: ${totalWarnings}`);
	}
	console.log("\n✅ Build validation successful!");
}
