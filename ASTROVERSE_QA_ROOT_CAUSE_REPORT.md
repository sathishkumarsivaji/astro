# ASTROVERSE — Question-and-Answer Engine Forensic Root Cause Audit

**Audit Date:** 12 October 2026  
**Audited System:** ASTROVERSE Production Q&A Pipeline  
**Target Release:** 3.0.0 / Model 2.2.0  
**Status:** FORENSIC REMEDIATION IN PROGRESS  

---

## 1. Executive Summary

This forensic investigation audited the Question-and-Answer (Q&A) pipeline across `AskAstroVerseView.jsx`, `FollowUpQuestions.jsx`, `followUpAnswerService.js`, and `frontend/src/services/questionAnswer/*`. 

Prior to this audit, users asking analytical, specific, or timing questions encountered:
1. **Generic Blueprint Clichés:** Answers defaulted to repeating the native's Ascendant and Moon sign (e.g. *"Your Ascendant (Lagna) is Sagittarius, with primary planetary dispositors defining the energetic framework for this inquiry..."* / *"உங்கள் ஜாதக அமைப்பின்படி லக்னம்..."*).
2. **Generic Dasha Fillers:** Irrelevant operating cycle claims (e.g. repeated Moon Mahadasha–Venus Bhukti or generic favorable houses).
3. **Manufactured/Placeholder Timing Windows:** Empty timing arrays were replaced by the uncalculated placeholder `"Favorable Dasha-Transit Window"` / `"தசா-கோச்சார சுப பார்வை காலம்"`.
4. **Architectural Disconnection:** The production UI component `FollowUpQuestions.jsx` called `answerFollowUpQuestion()` in `followUpAnswerService.js`. When running in deterministic/offline fallback mode, `followUpAnswerService.js` executed an ad-hoc regex switch (`generateDeterministicAnswer`), completely bypassing the rigorous 13-stage `processEvidenceLinkedQA()` engine in `questionAnswer/qaEngine.js`.

---

## 2. Forensic Trace of the Execution Path

The execution flow of user queries in production:
```
AskAstroVerseView.jsx (User Inputs Query)
      │
      ▼
FollowUpQuestions.jsx (Receives query & triggers handleAskQuestion)
      │
      ▼
followUpAnswerService.js -> answerFollowUpQuestion({ question, context, ... })
      │
      ├──> routeFollowUpQuestion() [followUpRouter.js]
      │      ├── FACTUAL -> Returns deterministic fact directly
      │      ├── UNSUPPORTED_SYSTEM -> Explanatory isolation refusal
      │      └── REPORT_ANALYSIS -> Analytical consultation
      │
      ├──> [CRITICAL DISCONNECTION FOUND]
      │      If AI Proxy is offline (or deterministic mode):
      │      Calls generateDeterministicAnswer() inside followUpAnswerService.js!
      │      `processEvidenceLinkedQA` in `questionAnswer/qaEngine.js` was NEVER invoked!
      │
      ▼
generateDeterministicAnswer() [followUpAnswerService.js lines 814–1717]
      ├── Lines 845–854: Domain matchers (Career, Marriage, Health, Property, etc.)
      ├── If question did not match simple keyword regex (e.g. foreign tours, luxury vehicles, doctorate):
      └── Falls into lines 1681–1706:
            Emits hardcoded fallback:
            "[Report Finding] According to your calculated Lahiri report, your Ascendant (...) and Moon sign (...) establish your foundational astrological blueprint... Operating cycle: ... Under classical Parashari principles..."
```

---

## 3. Verified Root Causes Identified

### Defect 1: Disconnection Between `followUpAnswerService.js` and `questionAnswer/qaEngine.js`
- **Location:** `frontend/src/services/followUpAnswerService.js` (lines 1896–1900).
- **Finding:** `followUpAnswerService.js` simply re-exported `processEvidenceLinkedQA` at line 1900 without executing it. When analytical questions were processed offline, `generateDeterministicAnswer` relied on legacy template strings.
- **Remediation:** Wire `processEvidenceLinkedQA` directly into `followUpAnswerService.js` for all analytical questions. Ensure both engines share evidence graphs and canonical contracts.

### Defect 2: Hardcoded Generic Fallback Paragraph in `followUpAnswerService.js`
- **Location:** `frontend/src/services/followUpAnswerService.js` (lines 1703–1706).
- **Finding:** Any query that did not match hardcoded regexes fell into an `else` block outputting a generic blueprint paragraph reciting Lagna, Moon sign, Sun sign, and Dasha.
- **Remediation:** Replace generic paragraph fallbacks with strict fail-closed handling (`INSUFFICIENT_DATA` or `NOT_DISCRIMINATING`) that specifies the missing astronomical/factual factors.

### Defect 3: Generic Fallback Branch in `answerSynthesizer.js`
- **Location:** `frontend/src/services/questionAnswer/answerSynthesizer.js` (lines 685–703).
- **Finding:** In `answerSynthesizer.js`, if a question didn't hit cases 1–10, it output:
  `"According to your calculated report, your Ascendant (Lagna) is ${ascSign}, with primary planetary dispositors defining the energetic framework for this inquiry."`
- **Remediation:** Implement explicit question understanding and dedicated domain handling for all expanded life inquiry areas (Foreign Travel, Relationship Dynamics, Marriage Timing, Business Continuation vs Change, Executive Leadership vs Politics, Higher Education/PhD, Real Estate vs Luxury Conveyances). Fail closed on unhandled queries without generic blueprint fillers.

### Defect 4: Placeholder Timing Windows
- **Location:** `frontend/src/services/questionAnswer/answerSynthesizer.js` (line 733).
- **Finding:** If `timingWindow` was empty, `answerSynthesizer.js` inserted `"Favorable Dasha-Transit Window"` or `"தசா-கோச்சார சுப பார்வை காலம்"`.
- **Remediation:** If no timing window converges, set `timingWindow = "NO_DISCRIMINATING_WINDOW"` or abstain with `timingResolution = "NOT_DISCRIMINATING"` with clear explanation. Never emit placeholder phrases.

### Defect 5: Missing Domain Scope in `intentClassifier.js` and `domainClassifier.js`
- **Finding:** Queries asking about doctorate degrees, international travel age, luxury vehicles (Rolls-Royce), political leadership vs administrative office, and business continuation vs change lacked fine-grained intent classification, causing them to fall back to general interpretations.
- **Remediation:** Expand `intentClassifier.js`, `domainClassifier.js`, `entityExtractor.js`, and `evidencePlanner.js` with comprehensive taxonomy schemas.

---

## 4. Remediation Plan

1. **Phase 2 & 3:** Implement complete typed `QuestionSpecification` schema and dedicated handlers for the 10+ inquiry domains.
2. **Phase 4 & 5:** Bridge `followUpAnswerService.js` to dispatch into `processEvidenceLinkedQA()`.
3. **Phase 6 & 7:** Eradicate generic fallback prose and placeholder timing windows across both synthesis engines.
4. **Phase 8 & 11:** Implement anti-repetition detector and bilingual claim firewall in `qaFirewall.js`.
5. **Phase 13 & 14:** Implement exhaustive test suite and quality benchmark.
6. **Phase 15:** Verify 17-point release gate and produce deliverable audit reports.
