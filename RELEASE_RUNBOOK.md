# SKR ASTRO / ASTROVERSE — Release Verification & Execution Runbook

**Document Date:** 14 October 2026  
**Target Release:** 3.0.0 (Production Candidate)  
**Distribution Archive:** `ASTRO.zip`  

---

## 1. Quick Start for Clean Archive Audits

When extracting `ASTRO.zip` into a clean environment, **`node_modules` is intentionally not bundled** (in compliance with Release Packaging Gate 12). Before running tests or launching services, install the exact pinned dependencies using the committed lockfiles.

### Step 1: Clean Dependency Installation
```bash
# In repository root:
npm ci --prefix backend
npm ci --prefix frontend
```

### Step 2: Production Build
```bash
npm run build --prefix frontend
```
*Verification:* Checks that `frontend/dist/index.html` is generated cleanly with zero errors.

---

## 2. Running Test Suites

Once dependencies are installed, all test suites execute with zero failures:

### 2.1 Backend Regression Suite (139 security, privacy, and continuous-learning checks)
```bash
npm test --prefix backend
```

### 2.2 Release Certification Gate (17-point cryptographic audit)
```bash
node frontend/test_release_certification_gate.mjs
```
*Expected Output:*
```text
Summary: 17 passed, 0 failed
RELEASE_CERTIFIED = true
```

### 2.3 Release Manifest & PII Verification
```bash
node frontend/test_current_release_manifest.mjs
node backend/test/test_no_pii_in_release.mjs
```

### 2.4 Empirical Benchmark Reconciliation & Cross-Cohort Firewall
```bash
node frontend/test_benchmark_metrics_reconciliation.mjs
```

### 2.5 Universal Q&A Benchmark (5,000 frozen questions)
```bash
node frontend/test_universal_qa_benchmark.mjs
```

---

## 3. Local AI Runtime Setup & Verification

SKR ASTRO is a local-AI-first application designed to operate with zero cloud dependencies.

### 3.1 Supported Model Architecture
- **Primary Model:** `qwen2.5:1.5b-instruct` (Context: 8,192 tokens, recommended RAM: 2 GB)
- **Fallback Model:** `qwen2.5:0.5b-instruct` (Context: 4,096 tokens, recommended RAM: 1 GB)
- **Benchmark Model:** `tinyllama:1.1b-chat` (Controlled benchmarking only)

### 3.2 Setting Up the Local Runtime (Ollama)
1. Install [Ollama](https://ollama.com/) (version 0.40.2+).
2. Pull the recommended primary and fallback models:
```bash
ollama pull qwen2.5:1.5b
ollama pull qwen2.5:0.5b
```
3. Create the standard instruct aliases:
```bash
ollama cp qwen2.5:1.5b qwen2.5:1.5b-instruct
ollama cp qwen2.5:0.5b qwen2.5:0.5b-instruct
```

### 3.3 Verifying Local Inference Status
Run the diagnostic helper:
```bash
node scripts/setup_local_ai.mjs
```
*When Ollama is running and models are installed:*
```text
[4] Local Runtime Health & Model Installation Check:
    ✓ Status: ONLINE (ONLINE)
    ✓ Primary Configured: qwen2.5:1.5b-instruct -> Installed: YES
    ✓ Effective Active Model: qwen2.5:1.5b-instruct

[5] Question Parsing Pipeline Test:
    ✓ Result: LOCAL_MODEL_SUCCESS
```

*When Ollama is stopped or uninstalled:*
```text
[4] Local Runtime Health & Model Installation Check:
    ✓ Status: OFFLINE (CONNECTION_REFUSED)
    ✓ System will operate in DETERMINISTIC_FALLBACK mode (zero cloud dependency).
```

### 3.4 Live Latency & Memory Benchmarks
To run live inference benchmarks across English and Tamil questions:
```bash
node backend/test/test_live_inference_benchmarks.mjs
```
*Empirical Benchmarks on Reference System:*
- `qwen2.5:1.5b-instruct` Question Parsing: **~530 ms avg latency**, **~59.8 MB Node RSS**
- `qwen2.5:0.5b-instruct` Question Parsing: **~313 ms avg latency**
- Offline Deterministic Fallback: **~18 ms latency**

---

## 4. Troubleshooting: "BLOCKED" Test Execution

If any test command outputs:
```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'astronomy-engine'
```
or
```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```
**Cause:** The test was executed in an uninstalled distribution directory before `npm ci` was run.  
**Resolution:** Run `npm ci --prefix backend` and `npm ci --prefix frontend` from the repository root.
