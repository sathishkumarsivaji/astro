/**
 * Generate the certification evidence bound to the clean final archive.
 *
 * The report is export-ignored so adding it after archive creation cannot
 * change the archive hash it records.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = path.join(ROOT, "release_certification_report.json");
const ARCHIVE_PATH = path.join(ROOT, "ASTRO.zip");

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function run(command, cwd = ROOT) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  return {
    command: command.join(" "),
    cwd: path.relative(ROOT, cwd) || ".",
    exitCode: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

const packageManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "current_release_manifest.json"), "utf8"));
const commands = [
  ["npm", "ci", "--no-audit", "--prefer-offline"],
  ["npm", "run", "lint"],
  ["npm", "run", "build"],
  ["node", "frontend/test_release_certification_gate.mjs"],
  ["npm", "run", "test:stage5"]
];
const commandResults = [];
for (const command of commands) {
  const cwd = command[0] === "npm" && command[1] === "run" && command[2] === "test:stage5"
    ? path.join(ROOT, "backend")
    : command[0] === "npm"
      ? path.join(ROOT, "frontend")
      : ROOT;
  commandResults.push(run(command, cwd));
}

execSync(`python "${path.join(ROOT, "scripts/create_deterministic_archive.py")}" ASTRO.zip`, { cwd: ROOT, stdio: "ignore" });
const archiveHash = sha256File(ARCHIVE_PATH);
const gate = commandResults.find(result => result.command.includes("test_release_certification_gate"));
const stage5 = commandResults.find(result => result.command.includes("test:stage5"));

const report = {
  reportVersion: "RELEASE_CERTIFICATION_REPORT_V1",
  releaseVersion: packageManifest.version,
  manifestReleaseVersion: manifest.releaseVersion,
  versionConsistency: packageManifest.version === manifest.releaseVersion ? "PASS" : "FAIL",
  generatedAt: new Date().toISOString(),
  archive: {
    file: "ASTRO.zip",
    sha256: archiveHash,
    bytes: fs.statSync(ARCHIVE_PATH).size,
    policy: "git archive of HEAD; report and archive export-ignored"
  },
  sourceHashes: manifest.authoritativeHashes,
  datasetHashes: manifest.datasetHashes,
  commands: commandResults,
  releaseGate: {
    status: gate?.exitCode === 0 ? "PASS" : "FAIL",
    exitCode: gate?.exitCode ?? null
  },
  stage5: {
    status: stage5?.exitCode === 0 ? "PASS_OR_BLOCKED_WITH_AUDIT" : "FAIL",
    exitCode: stage5?.exitCode ?? null,
    note: "A blocked empirical evaluation is not a prediction improvement."
  },
  finalStatus: (
    packageManifest.version === manifest.releaseVersion &&
    gate?.exitCode === 0 &&
    stage5?.exitCode === 0
  ) ? "CERTIFIED_SOFTWARE_ARTIFACT" : "NOT_CERTIFIED"
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  finalStatus: report.finalStatus,
  archiveSha256: archiveHash,
  releaseGate: report.releaseGate,
  stage5: report.stage5,
  report: path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/")
}, null, 2));

if (report.finalStatus !== "CERTIFIED_SOFTWARE_ARTIFACT") {
  process.exitCode = 1;
}
