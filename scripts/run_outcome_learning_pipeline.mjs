import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import {
  buildOutcomeLearningReport,
  trainAndEvaluateCandidate
} from "../frontend/src/services/outcomeLearningPipeline.js";

const ROOT = resolve(import.meta.dirname || ".", "..");
const SPLITS = join(ROOT, "data", "real_world_validation", "splits");
const OUTPUT = join(ROOT, "data", "real_world_validation", "results", "outcome_learning_report.json");

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function load(name) {
  const path = join(SPLITS, name);
  return { path, records: JSON.parse(readFileSync(path, "utf8")) };
}

const train = load("train.json");
const validation = load("val.json");
const blind = load("blind_test.json");
const result = trainAndEvaluateCandidate({
  TRAIN: train.records,
  VALIDATION: validation.records,
  BLIND_TEST: blind.records
});
const report = buildOutcomeLearningReport(result, {
  sourceHash: hashFile(join(ROOT, "frontend", "src", "services", "outcomeLearningPipeline.js")),
  datasetHash: hashFile(train.path) + hashFile(validation.path) + hashFile(blind.path)
});
writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  status: report.status,
  reason: report.reason,
  output: OUTPUT,
  train: result.prepared?.TRAIN?.rows?.length ?? 0,
  validation: result.prepared?.VALIDATION?.rows?.length ?? 0,
  blindTest: result.prepared?.BLIND_TEST?.rows?.length ?? 0
}, null, 2));
