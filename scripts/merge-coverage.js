import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const coverageDir = resolve(projectRoot, "coverage");
const vitestSummary = resolve(coverageDir, "vitest/coverage-summary.json");
const playwrightSummary = resolve(coverageDir, "playwright/coverage-summary.json");
const outputDir = resolve(coverageDir, "combined");

function mergeSummaries(s1, s2) {
	const result = {
		total: {
			lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
			statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
			functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
			branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
		}
	};

	const types = ["lines", "statements", "functions", "branches"];
	
	for (const type of types) {
		const t1 = s1.total[type] || { total: 0, covered: 0 };
		const t2 = s2.total[type] || { total: 0, covered: 0 };
		
		result.total[type].total = t1.total + t2.total;
		result.total[type].covered = t1.covered + t2.covered;
		
		if (result.total[type].total > 0) {
			result.total[type].pct = Math.round((result.total[type].covered / result.total[type].total) * 100 * 100) / 100;
		}
	}
	
	return result;
}

async function mergeCoverage() {
	console.log("Merging coverage summaries...");

	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	let s1 = null;
	let s2 = null;

	if (existsSync(vitestSummary)) {
		try {
			s1 = JSON.parse(readFileSync(vitestSummary, "utf-8"));
			console.log("✅ Loaded Vitest summary");
		} catch (e) {
			console.warn("Warning: Could not read Vitest summary");
		}
	}

	if (existsSync(playwrightSummary)) {
		try {
			s2 = JSON.parse(readFileSync(playwrightSummary, "utf-8"));
			console.log("✅ Loaded Playwright summary");
		} catch (e) {
			console.warn("Warning: Could not read Playwright summary");
		}
	}

	if (s1 && s2) {
		const combined = mergeSummaries(s1, s2);
		writeFileSync(
			resolve(outputDir, "coverage-summary.json"),
			JSON.stringify(combined, null, 2)
		);
		console.log("\n✅ Combined coverage summary generated!");
		console.log(`📊 Combined Total Coverage: ${Math.round(combined.total.lines.pct)}%`);
	} else if (s1 || s2) {
		const combined = s1 || s2;
		writeFileSync(
			resolve(outputDir, "coverage-summary.json"),
			JSON.stringify(combined, null, 2)
		);
		console.log("\n✅ Using single available coverage summary as combined");
		console.log(`📊 Combined Total Coverage: ${Math.round(combined.total.lines.pct)}%`);
	} else {
		console.error("❌ No coverage summaries found to merge.");
		process.exit(1);
	}
}

mergeCoverage().catch((error) => {
	console.error("Error merging coverage:", error);
	process.exit(1);
});
