import type { QuantumCircuit, SimulationResult } from './types'

export interface TutorContext {
  question: string
  circuit?: QuantumCircuit
  result?: SimulationResult
  skillLevel?: string
}

export interface TutorReply {
  text: string
  suggestions?: string[]
}

const SUGGESTIONS = [
  'Explain my circuit',
  'Why is it entangled?',
  'Generate Bell state code',
  'How does a Hadamard gate work?',
  'Debug my circuit',
]

export function quickPrompts(): string[] {
  return SUGGESTIONS
}

function gateSummary(circuit: QuantumCircuit): string {
  if (circuit.gates.length === 0) return 'empty'
  const counts = new Map<string, number>()
  for (const g of circuit.gates) counts.set(g.type, (counts.get(g.type) ?? 0) + 1)
  return [...counts.entries()].map(([k, v]) => `${v}× ${k}`).join(', ')
}

export function detectPattern(circuit: QuantumCircuit): string {
  const types = circuit.gates.map((g) => g.type)
  const n = circuit.qubits
  const hCount = types.filter((t) => t === 'H').length
  const cxCount = types.filter((t) => t === 'CX').length

  if (hCount >= 1 && cxCount >= 1 && n === 2) return 'bell'
  if (types.length >= 3 && types.includes('X') && types.includes('H')) return 'grover-ish'
  if (types.every((t) => t === 'H')) return 'uniform-superposition'
  if (types.every((t) => t === 'Measure')) return 'trivial'
  return 'generic'
}

export function explainCircuitMarkdown(circuit: QuantumCircuit, result?: SimulationResult): string {
  const pattern = detectPattern(circuit)
  const lines: string[] = []
  lines.push(`Your circuit uses **${circuit.qubits} qubit${circuit.qubits > 1 ? 's' : ''}** with **${circuit.gates.length} gate${circuit.gates.length !== 1 ? 's' : ''}** (${gateSummary(circuit)}).\n`)

  if (pattern === 'bell') {
    lines.push('This is a **Bell state** — the canonical example of quantum entanglement:')
    lines.push('- `H` on q0 places q0 into an equal superposition of |0⟩ and |1⟩.')
    lines.push('- The `CX` gate flips q1 exactly when q0 is |1⟩, coupling the two qubits.')
    lines.push('- The joint state becomes **(|00⟩ + |11⟩) / √2** — the qubits now share correlations that no classical circuit can produce.')
  } else if (pattern === 'uniform-superposition') {
    lines.push('Every qubit is taken through a Hadamard, producing a **uniform superposition** over all 2ⁿ basis states.')
    lines.push('- Each basis state (|00⟩, |01⟩, …) has equal amplitude 1/√2ⁿ.')
    lines.push('- A measurement collapses everything to a uniformly random bitstring.')
  } else if (pattern === 'trivial') {
    lines.push('Your circuit only measures. Measuring |0⟩-initialized qubits always yields **000…**, which makes for an uninteresting experiment.')
    lines.push('Try adding an `H` gate first to create superposition!')
  } else if (pattern === 'grover-ish') {
    lines.push('This resembles the start of an **oracle-based search (Grover-style)** circuit:')
    lines.push('- The all-Hadamard layer builds a uniform superposition over the search space.')
    lines.push('- The mixed `X` and `H` pattern around the oracle flips the sign of the target state.')
  } else {
    lines.push('This general-purpose circuit mixes single-qubit rotations with two-qubit couplings. Qubit entanglement depends on whether a **controlled gate or rotation follows a superposition** — keep an eye on the results panel.')
  }

  if (result) {
    lines.push('\n**Latest run:**')
    if (result.entangled) {
      lines.push(`- ✅ Measured state indicates **entanglement** (purity < 1 after tracing out a qubit).`)
    } else {
      lines.push(`- The reduced density matrix is pure — the qubits are currently **separable** (not entangled).`)
    }
    const topKey = Object.keys(result.counts).sort((a, b) => result.counts[b] - result.counts[a])[0]
    if (topKey !== undefined) {
      const p = Math.round((result.counts[topKey] / result.shots) * 100)
      lines.push(`- Most frequent outcome: **|${topKey}⟩** at ~${p}%.`)
    }
  }
  return lines.join('\n')
}

export function debugCircuit(circuit: QuantumCircuit): { level: 'info' | 'warn' | 'error'; message: string }[] {
  const issues: { level: 'info' | 'warn' | 'error'; message: string }[] = []
  const gates = circuit.gates
  if (gates.length === 0) {
    issues.push({ level: 'warn', message: 'Empty circuit — drag gates from the palette to build something.' })
    return issues
  }
  const hBeforeCX = (() => {
    for (const g of gates) {
      if (g.type === 'CX') {
        const ctrl = g.qubits[0]
        const before = gates.filter((o) => o.moment < g.moment && o.qubits.includes(ctrl))
        if (before.length === 0) return false
      }
    }
    return true
  })()

  if (gates.some((g) => g.type === 'CX') && !hBeforeCX) {
    issues.push({
      level: 'warn',
      message: 'A CNOT with no prior superposition simply copies a classical bit. Add an H gate before the control to produce genuine entanglement.',
    })
  }
  if (gates.some((g) => g.type === 'H') && gates.some((g) => g.type === 'H')) {
    // Double H on same wire cancels out - detect consecutive H on same qubit without other ops
    for (let w = 0; w < circuit.qubits; w++) {
      const hs = gates.filter((g) => g.type === 'H' && g.qubits[0] === w)
      if (hs.length === 2 && Math.abs(hs[0].moment - hs[1].moment) <= 1) {
        issues.push({ level: 'info', message: `H·H on q${w} = Identity — the pair cancels out (H² = I). Useful for mid-circuit error correction, otherwise harmless.` })
      }
    }
  }
  if (gates.filter((g) => g.type === 'Measure').length === 0) {
    issues.push({ level: 'info', message: 'No measurement gates yet — add M nodes to sample outcomes (histogram + counts).' })
  }
  if (circuit.qubits >= 4 && gates.length > 12) {
    issues.push({ level: 'warn', message: 'Circuit is getting wide. Consider splitting into registers or reusing ancillas to keep simulation fast.' })
  }
  const rotNoise = gates.filter((g) => (g.type === 'RX' || g.type === 'RY' || g.type === 'RZ') && (g.params ? Math.abs(g.params[0]) > 2 * Math.PI : false))
  if (rotNoise.length) {
    issues.push({ level: 'info', message: 'Rotation angles above 2π produce redundant full turns — normalize them to [0, 2π).' })
  }
  if (issues.length === 0) {
    issues.push({ level: 'info', message: 'No issues detected. Your circuit looks structurally sound — run it to see the outcomes.' })
  }
  return issues
}

function codeFor(main: string): { title: string; code: string } {
  const bell = { title: 'Bell State', code: 'qc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])' }
  const superposition = { title: 'Superposition', code: 'qc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.h(1)\nqc.measure([0, 1], [0, 1])' }
  const teleport = {
    title: 'Teleportation (Bell measurement)', code: 'qc = QuantumCircuit(3, 3)\n# Bell pair on q1-q2\nqc.h(1)\nqc.cx(1, 2)\n# Alice entangles q0 with her Bell qubit\nqc.cx(0, 1)\nqc.h(0)\nqc.measure([0, 1], [0, 1])\n# (recover on q2 with Z then X, conditioned on results)\nqc.cz(1, 2)\nqc.cx(0, 2)',
  }
  const deutsch = {
    title: 'Deutsch–Jozsa', code: 'qc = QuantumCircuit(3, 2)\nqc.x(2)\nqc.h([0, 1, 2])\nqc.cx(0, 2)\nqc.h([0, 1])\nqc.measure([0, 1], [0, 1])',
  }
  if (main.includes('teleport')) return teleport
  if (main.includes('superposition')) return superposition
  if (main.includes('deutsch')) return deutsch
  return bell
}

function paragraph(...lines: string[]): string {
  return lines.join('\n')
}

export function answerQuestion(ctx: TutorContext): TutorReply {
  const q = ctx.question.toLowerCase()
  return (() => {
    if (q.includes('debug')
      || q.includes('fix')
      || q.includes('why isn')
      || q.includes('why am i not')
      || q.includes('error')) {
      const issues = ctx.circuit ? debugCircuit(ctx.circuit) : []
      if (ctx.circuit && issues.length) {
        return {
          text: paragraph(
            `I analyzed your current circuit in the Lab:`,
            ...issues.map((i) => `- **${i.level === 'error' ? '❌' : i.level === 'warn' ? '⚠️' : '💡'}** ${i.message}`),
            '',
            'The most common cause of "no entanglement" is a CNOT firing before any superposition is created. Give me your expected vs. actual outcome and I can drill deeper.',
          ),
          suggestions: SUGGESTIONS,
        }
      }
      return {
        text: paragraph(
          'I need to see the circuit to debug it — open the **Quantum Lab**, build a circuit, then hit **Run** so I can read the state vector and warnings. From your description, common pitfalls are:',
          '- CNOT applied before any H gate (no superposition to entangle).',
          '- Forgetting measurement gates, so the histogram stays empty.',
          '- Expecting entanglement but only preparing separable rotations.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('explain my circuit') || q.includes('explain this circuit') || q.includes('what does my circuit') || q.includes('what do i have')) {
      if (ctx.circuit) return { text: explainCircuitMarkdown(ctx.circuit, ctx.result), suggestions: SUGGESTIONS }
      return { text: 'I can explain any circuit once you build it. Head to the **Lab**, drop a few gates, and press "Run" — then I\'ll walk through exactly what your circuit computes.', suggestions: SUGGESTIONS }
    }

    if (q.includes('generate') || q.includes('write') || q.includes('code for')) {
      const c = codeFor(q)
      return {
        text: paragraph(`Sure — here's Qiskit code for a **${c.title}**:`, '```python', c.code, '```', 'Paste this into the Lab’s **Code mode** and press Apply to rebuild the circuit on canvas.'),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('hadamard') || q.includes('h gate')) {
      return {
        text: paragraph(
          'The **Hadamard gate (H)** is the engine of superposition.',
          '',
          `H maps the basis states like this:`,
          '- H |0⟩ → (|0⟩ + |1⟩) / √2',
          '- H |1⟩ → (|0⟩ − |1⟩) / √2',
          '',
          'So a qubit in |0⟩ becomes an **equal 50/50 blend** of |0⟩ and |1⟩. Apply H a second time and you *undo* it (H² = I). That “blend” is what quantum algorithms exploit — a single qubit can carry information about both basis states at once.',
          '',
          'Try it in the Lab: add H to q0 and run. Your histogram will show ~50% |0⟩ and ~50% |1⟩.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('cnot') || q.includes('controlled-x') || q.includes('cx ')) {
      return {
        text: paragraph(
          'The **CNOT (CX)** gate is a controlled-X:',
          '',
          '- If the **control** qubit is |1⟩, a Pauli-X (NOT) is applied to the **target**.',
          '- If the control is |0⟩, the target is left alone.',
          '',
          'On its own CNOT is purely classical — it copies a bit. The magic happens **combined with H**: H|0⟩ creates superposition, and CNOT then couples the two qubits so measuring one instantly reveals the other. That shared state is an **entangled Bell state**: (|00⟩ + |11⟩)/√2.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('entangl') || q.includes('bell')) {
      return {
        text: paragraph(
          '**Entanglement** is a correlation between qubits that has no classical equivalent.',
          '',
          'In a Bell state (|00⟩ + |11⟩)/√2 the two qubits are perfectly anti-independent: measure one and the other is instantly determined, regardless of distance. It is *not* just a hidden coin — a Bell-CHSH test shows the correlations violate Bell’s inequalities, ruling out any “pre-existing answer” explanation.',
          '',
          'Build it in 30 seconds: `H` on q0, `CX` on q1 (controlled by q0), then measure both. The histogram will show only **00** and **11** — never 01 or 10.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('superposition')) {
      return {
        text: paragraph(
          '**Superposition** is a qubit’s ability to be a complex-weighted blend of basis states.',
          '',
          'Mathematically, a qubit state is α|0⟩ + β|1⟩ where |α|² + |β|² = 1. The coefficients are called *amplitudes* — they are not probabilities yet. Only measurement collapses the blend, and you see |0⟩ with probability |α|².',
          '',
          'The H gate turns |0⟩ into an equal blend; RY(θ) can produce any 50/50-free mix. Open the Lab and watch the **state vector panel** change as you add gates.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('qubit')) {
      return {
        text: paragraph(
          'A **qubit** is the quantum analog of a bit — but instead of being strictly 0 or 1, it lives on the surface of the **Bloch sphere**.',
          '',
          '- Two independent coefficients: amplitudes α, β.',
          '- Can be in **superposition** (blend) of |0⟩ and |1⟩.',
          '- Measurement irreversibly collapses it to a classical 0 or 1.',
          '',
          'Start with Level 1 — Fundamental in the Learn section, where I’ve lined up interactive lessons, or play with one qubit in the Lab and watch its Bloch vector.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('measure')) {
      return {
        text: paragraph(
          '**Measurement** is the bridge from the quantum world to the classical one — and it is destructive.',
          '',
          `Sampling a qubit in state α|0⟩ + β|1⟩ yields 0 with P=|α|² and 1 with P=|β|². The superposition collapses, so a second measurement always returns the same outcome.`,
          '',
          'QubitLabs simulates precision sampling: run **1024 shots** and you’ll see counts converge to the ideal probabilities as the amplitude bars converge.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('gate')) {
      return {
        text: paragraph(
          '**Quantum gates** are reversible operations on qubits — the quantum version of logic gates, except almost all of them are their own inverses.',
          '',
          'The core single-qubit gates form the **Pauli group** (I, X, Y, Z) plus H, S, T and the rotations RX/RY/RZ. The most important two-qubit gate is **CNOT**, which creates entanglement.',
          '',
          'The best way to internalize gates is to build circuits — that’s exactly what the Lab is for. Try chaining H → Z → H and watch the phase flips in the state vector.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('grover')) {
      return {
        text: paragraph(
          '**Grover’s algorithm** searches an unstructured N-item space in O(√N), a quadratic speedup over classical search.',
          '',
          'Structure:',
          '- **Phase 1 — Superposition:** H on every qubit.',
          '- **Phase 2 — Oracle:** flip the sign of the target element.',
          '- **Phase 3 — Diffusion:** invert about the mean to amplify the target amplitude.',
          '- Iterate ~π√N/4 times, then measure.',
          '',
          'The Challenges section has a Grover challenge to build one step by step.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('simulate') || q.includes('backend') || q.includes('aer')) {
      return {
        text: paragraph(
          'Simulation executes your circuit as linear algebra on a state vector.',
          '',
          '- **Qiskit Aer**: fast pure-state simulator (statevector + counts).',
          '- **PennyLane**: same circuit, differentiable engine (great for ML on qubits).',
          '- **Cirq / qBraid**: alternate frontends with the same result contract.',
          '',
          'QubitLabs normalizes every backend to one JSON result `{counts, probabilities, statevector, executionTime}`, so your workflow never changes.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('plan') || q.includes('roadmap') || q.includes('path') || q.includes('learn grover') || q.includes('start learning')) {
      return {
        text: paragraph(
          'Here’s a **7-day plan** for Grover’s algorithm:',
          '',
          '- **Day 1:** Qubits & the Bloch sphere (Level 1).',
          '- **Day 2:** Superposition with H, build it in the Lab.',
          '- **Day 3:** Circuits & entanglement — build a Bell state.',
          '- **Day 4:** Oracles & reflection operators (theory).',
          '- **Day 5:** Grover’s iteration — build a 2-qubit version in the Lab.',
          '- **Day 6:** Run, measure, plot the amplified target.',
          '- **Day 7:** Attempt the Grover challenge here.',
          '',
          'Tip: your Progress page tracks this automatically as you complete lessons.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('fail') || q.includes('challenge')) {
      return {
        text: paragraph(
          'Challenges are graded against **requirements** (qubit count, required gates, measurement):',
          '',
          '- Open the challenge → *Open Lab* loads a starter circuit.',
          '- Build the solution, then *Run & Evaluate*.',
          '- The checker inspects the circuit *and* the simulated results.',
          '',
          'Completing a challenge grants **XP** and unlocks badges on your Progress page.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return {
        text: paragraph(
          'Hey! I’m your **Quantum Tutor** 👋',
          '',
          'I can explain concepts, read your live circuit in the Lab, debug why a result looks wrong, or generate Qiskit code. Ask me things like:',
          '- “Why is it not entangled?”',
          '- “How does a CNOT work?”',
          '- “Generate a Bell state.”',
          '',
          'I also see your current lesson and progress, so I can keep explanations targeted.',
        ),
        suggestions: SUGGESTIONS,
      }
    }

    return {
      text: paragraph(
        'I can help with quantum concepts, circuit debugging, Qiskit code generation, or a learning roadmap.',
        '',
        'Try one of the suggestions below, or rephrase — e.g. *“explain superposition”*, *“why is my circuit not entangled”*, or *“generate a Bell state circuit”*.',
      ),
      suggestions: SUGGESTIONS,
    }
  })()
}