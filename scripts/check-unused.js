import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

console.log("🔍 Checking for unused code...\n");

try {
	execSync("npx knip", {
		cwd: projectRoot,
		stdio: "inherit",
	});
	console.log("\n✅ No unused code detected!");
} catch (error) {
	// knip exits with code 1 when it finds issues
	console.log("\n⚠️  Unused code detected. Review the items above.");
	process.exit(1);
}

