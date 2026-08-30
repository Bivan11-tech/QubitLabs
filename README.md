# QuBitLabs — AI Quantum Learning Platform (Frontend)

An interactive, beginner-to-advanced **quantum computing learning platform** with a visual drag-and-drop circuit builder, a built-in in-browser state-vector simulator, an AI tutor, structured courses, gamified challenges and progress tracking.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4** and **Zustand** (persisted state). No quantum backend is required — simulation runs in your browser.

---

## Feature summary (Tier-1 spec)

| Area | What you get |
| --- | --- |
| **Landing** | Hero, feature grid, 4-step workflow, course cards, CTA — dark gradient theme |
| **Auth** | Login / Register / Onboarding (name, skill level, interests). Demo account with one click. Route guard redirects unauthenticated visitors to `/login` |
| **Dashboard** | Continue-learning card (pick up the next unfinished lesson), skill level, course progress bars, XP, badge roll-up, next-challenge CTA |
| **Learning** | 4 course levels (Fundamentals → Gates → Circuits → Algorithms) with lessons: write-up, LaTeX-style formulas, conceptual quiz (with explanation), and example circuits you can open in the Lab |
| **Quantum Lab** | Drag-drop **visual builder** + **Qiskit Code mode** (two-way sync & parsing); gate palette (H, X, Y, Z, S, T, RX/RY/RZ with angle slider, S†/T†, CX, CY, CZ, SWAP, Measure); wire add/remove; run simulation |
| **Results** | Backend selector (Qiskit Aer / PennyLane / Cirq / qBraid), shots, histogram, state-vector table (Bra-Ket), **Bloch sphere** per wire, entanglement & purity readout, auto-detected circuit pattern, AI diagnostics |
| **AI Tutor** | No-auth standalone Tutor page + panel in the Lab. Reads the live circuit, detects patterns (`bell`, `grover-ish`, `uniform-superposition`, `trivial`), explains circuits, debugs wrong results, answers concept questions, generates Qiskit code |
| **Challenges** | 5 graded build-this-circuit challenges (Bell, uniform superposition, Grover, teleport, QFT) verified against requirements + simulation results; XP + badges |
| **Progress** | XP, streak, lesson counts, 11 achievements/badges, per-course completion bars, challenge scorecards |
| **Profile** | Edit name/email/level/interests; log out; reset progress |
| **Instructor** | Demo classroom analytics: students table, concept-mastery bars, common-mistakes panel |

**Non-goals (Tier 2+, mocked/stubbed):** real qBraid/PennyLane cloud execution, multi-user classes, real backend queue. Simulation is a faithful local unitary simulator; the API surface (`POST /api/simulate`) mirrors the production contract so a real backend can be dropped in by editing `src/lib/api.ts` (`SIMULATION_API`).

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build  → ./dist
```

No environment variables or backend required.

---

## Project structure

```
src/
├─ main.tsx                  # React root, BrowserRouter
├─ App.tsx                   # Route map (guest routes + <Protected> app shell routes)
├─ styles.css                # Tailwind v4 @theme tokens + custom component classes
├─ lib/
│  ├─ api.ts                 # simulate() — calls SIMULATION_API or falls back to local engine
│  └─ quantum/
│     ├─ types.ts            # GateType, QuantumCircuit, QuantumGate, SimulationResult, BACKENDS, GATE_META, PALETTE_GROUPS
│     ├─ simulator.ts        # State-vector engine: simulateCircuit(), fullUnitary(), subIndex/restIndex(),
│     │                      #   reducedDensity(), purity(), isEntangled(), blochVector()
│     ├─ qiskit.ts           # circuitToQiskit() code generation + tolerant qiskitToCircuit() parser
│     ├─ ai.ts               # Rule-based AI tutor: answerQuestion(), explainCircuitMarkdown(),
│     │                      #   debugCircuit(), detectPattern(), codeFor(), context-aware suggestions
│     └─ layout.ts           # layoutCircuit() cell grid for the canvas; nextFreeMoment(); momentFromX()
├─ store/
│  ├─ authStore.ts           # user session (name, email, skillLevel, interests) — persisted 'qpl-auth'
│  ├─ progressStore.ts       # xp, streak, lessonsDone, badges, coursePercent() — persisted 'qpl-progress'
│  └─ circuitStore.ts        # live circuit, mode, backend, shots, run(), save/load — persisted 'qpl-circuit'
├─ data/
│  ├─ courses.ts             # 4 levels × lessons (theory, quiz, example circuits) + TOTAL_LESSONS
│  └─ challenges.ts          # 5 challenges: requirements.check(circuit, result) for auto-grading
├─ components/
│  ├─ ui.tsx                 # Button/Primary/Ghost/Card/Badge/Progress/Stat/SectionTitle/Spinner/Tabs/Empty/MiniMarkdown/useClickOutside/useCopy
│  ├─ Logo.tsx
│  ├─ MinCircuitPreview.tsx  # tiny gate-strip preview (dashboard/challenges)
│  └─ layout/
│     ├─ AppShell.tsx        # authed layout: sidebar links + <Outlet/>
│     └─ GuestLayout.tsx     # marketing/auth layout wrapper
├─ features/
│  ├─ auth/    Login, Register, Onboarding
│  ├─ dashboard/DashboardPage
│  ├─ learning/CoursesPage, LessonPage
│  ├─ lab/     GatePalette, CircuitCanvas, CodeEditor, AITutorPanel, ResultsPanel,
│  │           visualization/{Histogram, StateVectorTable, BlochSphere}
│  ├─ tutor/TutorPage
│  ├─ challenges/ChallengesPage, ChallengePage
│  ├─ progress/ProgressPage
│  ├─ profile/ProfilePage
│  └─ instructor/InstructorPage
└─ pages/     LandingPage, AboutPage, NotFoundPage
```

## How the flow works

1. **Entry** — `main.tsx` mounts `<BrowserRouter>`; `App.tsx` maps `/` (Landing), `/login`, `/register`, `/onboarding`, `/about` as guest routes, and every app route (`/dashboard`, `/learn`, `/lab`, `/tutor`, `/challenges`, `/progress`, `/profile`, `/instructor`) under a `<Protected>` guard that redirects to `/login` when `authStore.user` is missing. The **Demo account** button on the login screen logs in instantly for evaluation.

2. **Auth state** — `authStore` (Zustand + `persist`) owns the user. Onboarding writes name/level/interests once; `AppShell` uses the same store for the sidebar identity block.

3. **Progress** — `progressStore` tracks `xp`, `streak`, `lessonsDone` (`{courseId: [lessonIds]}`), `challengeStars`, and an achievement list. A `lessonDone()`/`coursePercent()` helper pair drives the dashboard progress bars and completions.

4. **Learn** — `CoursesPage` reads `courses.ts` and renders per-course cards with `coursePercent`. `LessonPage` renders the lesson body, a quiz (graded with an explained answer), and an **Open in Lab** button that loads the lesson's example gates into `circuitStore` and navigates to `/lab`.

5. **Lab** — `circuitStore.circuit` is the single source of truth. `CircuitCanvas` renders `layoutCircuit()` cells; palette drags/canvas clicks call `addGateAt(moment)` which routes single-qubit gates normally and two-qubit gates (CX/CY/CZ/SWAP) to the control wire with automatic moment placement. **Run** calls `simulate()` → `api.ts` → local `simulator.ts` (or a real `POST /api/simulate` if `SIMULATION_API` is set), which applies `fullUnitary()` per gate and samples `counts`; results land in the store and feed `ResultsPanel` (histogram, state vector, Bloch sphere, pattern detection, `debugCircuit()` diagnostics).

6. **Code mode** — `circuitToQiskit()` generates Qiskit from the circuit; `qiskitToCircuit()` parses pasted code back onto the canvas (two-way sync).

7. **Tutor** — `ai.ts` `answerQuestion(ctx)` is a deterministic, context-aware responder: it detects intent (debug, explain circuit, generate code, concept, roadmap), reads `ctx.circuit` + `ctx.result`, and returns markdown + quick-suggestion chips. The same engine backs the floating **AI Tuor** panel in the Lab and the standalone `/tutor` page.

8. **Challenges** — Each challenge declares `requirements` as predicate functions. `ChallengePage` opens a starter circuit (or the user builds freely), runs it, and evaluates every requirement against the circuit + result; passing grants XP and marks a badge.

9. **Instructor** — static demo analytics over a sample cohort (student table, concept mastery, common mistakes) to illustrate the instructor dashboard.

## Design decisions worth knowing

- **Zero backend** — the entire "AI + simulation" experience is client-side so the zip runs by itself (`npm i && npm run dev`). Swap in a real backend by pointing `SIMULATION_API` and replacing the `applyGate` logic in `api.ts`.
- **Rule-based tutor, no API keys** — deterministic and fully testable; intent + circuit diagnostics produce high-quality, relevant answers without network calls.
- **Deterministic sampling** — counts use a seeded PRNG (mulberry32), so repeated runs are reproducible (great for grading challenges).
- **Persistence** — auth, progress and circuits survive refresh via Zustand `persist` (localStorage keys `qpl-auth`, `qpl-progress`, `qpl-circuit`). The Lab restores the last-edited circuit, which can be a Bell starter.
- **Conventions** — `verbatimModuleSyntax` (type-only imports use `import type`), no enums (string literal unions), `noUnusedLocals/Parameters` enforced by `tsc -b`.

## Notes on running on WSL1 / Windows

`node` may not be on PATH. The exact working build commands used here:

```bash
cd /mnt/d/quantum-platform
"/mnt/c/Program Files/nodejs/node.exe" node_modules/typescript/bin/tsc -b > /tmp/tsc.log 2>&1
"/mnt/c/Program Files/nodejs/node.exe" node_modules/vite/bin/vite.js build > /tmp/vite.log 2>&1
```

(Npm via `cmd.exe` may fail with the `Error: open EISDIR` interop bug; invoke the JS entrypoints directly as above.)