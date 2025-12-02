import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import MCR from "monocart-coverage-reports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const playwrightCoverageDir = resolve(projectRoot, "coverage/playwright");
const cacheDir = resolve(playwrightCoverageDir, ".cache");

// Check if Playwright coverage data exists
if (!existsSync(playwrightCoverageDir)) {
	console.warn(
		"No Playwright coverage directory found. Run tests with CI_COVERAGE=true first."
	);
	process.exit(0);
}

// Look for coverage files in both the main directory and .cache subdirectory
let coverageFiles = [];
const mainDirFiles = existsSync(playwrightCoverageDir)
	? readdirSync(playwrightCoverageDir)
			.filter((file) => file.endsWith(".json"))
			.map((file) => resolve(playwrightCoverageDir, file))
	: [];
const cacheDirFiles = existsSync(cacheDir)
	? readdirSync(cacheDir)
			.filter((file) => file.endsWith(".json"))
			.map((file) => resolve(cacheDir, file))
	: [];

coverageFiles = [...mainDirFiles, ...cacheDirFiles];

if (coverageFiles.length === 0) {
	console.warn(
		"No Playwright coverage files found. Run tests with CI_COVERAGE=true first."
	);
	process.exit(0);
}

console.log(
	`Generating Playwright coverage report from ${coverageFiles.length} file(s)...`
);

// Generate standalone Playwright coverage report
const coverageReport = new MCR({
	name: "Playwright E2E Coverage Report",
	outputDir: playwrightCoverageDir,
	reports: ["console-details", "html", "json", "json-summary", "lcov"],
	// Exclude test files and config files
	entryFilter: (entry) => {
		return (
			entry.url &&
			entry.url.includes("/src/") &&
			!entry.url.includes("/test/") &&
			!entry.url.includes(".config.")
		);
	},
	// Source filter for source files
	sourceFilter: (sourcePath) => {
		return (
			sourcePath.includes("/src/") &&
			!sourcePath.includes("/test/") &&
			!sourcePath.includes(".config.")
		);
	},
	// Handle summary-only coverage data
	onEnd: async (coverageData) => {
		// Ensure we have valid coverage data
		return coverageData;
	},
});

// Check if files have full coverage maps before trying to add them
function hasFullCoverage(coverageObj) {
	if (!coverageObj || typeof coverageObj !== "object") return false;
	// Check if any file entry has statementMap (indicates full coverage)
	for (const key in coverageObj) {
		if (key !== "total" && coverageObj[key]?.statementMap) {
			return true;
		}
	}
	return false;
}

// Add all coverage files
// Note: Files in .cache are summary-only and can't be used directly with monocart
// We'll skip them and only process files with full coverage maps
const processedFiles = [];
const validCoverageData = [];

for (const filePath of coverageFiles) {
	try {
		const fileContent = readFileSync(filePath, "utf-8");
		const data = JSON.parse(fileContent);
		
		let coverageDataToAdd = null;
		
		if (data.type === "istanbul" && data.data) {
			// Check if this has full coverage maps
			if (hasFullCoverage(data.data)) {
				coverageDataToAdd = data.data;
			}
		} else if (data.data && typeof data.data === "object") {
			if (hasFullCoverage(data.data)) {
				coverageDataToAdd = data.data;
			}
		} else if (hasFullCoverage(data)) {
			coverageDataToAdd = data;
		}
		
		if (coverageDataToAdd) {
			validCoverageData.push(coverageDataToAdd);
			processedFiles.push(filePath);
		}
	} catch (error) {
		console.warn(`Warning: Could not process ${filePath}:`, error.message);
	}
}

// Only use monocart if we have valid coverage data with full maps
if (validCoverageData.length > 0) {
	try {
		for (const coverageData of validCoverageData) {
			await coverageReport.add(coverageData);
		}
		await coverageReport.generate();
		console.log(`✅ Processed ${processedFiles.length} coverage file(s) with full coverage maps`);
	} catch (error) {
		console.warn("Error generating full coverage report:", error.message);
		console.warn("Falling back to summary-only report...");
		validCoverageData.length = 0; // Clear so we generate summary below
	}
}

if (validCoverageData.length === 0) {
	console.warn("No valid coverage files with full coverage maps found.");
	console.warn("Attempting to generate summary report from summary data...");
	
	// Try to generate a summary report from the summary data we have
	let mergedSummary = { total: { lines: {}, statements: {}, functions: {}, branches: {} } };
	let fileCount = 0;
	
	for (const filePath of coverageFiles) {
		try {
			const fileContent = readFileSync(filePath, "utf-8");
			const data = JSON.parse(fileContent);
			
			if (data.type === "istanbul" && data.data && data.data.total) {
				const total = data.data.total;
				// Merge totals (simple average for now)
				if (total.lines) {
					mergedSummary.total.lines = {
						total: (mergedSummary.total.lines.total || 0) + (total.lines.total || 0),
						covered: (mergedSummary.total.lines.covered || 0) + (total.lines.covered || 0),
						skipped: 0,
						pct: 0
					};
				}
				if (total.statements) {
					mergedSummary.total.statements = {
						total: (mergedSummary.total.statements.total || 0) + (total.statements.total || 0),
						covered: (mergedSummary.total.statements.covered || 0) + (total.statements.covered || 0),
						skipped: 0,
						pct: 0
					};
				}
				if (total.functions) {
					mergedSummary.total.functions = {
						total: (mergedSummary.total.functions.total || 0) + (total.functions.total || 0),
						covered: (mergedSummary.total.functions.covered || 0) + (total.functions.covered || 0),
						skipped: 0,
						pct: 0
					};
				}
				if (total.branches) {
					mergedSummary.total.branches = {
						total: (mergedSummary.total.branches.total || 0) + (total.branches.total || 0),
						covered: (mergedSummary.total.branches.covered || 0) + (total.branches.covered || 0),
						skipped: 0,
						pct: 0
					};
				}
				fileCount++;
			}
		} catch (error) {
			// Ignore errors
		}
	}
	
	if (fileCount > 0 && mergedSummary.total.lines.total) {
		// Calculate percentages
		mergedSummary.total.lines.pct = Math.round((mergedSummary.total.lines.covered / mergedSummary.total.lines.total) * 100 * 100) / 100;
		mergedSummary.total.statements.pct = Math.round((mergedSummary.total.statements.covered / mergedSummary.total.statements.total) * 100 * 100) / 100;
		mergedSummary.total.functions.pct = Math.round((mergedSummary.total.functions.covered / mergedSummary.total.functions.total) * 100 * 100) / 100;
		mergedSummary.total.branches.pct = Math.round((mergedSummary.total.branches.covered / mergedSummary.total.branches.total) * 100 * 100) / 100;
		
		// Write coverage-summary.json
		writeFileSync(
			resolve(playwrightCoverageDir, "coverage-summary.json"),
			JSON.stringify(mergedSummary, null, 2),
			"utf-8"
		);
		
		console.log(`✅ Generated coverage summary from ${fileCount} file(s)`);
		console.log(`📊 Coverage: ${mergedSummary.total.lines.pct}% lines`);
	} else {
		console.error("❌ Could not generate coverage summary");
		process.exit(1);
	}
}

// Reports are generated above if we have valid data

// Read and display coverage score
try {
	const summaryFile = resolve(playwrightCoverageDir, "coverage-summary.json");
	if (existsSync(summaryFile)) {
		const summary = JSON.parse(readFileSync(summaryFile, "utf-8"));
		const score = summary.total?.lines?.pct 
			? Math.round(summary.total.lines.pct)
			: summary.total?.statements?.pct
			? Math.round(summary.total.statements.pct)
			: null;
		
		if (score !== null) {
			console.log(`\n📊 E2E Coverage: ${score}%`);
		}
	}
} catch (error) {
	// Ignore errors reading summary
}

console.log(`\n✅ Playwright coverage report generated!`);
console.log(
	`📊 View the report at: ${resolve(playwrightCoverageDir, "index.html")}`
);
