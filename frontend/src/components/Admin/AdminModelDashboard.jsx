import React, { useState, useEffect } from 'react';

/**
 * SKR ASTRO — Admin Model Dashboard & Continuous Learning Health Monitor
 *
 * Provides real-time visibility into:
 * 1. Registered and active prediction models across domains.
 * 2. Continuous learning candidate benchmarks vs demographic baselines.
 * 3. Release gate promotion and rejection records.
 * 4. Model rollback controls and audit trails.
 */
export default function AdminModelDashboard({
  models = [],
  benchmarks = [],
  activeDeployments = [],
  onDeployModel = null,
  onRollbackModel = null,
  lang = 'en'
}) {
  const isTa = lang === 'ta';
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  const filteredModels = selectedDomain === 'ALL'
    ? models
    : models.filter(m => m.domain === selectedDomain);

  const filteredBenchmarks = selectedDomain === 'ALL'
    ? benchmarks
    : benchmarks.filter(b => b.evaluatedCohort === selectedDomain);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-xl font-bold text-amber-400">
            {isTa ? 'மாதிரி மேலாண்மை & தொடர் கற்றல் கட்டுப்பாட்டு மையம்' : 'Continuous Learning & Model Release Dashboard'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTa
              ? 'சுயாதீன சரிபார்ப்பு வாயில்: மக்கள்தொகை அடிப்படை அளவுகோலை முந்திய மாதிரிகள் மட்டுமே அனுமதிக்கப்படும்.'
              : 'Independent Release Gate: Candidate models must outperform empirical demographic actuarial baselines.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">
            {isTa ? 'துறை:' : 'Domain:'}
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">{isTa ? 'அனைத்து துறைகளும்' : 'All Domains'}</option>
            <option value="MARRIAGE">{isTa ? 'திருமணம் (Marriage)' : 'Marriage'}</option>
            <option value="CAREER">{isTa ? 'தொழில் (Career)' : 'Career'}</option>
            <option value="PROPERTY">{isTa ? 'சொத்து (Property)' : 'Property'}</option>
            <option value="FOREIGN_TRAVEL">{isTa ? 'வெளிநாட்டு பயணம்' : 'Foreign Travel'}</option>
            <option value="FINANCE">{isTa ? 'நிதி (Finance)' : 'Finance'}</option>
          </select>
        </div>
      </div>

      {/* Grid: Production Models and Benchmark Gates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Panel 1: Model Registry & Status */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>{isTa ? 'மாதிரிகள் பதிவேடு (Model Registry)' : 'Model Registry & Deployment'}</span>
            <span className="text-xs text-slate-500 font-mono">Count: {filteredModels.length}</span>
          </h4>

          {filteredModels.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              {isTa ? 'பதிவு செய்யப்பட்ட மாதிரிகள் இல்லை.' : 'No models registered in this domain.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredModels.map((m) => {
                const isProduction = m.status === 'PRODUCTION';
                return (
                  <div
                    key={m.modelId}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{m.modelId}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isProduction
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Domain: {m.domain} • Type: {m.modelType}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs mt-0.5">
                        SHA-256: {m.artifactSha256?.substring(0, 16)}...
                      </div>
                    </div>

                    {!isProduction && onDeployModel && (
                      <button
                        type="button"
                        onClick={() => onDeployModel(m.modelId)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
                      >
                        {isTa ? 'பயன்பாட்டிற்கு வெளியிடு' : 'Deploy'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Independent Benchmark & Release Gate Results */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>{isTa ? 'சுயாதீன அளவீட்டு முடிவுகள் (Holdout Benchmarks)' : 'Independent Release Gate Benchmarks'}</span>
            <span className="text-xs text-slate-500 font-mono">Runs: {filteredBenchmarks.length}</span>
          </h4>

          {filteredBenchmarks.length === 0 ? (
            <p className="text-xs text-slate-50y italic py-4">
              {isTa ? 'அளவீட்டு ஓட்டங்கள் எதுவும் இல்லை.' : 'No benchmark evaluation runs recorded.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredBenchmarks.map((b) => {
                const passed = b.passedReleaseGate;
                return (
                  <div
                    key={b.benchmarkId}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">Model: {b.modelId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {passed ? '✓ PROMOTED (PASS)' : '✗ REJECTED (FAIL)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-2 bg-slate-950/50 rounded font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Candidate MAE:</span>
                        <span className="font-bold text-slate-200">{b.timingMae ?? 'N/A'}y</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Baseline MAE:</span>
                        <span className="font-bold text-amber-400">{b.demographicBaselineMae}y</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Within 1-Year:</span>
                        <span className="font-bold text-slate-200">{b.within1yPct ?? 0}%</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Cohort: {b.evaluatedCohort} (N = {b.sampleSize})</span>
                      <span>{new Date(b.evaluatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
