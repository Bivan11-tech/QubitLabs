# Session Memory — QubitLabs AI Quantum-Learning Platform

This file lets the next session resume exactly where this one stopped. Read this FIRST.

## Objective
Implement the QubitLabs AI quantum-learning platform integration per `prompt.docx`: connect the existing React/TS frontend to a real Python/FastAPI + Qiskit backend with Gemini tutor, working Quantum Lab, algorithms, and challenges.

## Phase Progress (prompt.docx phases)

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository audit | **DONE** — committed as `55664e2` |
| 2 | Backend foundation | **DONE** — committed as `55664e2` |
| 3 | Frontend API integration | **DONE** — committed as `2ef902c` |
| 4 | Quantum Lab (Run Circuit e2e) | **DONE** — UNCOMMITTED (see below) |
| 5 | Visualization | **DONE** — UNCOMMITTED (see below) |
| 6 | AI | **DONE** — Gemini integration complete |
| 7 | Algorithms | **DONE** — 6 templates working |
| 8 | Challenges | **DONE** — backend validation working |
| 9 | Polish | **NOT STARTED** |
| 10 | Testing | **NOT STARTED** |

### What's left in each uncompleted phase

**Phase 9 — Polish**
- Fix pre-existing TypeScript error: `ChallengePage.tsx:69` (`setExecTime` undefined)
- Fix pre-existing ESLint errors: `ui.tsx:188,200` and `GatePalette.tsx:11,15`
- Loading states for: simulation, AI explanation, AI chat, challenge evaluation, template loading
- Empty states: clean placeholder when no results yet (partially done)
- Responsive UI audit across all pages
- Backend offline fallback UI polish
- Error messages for: invalid JSON, invalid gate, invalid qubit, unsupported operation
- Toast notification cleanup (timeout not cleared on unmount in LabPage.tsx)
- Backend selector should show "Coming soon" for PennyLane/Cirq/qBraid (currently cosmetic dropdown)

**Phase 10 — Testing**
- Recreate backend venv with Python 3.11 — **DONE** (`.venv` is now 3.11.16; full suite passes)
- Fix `test_ai.py` to work with new `google-genai` SDK — **DONE** (monkeypatch env key in the 503 test)
- Run `npm run build` and verify zero errors
- Run ESLint and fix remaining warnings
- Execute the golden end-to-end workflow manually
- Verify all 6 algorithm templates load and simulate correctly
- Verify all 5 challenges pass/fail correctly with backend validation

## Important Environment Constraints
- **Python 3.11** — `.venv` was recreated with Python 3.11.16 (this session) and all 74 backend tests pass. Recreate with `python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt`.
- The `google-genai` SDK (v2.22.0+) requires Python >= 3.10. It replaced the legacy `google-generativeai==0.1.0rc1`.
- **Node.js**: `node` is NOT on WSL PATH. Runs via Windows binary:
  - `"/mnt/c/Program Files/nodejs/node.exe"` (v24.18.0)
  - tsc: `node.exe ./node_modules/typescript/bin/tsc -b`
  - vite: `node.exe ./node_modules/vite/bin/vite.js build`
  - eslint: `node.exe ./node_modules/eslint/bin/eslint.js src`
  - Redirect output to a file (e.g. `> /tmp/x.log 2>&1`) because Windows node can't write to the WSL stdout pipe (EISDIR crash). Check exit code with `echo $?`.
- API servers must be run via `backend/.venv/bin/python`. Background them with `nohup ... > /tmp/x.log 2>&1 & disignore`.

## Security
- **CRITICAL: A hardcoded Gemini key was found in old `backend/main.py` (Phase 1) — treated as COMPROMISED, removed.** Key now read only from env `GEMINI_API_KEY` via `backend/services/gemini.py`.
- `backend/.env` is gitignored via `backend/.gitignore`. Contains real `GEMINI_API_KEY`.
- `backend/.env.example` exists with documented env vars (no secrets).
- The `google-genai` error messages are sanitized — raw SDK exceptions never reach the client (`type(exc).__name__` only).
- User input is sanitized against prompt injection in `gemini.py:_sanitize_user_input()`.
- `prompt.docx` and `~$prompt.docx` are **untracked and ignored** — do NOT commit them.

## Confirmed Git State
- Branch `main`, remote `Bivan11-tech/QubitLabs`. **Local is 2 commits AHEAD of origin/main** (Phase 2 `2ef902c` not pushed + Phase 3 uncommitted).
- Working tree has Phase 3 + Gemini audit + Phase 4 changes (unstaged). Only untracked/ignored: `prompt.docx`, `~$prompt.docx`, `backend/.env.example`.
- Commit identity: `git -c user.name="Bivan11-tech" -c user.email="149198762+Bivan11-tech@users.noreply.github.com" commit -m ...` (no global git identity configured).

## Backend Contract (canonical — frontend adapter mirrors this)
- `GateInstruction {name lowercase, targets[], controls[], params[]}` (params = radians).
- `CircuitRequest {num_qubits 1..7, gates[], shots 1..100000}`. `MAX_QUBITS=7`, `MAX_SHOTS=100_000`.
- `SUPPORTED_GATES`: h x y z s t sdg tdg rx ry rz cx cy cz swap ccx (frontend has no CCX; backend supports it).
- Backend auto-applies `measure_all()` when no measure instructions (so frontend, which drops Measure gates, samples full n-bit register).
- Endpoints: `/health`, `/api/v1/simulate`, `/api/v1/simulate-qasm`, `/api/v1/analyze-circuit`, `/api/v1/templates[/{algo}]`, `/api/v1/challenges/{id}/submit`, `/api/v1/explain-circuit`, `/api/v1/chat-tutor`.
- `/api/v1/simulate` ALSO returns: `circuit_depth`, `total_gates`, `gate_breakdown`, `analysis_context` (string). `analysis_context` is generated by `backend/quantum/simulator.py:build_analysis_context()` and reused by `analysis.py` so both paths stay identical.
- Qiskit conventions: basis strings little-endian; `measure_all()` works with existing creg.

## Gemini Service (post-audit)
- **SDK**: `google-genai>=2.22.0,<3.0.0` (pinned in requirements.txt)
- **Model**: `gemini-2.0-flash` (DEFAULT_MODEL in gemini.py)
- **Service file**: `backend/services/gemini.py` — `GeminiService` class with `generate()` and `chat()`
- **Singleton**: `get_gemini_service()` with safe init (try/except, falls back to unconfigured)
- **Sanitization**: `_sanitize_user_input()` strips prompt injection patterns before sending to Gemini
- **Error handling**: Raw SDK exceptions → `GeminiNotConfiguredError("Gemini request failed: {type}")` — no internal details leak to client
- **API layer**: `api/ai.py` returns generic "AI tutor is unavailable" on 503
- **Timeout**: `max_output_tokens=2048` cap via `GenerateContentConfig`

## Phase 4 Details (Quantum Lab — UNCOMMITTED)
### What was fixed
1. **`store.run()` try/catch/finally** (`circuitStore.ts:144-154`) — spinner can never get stuck
2. **Code editor auto-apply** (`CodeEditor.tsx`) — Run button now calls `applyCodeAndRun()` which parses code to circuit before running
3. **Local fallback backend label** (`api.ts:32`) — `result.backend` set to `'local-engine'` instead of claiming "qiskit-aer"
4. **Random local sampling** (`simulator.ts:214`) — seed changed from fixed `0xc0ffee` to `Date.now()` for per-run randomness
5. **Bloch wire clamping** (`ResultsPanel.tsx:20-22`) — `wire` index auto-resets to 0 when qubit count decreases
6. **Dead code cleanup** — removed `simulate()` export from `api.ts`, removed `SimRequest` type from `types.ts`
7. **`BackendId` type** — added `'local-engine'` variant
8. **Run Info display** — shows "Local engine" instead of raw type name

### Phase 4 changed files
- `src/store/circuitStore.ts` — try/catch/finally in `run()`, new `applyCodeAndRun()`
- `src/features/lab/CodeEditor.tsx` — Run uses `applyCodeAndRun` instead of `run`
- `src/lib/api.ts` — local fallback sets `result.backend = 'local-engine'`, removed dead `simulate()`
- `src/lib/quantum/types.ts` — added `'local-engine'` to `BackendId`, removed `SimRequest`
- `src/lib/quantum/simulator.ts` — random seed per run
- `src/features/lab/ResultsPanel.tsx` — wire clamping, local-engine label

## Phase 5 Details (Visualization — UNCOMMITTED)
### What was done
1. **Backend `/simulate` now returns `analysis_context`** — `backend/quantum/simulator.py` gained `build_analysis_context()`; `analysis.py` reuses it via `_context_from_stats()` so `/simulate`, `/analyze-circuit`, and the AI prompts are identical.
2. **`bloch_vectors` surfaced** — `BackendSimulationResult.bloch_vectors` mapped in `toSimulationResult()` (`backend.ts`) into new optional `SimulationResult.blochVectors`. `BlochSphere.tsx` prefers real backend vectors, falls back to client-side `blochVector()` for local engine.
3. **Run Info shows backend stats** — `ResultsPanel.tsx` meta tab now renders `circuit_depth`, `total_gates` (backend values, falls back to local gate count), `gate_breakdown` (backend only), plus a "Qiskit analysis" block rendering `result.analysisContext`.
4. **Analysis context wired into UI** — shown in the Run Info column alongside the client-side `debugCircuit()` warnings.

### Phase 5 changed files
- `backend/quantum/simulator.py` — `build_analysis_context()`, `analysis_context` in `run_circuit` return
- `backend/quantum/analysis.py` — `_context_from_stats()` shared builder
- `src/lib/quantum/types.ts` — `BlochVector` type + optional `blochVectors|circuitDepth|totalGates|gateBreakdown|analysisContext` on `SimulationResult`
- `src/lib/backend.ts` — mapped the new fields; `BlochVectorWire` type
- `src/features/lab/visualization/BlochSphere.tsx` — prefers backend vectors
- `src/features/lab/ResultsPanel.tsx` — Run Info stats + Qiskit analysis block
- `src/features/challenges/ChallengePage.tsx` — removed accidental duplicate `source/setSource` useState (lines 40-41) + unused `execTime`; fixes TS2451/TS6133 blockers
- `backend/tests/test_ai.py` — 503 test now `monkeypatch.delenv("GEMINI_API_KEY")` so unconfigured state is real

### Verification
- `backend/.venv/bin/python -m pytest backend/tests -q -p no:warnings` → **74 passed**
- `tsc -b` → **exit 0**
- `vite build` → **exit 0**
- Live curl of `/api/v1/simulate` (Bell state) returns `circuit_depth:2`, `total_gates:2`, `gate_breakdown:{h:1,cx:1}`, `bloch_vectors`, `analysis_context`, `entangled:true`.

### Still-pending items touched in this phase
- ESLint errors in `ui.tsx:188,200` + `GatePalette.tsx:11,15` (react-refresh) and `ResultsPanel.tsx:21` (set-state-in-effect, from Phase 4 wire clamping) — left for Phase 9.
- `Histogram.tsx` / `StateVectorTable.tsx` already consumed real backend data (no change needed).

## Frontend/Backend Wiring
- `src/lib/backend.ts`: gate-format adapter + HTTP client + all API functions. `API_BASE = import.meta.env.VITE_API_URL ?? ''` (empty = same-origin → Vite proxy).
- `src/lib/api.ts`: `simulateWithSource(circuit, backend, shots)` — POST `/api/v1/simulate` first; on error falls back to local `simulateCircuit` with `result.backend = 'local-engine'`.
- `src/store/circuitStore.ts`: `run()` with try/catch/finally; `applyCodeAndRun()` for code editor.
- `vite.config.ts`: proxies `/api` and `/health` → `VITE_PROXY_TARGET` (default `http://localhost:8000`). No CORS in dev.
- `.env.example`: `VITE_API_URL` (empty=proxy) and `VITE_PROXY_TARGET` (default 8000).

## Phase 3 Details (still relevant)
### AI Tutor
- `src/features/lab/AITutorPanel.tsx` and `src/features/tutor/TutorPage.tsx` call backend `chatTutor()` and `explainCircuit()` first, falling back to local `answerQuestion()` on error.
- `aiSource` defaults to `'local'` (not `'backend'`) — no misleading "Gemini AI" badge before first request.

### Challenge Evaluation
- Backend validates all 5 challenges: `bell-state` (alias `bell`), `superposition-led`, `grover-2q`, `teleport`, `qft-2q`.
- Known bug: `ChallengePage.tsx:69` references undefined `setExecTime` (pre-existing).

### Template Loading
- Available: bell, ghz, deutsch-jozsa, teleportation, grover, qft.
- `TEMPLATE_OPTIONS` hardcoded in `LabPage.tsx:18-25`. `listTemplates()` exists but is unused (dead export).

### Monaco Code Editor
- `src/features/lab/CodeEditor.tsx` with `@monaco-editor/react` and custom `qubitlabs-dark` theme.
- Run button now auto-applies code changes before simulating.

## How to Manually Test
1. Recreate venv: `cd backend && python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt`
2. `cp backend/.env.example backend/.env` (add real GEMINI_API_KEY if testing AI)
3. Terminal 1: `backend/.venv/bin/python -m uvicorn backend.main:app --reload` (port 8000)
4. Terminal 2: `"/mnt/c/Program Files/nodejs/node.exe" ./node_modules/vite/bin/vite.js`
5. Open `http://localhost:5173` (or `http://[::1]:5173`)
6. Lab → green "Qiskit API online" → Run Bell state → histogram 00/11
7. AI Tutor → explain circuit / chat
8. Challenges → submit → backend grades
9. Templates → load from backend

### Quick API sanity curls
```bash
curl http://localhost:8000/health
curl -s -X POST http://localhost:8000/api/v1/simulate -H "Content-Type: application/json" \
  -d '{"num_qubits":2,"gates":[{"name":"h","targets":[0],"controls":[],"params":[]},{"name":"cx","targets":[1],"controls":[0],"params":[]}],"shots":1024}'
curl -s http://localhost:8000/api/v1/templates/grover
curl -s -X POST http://localhost:8000/api/v1/challenges/bell/submit -H "Content-Type: application/json" \
  -d '{"num_qubits":2,"gates":[{"name":"h","targets":[0],"controls":[],"params":[]},{"name":"cx","targets":[1],"controls":[0],"params":[]}],"shots":4096}'
curl -s -X POST http://localhost:8000/api/v1/explain-circuit -H "Content-Type: application/json" \
  -d '{"num_qubits":2,"gates":[{"name":"h","targets":[0],"controls":[],"params":[]},{"name":"cx","targets":[1],"controls":[0],"params":[]}],"shots":1024}' | head -c 200
```

## Files (current mapping)
- Backend: `backend/{main.py, models/, quantum/, services/gemini.py, api/, tests/}`, `backend/requirements.txt`, `backend/pytest.ini` (pythonpath=..), `backend/.env.example`, `backend/.gitignore`.
- Frontend wiring: `src/lib/api.ts`, `src/lib/backend.ts`, `src/store/circuitStore.ts`, `src/features/lab/{LabPage,ResultsPanel,CodeEditor}.tsx`, `vite.config.ts`, `.env.example`.
- Frontend main: `src/`, entry `src/main.tsx`, `src/App.tsx`; `src/lib/quantum/{types,simulator,qiskit,ai,layout}.ts`; `src/store/{circuit,progress,auth}Store.ts`; `src/features/{lab,tutor,challenges,learning,...}/`.

## Key Commands
- Backend tests: `cd /mnt/d/quantum-platform && backend/.venv/bin/python -m pytest backend/tests -q -p no:warnings`
- Backend import check: `backend/.venv/bin/python -c "import backend.main; print('ok')"`
- Frontend typecheck: `"/mnt/c/Program Files/nodejs/node.exe" ./node_modules/typescript/bin/tsc -b` (redirect to file)
- Frontend build: `"/mnt/c/Program Files/nodejs/node.exe" ./node_modules/vite/bin/vite.js build` (redirect to file)

## Reminders
- NEVER commit secrets; keep `prompt.docx`/`~$prompt.docx` untracked.
- Only commit when asked. To commit use the `git -c user.name/email` form above.
- Venv is now Python 3.11.16 (recreated this session). `requirements.txt` remains the 3.8-compatible pins (Qiskit 0.46/Aer 0.14) — they install and pass on 3.11 but should be upgraded to Qiskit 1.x eventually (not required to pass tests).
- Known pre-existing ESLint errors: `ui.tsx:188,200` and `GatePalette.tsx:11,15` (react-refresh), plus `ResultsPanel.tsx:21` (set-state-in-effect, from Phase 4 wire clamping).
- `ChallengePage.tsx` duplicate-`useState` TS error is FIXED (this session).
