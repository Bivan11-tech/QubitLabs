# Session Memory — QubitLabs AI Quantum-Learning Platform

This file lets the next session resume exactly where this one stopped. Read this FIRST.

## Objective
Implement the QubitLabs AI quantum-learning platform integration per `prompt.docx`: connect the existing React/TS frontend to a real Python/FastAPI + Qiskit backend with Gemini tutor, working Quantum Lab, algorithms, and challenges.

## Phase Progress
- **Phase 1 (BACKEND FOUNDATION) — DONE**, committed as `55664e2`
- **Phase 2 (FRONTEND ↔ BACKEND WIRING) — DONE**, committed as `2ef902c`, verified end-to-end
- **Phase 3 (INTEGRATION FEATURES) — DONE**, NOT COMMITTED (awaiting user approval)
  - AI Tutor wired to backend `/explain-circuit` + `/chat-tutor` with local fallback
  - Challenge evaluation switched to backend `/challenges/{id}/submit` (all 5 challenges)
  - Template loading from `/api/v1/templates/{algo}` into the Lab
  - Monaco code editor replaces textarea in CodeEditor.tsx

## Important Environment Constraints (CRITICAL)
- Only **Python 3.8.10** available (no pip initially). Backend MUST pin **Qiskit 0.46.3 + qiskit-aer 0.14.2 + google-generativeai (legacy)**. Qiskit 1.x / Aer 1.x / new genai need ≥3.9 and will NOT work.
- Because of Py3.8, ALL backend modules need `from __future__ import annotations` AND use `typing.List/Dict/Optional` (NOT builtin `list[int]`/`dict[...]`/`str | None`) — PEP 585 generics and `X | None` fail at runtime on 3.8 under pydantic v2's `get_type_hints`. (This was a real bug fixed in Phase 1.)
- **Node.js**: `node` is NOT on WSL PATH. Runs via Windows binary:
  - `"/mnt/c/Program Files/nodejs/node.exe"` (v24.18.0)
  - tsc: `node.exe ./node_modules/typescript/bin/tsc -b`
  - vite: `node.exe ./node_modules/vite/bin/vite.js build`
  - eslint: `node.exe ./node_modules/eslint/bin/eslint.js src`
  - Redirect output to a file (e.g. `> /tmp/x.log 2>&1`) because Windows node can't write to the WSL stdout pipe (EISDIR crash). Check exit code with `echo $?`.
- API servers must be run via `backend/.venv/bin/python`. Background them with `nohup ... > /tmp/x.log 2>&1 & disown`.

## Security Holds
- **CRITICAL: A hardcoded Gemini key was found in old `backend/main.py` (Phase 1, ``) — treated as COMPROMISED, removed.** Verified the key is absent from all files and git history. Key now read only from env `GEMINI_API_KEY` via `backend/services/gemini.py`. NEVER re-add a copy; NEVER set a real key in this session.
- No `GEMINI_API_KEY` in this environment → AI endpoints return HTTP 503 when unconfigured (by design, no fake AI).
- `prompt.docx` and `~$prompt.docx` (Office lock file) are **untracked and ignored** — do NOT commit them. Working tree must stay free of them.

## Confirmed Git State (as of end of Phase 3, UNCOMMITTED)
- Branch `main`, remote `Bivan11-tech/QubitLabs`. **Local is 2 commits AHEAD of origin/main** (Phase 2 `2ef902c` not pushed + Phase 3 uncommitted). User has NOT asked to push or commit.
- Working tree has Phase 3 changes (unstaged). Only untracked/ignored: `prompt.docx`, `~$prompt.docx`.
- Commit identity: `git -c user.name="Bivan11-tech" -c user.email="149198762+Bivan11-tech@users.noreply.github.com" commit -m ...` (no global git identity configured).

## Backend Contract (canonical — frontend adapter mirrors this)
- `GateInstruction {name lowercase, targets[], controls[], params[]}` (params = radians).
- `CircuitRequest {num_qubits 1..7, gates[], shots 1..100000}`. `MAX_QUBITS=7`, `MAX_SHOTS=100_000`.
- `SUPPORTED_GATES`: h x y z s t sdg tdg rx ry rz cx cy cz swap ccx (frontend has no CCX; backend supports it).
- Backend auto-applies `measure_all()` when no measure instructions (so frontend, which drops Measure gates, samples full n-bit register).
- **`/api/v1/simulate` response now includes `entangled`** (from reduced purity) — added in Phase 2.
- Endpoints: `/health`, `/api/v1/simulate`, `/api/v1/simulate-qasm`, `/api/v1/analyze-circuit`, `/api/v1/templates[/{algo}]`, `/api/v1/challenges/{id}/submit`, `/api/v1/explain-circuit`, `/api/v1/chat-tutor`.
- Qiskit conventions: basis strings little-endian; `measure_all()` works with existing creg.

## Frontend/Backend Wiring (Phase 2+3) — HOW IT WORKS
- `src/lib/backend.ts`: gate-format adapter + HTTP client + `/health` + `explainCircuit()` + `chatTutor()` + `submitChallenge()` + `fetchTemplate()` + `listTemplates()`. `API_BASE = import.meta.env.VITE_API_URL ?? ''` (empty = same-origin → Vite proxy).
- `src/lib/api.ts`: `simulateWithSource(circuit, backend, shots)` — POST `/api/v1/simulate` first; on error falls back to local `simulateCircuit` and returns `{result, source:'backend'|'local', backendError?}`.
- `src/store/circuitStore.ts`: `run()` stores `source: SimulationSource` and `backendError`.
- `vite.config.ts`: proxies `/api` and `/health` → `VITE_PROXY_TARGET` (default `http://localhost:8000`). No CORS in dev.
- `.env.example`: `VITE_API_URL` (empty=proxy) and `VITE_PROXY_TARGET` (default 8000).

## Phase 3 Details
### AI Tutor
- `src/features/lab/AITutorPanel.tsx` and `src/features/tutor/TutorPage.tsx` now call backend `chatTutor()` and `explainCircuit()` first, falling back to local `answerQuestion()` on error (503/404/network).
- Displays "online" (Gemini backend) or "local" (fallback) source indicator.
- Conversation history sent to backend as `ChatMessage[]` with roles mapped to `'user'`/`'model'`.

### Challenge Evaluation
- `ChallengePage.tsx` calls `submitChallenge(challengeId, circuit, shots)` → `POST /api/v1/challenges/{id}/submit`.
- Backend validates all 5 challenges: `bell-state` (alias `bell`), `superposition-led`, `grover-2q`, `teleport`, `qft-2q`.
- Backend response includes `passed`, `score`, `xp`, `feedback`, `checks[]` — frontend displays directly.
- Local `challenge.requirements[].check` no longer used for grading.

### Template Loading
- Lab toolbar has a "Templates" dropdown that fetches `/api/v1/templates/{algo}` and converts the backend `GateInstruction[]` to frontend `QuantumGate[]` format via `templateToCircuit()`.
- Available: bell, ghz, deutsch-jozsa, teleportation, grover, qft.

### Monaco Code Editor
- `src/features/lab/CodeEditor.tsx` uses `@monaco-editor/react` with a custom `qubitlabs-dark` theme.
- Python language mode with syntax highlighting matching the app's color palette.

## How to Manually Test Through Phase 3
1. `cp backend/.env.example backend/.env`
2. Terminal 1: `backend/.venv/bin/python -m uvicorn backend.main:app --reload` (port 8000)
3. Terminal 2: `npm run dev` — or if node fails on WSL1: `"/mnt/c/Program Files/nodejs/node.exe" ./node_modules/vite/bin/vite.js` (binds `::1` → browser uses `http://[::1]:5173`)
4. Open Lab: green **`● Qiskit API online`** pill; build Bell; Run → Results footer says "Simulated on the Qiskit backend"; histogram 00/11 only; Entangled badge; Meta tab shows real timing.
5. AI Tutor: open `/tutor` or the Lab sidebar panel. Ask "explain my circuit" → if GEMINI_API_KEY set, gets Gemini response; otherwise falls back to local canned heuristics.
6. Challenges: open any challenge → "Run & Evaluate" → backend grades the circuit and returns results.
7. Templates: Lab toolbar → Templates dropdown → select e.g. "Bell State" → circuit loads from backend.
8. Code Editor: Lab → Code tab → Monaco editor with Python syntax highlighting.
9. Verification:
   - `backend/.venv/bin/python -m pytest backend/tests -q` (74 tests)
   - `node.exe ./node_modules/typescript/bin/tsc -b`
   - `node.exe ./node_modules/vite/bin/vite.js build`
   - `node.exe ./node_modules/eslint/bin/eslint.js src` (4 PRE-EXISTING errors in `ui.tsx:188,200` and `GatePalette.tsx:11,15`)

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

## Files (current mapping — Phase 3 additions marked)
- Backend: `backend/{main.py, models/, quantum/, services/gemini.py, api/, tests/}`, `backend/requirements.txt` (Py3.8 pins), `backend/pytest.ini` (pythonpath=..), `backend/.env.example`.
- Frontend wiring: `src/lib/api.ts`, `src/lib/backend.ts` [+explainCircuit/chatTutor/submitChallenge/fetchTemplate/listTemplates], `src/store/circuitStore.ts`, `src/features/lab/{LabPage,ResultsPanel}.tsx` [+template dropdown], `vite.config.ts`, `.env.example`.
- Frontend main: `src/`, entry `src/main.tsx`, `src/App.tsx`; `src/lib/quantum/{types,simulator,qiskit,ai,layout}.ts`; `src/store/{circuit,progress,auth}Store.ts`; `src/features/{lab,tutor,challenges,learning,...}/`.
- **Phase 3 changed files**: `src/lib/backend.ts`, `src/features/lab/AITutorPanel.tsx`, `src/features/lab/CodeEditor.tsx`, `src/features/lab/LabPage.tsx`, `src/features/tutor/TutorPage.tsx`, `src/features/challenges/ChallengePage.tsx`, `backend/api/challenges.py`.

## Key Commands
- Backend tests: `cd /mnt/d/quantum-platform && backend/.venv/bin/python -m pytest backend/tests -q -p no:warnings`
- Backend import check: `backend/.venv/bin/python -c "import backend.main; print('ok')"`
- Frontend typecheck/build/lint via Windows node (see environment notes above).

## Reminders
- NEVER commit secrets; keep `prompt.docx`/`~$prompt.docx` untracked.
- Only commit when asked. To commit use the `git -c user.name/email` form above.
- When starting Phase 4 (if any), ask user for go-ahead (consistent with the phased-approval pattern).
