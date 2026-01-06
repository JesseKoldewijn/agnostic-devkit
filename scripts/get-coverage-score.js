import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

function getCoverageScore(type) {
	const coverageDir = resolve(projectRoot, `coverage/${type}`);
	const summaryFile = resolve(coverageDir, "coverage-summary.json");

	if (!existsSync(summaryFile)) {
		return null;
	}

	try {
		const summary = JSON.parse(readFileSync(summaryFile, "utf8"));

		// Handle different summary formats
		// Vitest format: { total: { lines: { pct: ... } } }
		// Monocart format: { total: { lines: { pct: ... } } }
		if (summary.total?.lines && typeof summary.total.lines.pct === "number") {
			return Math.round(summary.total.lines.pct);
		}

		// Fallback: try to find any coverage percentage
		if (summary.total) {
			const totals = summary.total;
			if (totals.lines?.pct !== undefined) {
				return Math.round(totals.lines.pct);
			}
			if (totals.statements?.pct !== undefined) {
				return Math.round(totals.statements.pct);
			}
			if (totals.branches?.pct !== undefined) {
				return Math.round(totals.branches.pct);
			}
			if (totals.functions?.pct !== undefined) {
				return Math.round(totals.functions.pct);
			}
		}

		return null;
	} catch (error) {
		console.error(`Error reading coverage summary for ${type}:`, error.message);
		return null;
	}
}

const type = process.argv[2];
if (!type || !["vitest", "playwright"].includes(type)) {
	console.error("Usage: node scripts/get-coverage-score.js <vitest|playwright>");
	process.exit(1);
}

const score = getCoverageScore(type);
if (score === null) {
	console.error(`No coverage data found for ${type}`);
	process.exit(1);
}

console.log(score);
process.exit(0);
