export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  id: string
  title: string
  minutes: number
  summary: string[]
  concepts: { title: string; body: string }[]
  example?: { text: string; qubits: number; gates: { type: string; qubit: number; moment: number }[] }
  quiz: QuizQuestion[]
}

export interface Course {
  id: string
  level: number
  title: string
  tagline: string
  color: string
  lessons: Lesson[]
}

export const COURSES: Course[] = [
  {
    id: 'fundamentals',
    level: 1,
    title: 'Fundamentals',
    tagline: 'What is a qubit, superposition, and measurement',
    color: '#22d3ee',
    lessons: [
      {
        id: 'qubit',
        title: 'What is a Qubit?',
        minutes: 8,
        summary: [
          'A qubit is the fundamental unit of quantum information — the quantum analog of a classical bit.',
          'Unlike a bit that is only 0 or 1, a qubit can live in any blend of both.',
        ],
        concepts: [
          { title: 'Bits vs Qubits', body: 'A classical bit is binary: 0 or 1. A qubit is a two-level quantum system whose state is α|0⟩ + β|1⟩, a \u2018ket\u2019 notation where α and β are complex amplitudes with |α|² + |β|² = 1.' },
          { title: 'The Bloch sphere', body: 'Every pure qubit state is a point on the surface of a sphere. The north pole is |0⟩, the south pole is |1⟩, and every point in between is a superposition. This geometric picture is why single-qubit operations are referred to as rotations.' },
        ],
        example: { text: 'A lone qubit in |0⟩. Run it to confirm the state vector stays 1 + 0i for |0⟩.', qubits: 1, gates: [] },
        quiz: [
          { q: 'How many complex amplitudes describe a single qubit?', options: ['1', '2', '3', '4'], answer: 1, explain: 'A qubit state α|0⟩ + β|1⟩ needs two amplitudes: α and β.' },
          { q: 'The state of a pure qubit corresponds to a point on a…', options: ['Cube', 'Plane', 'Sphere', 'Line'], answer: 2, explain: 'The Bloch sphere — every pure single-qubit state lives on its surface.' },
        ],
      },
      {
        id: 'superposition',
        title: 'Superposition',
        minutes: 10,
        summary: [
          'Superposition lets a qubit hold both basis states at once, weighted by amplitudes.',
          'It is the source of quantum parallelism.',
        ],
        concepts: [
          { title: 'What superposition really is', body: 'A qubit in superposition is not "both 0 and 1" in a naive sense — it is a coherent complex linear combination. The H gate maps |0⟩ → (|0⟩ + |1⟩)/√2, an equal 50/50 blend.' },
          { title: 'Amplitudes vs probabilities', body: 'Amplitudes are complex numbers; probabilities are their squared magnitudes. Two amplitudes can point in opposite directions (signs/phases) and cancel — interference, which classical probabilities cannot express.' },
        ],
        example: { text: 'H on q0. The histogram should split ~50/50 between 0 and 1.', qubits: 1, gates: [{ type: 'H', qubit: 0, moment: 0 }] },
        quiz: [
          { q: 'What does the H gate do to |0⟩?', options: ['Flips it to |1⟩', 'Creates an equal superposition', 'Adds a global phase', 'Does nothing'], answer: 1, explain: 'H|0⟩ = (|0⟩ + |1⟩)/√2 — an equal superposition.' },
          { q: 'Upon measurement, a qubit in equal superposition shows…', options: ['Always 0', 'Always 1', '0 with 50% probability', '0 with 25% probability'], answer: 2, explain: '|H|0⟩| has equal amplitudes, hence equal probabilities.' },
        ],
      },
      {
        id: 'measurement',
        title: 'Measurement & collapse',
        minutes: 9,
        summary: [
          'Measurement collapses a superposition into a classical outcome.',
          'It is irreversible and defines what you can actually observe.',
        ],
        concepts: [
          { title: 'Born rule', body: 'Measuring |ψ⟩ = Σ cᵢ|i⟩ yields outcome i with probability |cᵢ|². The system then collapses to |i⟩, so a repeated measurement gives the same answer.' },
          { title: 'Destructive nature', body: 'Collapse destroys the original amplitudes. This is why algorithms put all clever computation into unitary (reversible) steps before the single final readout.' },
        ],
        example: { text: 'H then measure. Each run collapses to 0 or 1; across 1024 shots you get fine-grained red or blue slices.', qubits: 1, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'Measure', qubit: 0, moment: 1 }] },
        quiz: [
          { q: 'What does |α|² represent?', options: ['Amplitude', 'Probability of measuring |0⟩', 'Phase', 'Gate count'], answer: 1, explain: 'The Born rule — probability is modulus-squared amplitude.' },
          { q: 'After measuring a qubit and collapsing it, re-measuring yields…', options: ['The opposite value', 'The same value', 'Random value', 'Impossible'], answer: 1, explain: 'Collapse locks the state; a second measurement repeats the result.' },
        ],
      },
      {
        id: 'bloch',
        title: 'The Bloch Sphere',
        minutes: 7,
        summary: [
          'A visual map of all single-qubit states.',
          'Read qubit states like a compass.',
        ],
        concepts: [
          { title: 'Coordinates', body: 'A pure qubit state can be written cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩. θ is the latitude and φ the longitude on the Bloch sphere.' },
          { title: 'Reading the Lab', body: 'In the Lab’s Bloch Sphere tab, a vector pointing Up is |0⟩, Down is |1⟩, and horizontal points are superpositions. East/West tilt encodes phase.' },
        ],
        example: { text: 'RY(π/2) rotates the Bloch vector from Up to the equator — a superposition.', qubits: 1, gates: [{ type: 'RY', qubit: 0, moment: 0 }] },
        quiz: [
          { q: 'On the Bloch sphere, |1⟩ sits at the…', options: ['North pole', 'South pole', 'Equator', 'Center'], answer: 1, explain: 'North is |0⟩, south is |1⟩.' },
          { q: 'A state on the equator has measurement probabilities…', options: ['100/0', '0/100', '50/50', 'Varies'], answer: 2, explain: 'Equator → equal projection to both poles → 50/50.' },
        ],
      },
    ],
  },
  {
    id: 'gates',
    level: 2,
    title: 'Quantum Gates',
    tagline: 'Pauli, Hadamard, rotations and controlled operations',
    color: '#818cf8',
    lessons: [
      {
        id: 'pauli',
        title: 'Pauli Gates (X, Y, Z)',
        minutes: 10,
        summary: [
          'X flips bits; Z flips phases; Y does both.',
          'They are the building blocks of all qubit operations.',
        ],
        concepts: [
          { title: 'Pauli-X', body: 'X maps |0⟩↔|1⟩ — called the quantum NOT or bit-flip. It is the qubit analog of a classical NOT.' },
          { title: 'Pauli-Z', body: 'Z leaves |0⟩ alone and maps |1⟩ → −|1⟩. A phase-flip with no measurable basis change until the qubit is put into superposition.' },
        ],
        example: { text: 'X then H: X flips |0⟩→|1⟩, then H makes (−|0⟩ + |1⟩)/√2 with a distinctive − sign.', qubits: 1, gates: [{ type: 'X', qubit: 0, moment: 0 }, { type: 'H', qubit: 0, moment: 1 }] },
        quiz: [
          { q: 'X|1⟩ =', options: ['−|1⟩', '|0⟩', '|1⟩', '0'], answer: 1, explain: 'X is the bit flip.' },
          { q: 'Z|1⟩ =', options: ['|1⟩', '−|1⟩', '|0⟩', 'i|1⟩'], answer: 1, explain: 'Z flips the sign of |1⟩.' },
        ],
      },
      {
        id: 'hadamard',
        title: 'Hadamard & Phase (S, T)',
        minutes: 10,
        summary: [
          'H creates superposition; S and T sculpt the phase.',
          'Together they allow arbitrary single-qubit rotations.',
        ],
        concepts: [
          { title: 'Hadamard', body: 'H is its own inverse (H² = I). It maps |0⟩ ↔ (|0⟩+|1⟩)/√2 and |1⟩ ↔ (|0⟩−|1⟩)/√2 — the two most useful bases in quantum computing.' },
          { title: 'S and T', body: 'S applies π/2 of phase (i on |1⟩), T applies π/4. T is the non-Clifford ingredient that, combined with H and CNOT, can approximate any quantum computation.' },
        ],
        example: { text: 'H then T then H on q0 — phase π/4 hidden in the superposition.', qubits: 1, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'T', qubit: 0, moment: 1 }, { type: 'H', qubit: 0, moment: 2 }] },
        quiz: [
          { q: 'H² equals…', options: ['X', 'Z', 'Identity', 'H'], answer: 2, explain: 'H is self-inverse.' },
          { q: 'The T gate adds which phase to |1⟩?', options: ['π/2', 'π/4', 'π', '2π'], answer: 1, explain: 'T is the π/4 or 45° phase gate.' },
        ],
      },
      {
        id: 'rotations',
        title: 'Rotation Gates (RX, RY, RZ)',
        minutes: 8,
        summary: [
          'Continuous rotations about the Bloch axes.',
          'Build any target qubit state with two rotations.',
        ],
        concepts: [
          { title: 'Rotation matrices', body: 'RY(θ) rotates the Bloch vector by θ around the Y axis, directly sweeping amplitude between |0⟩ and |1⟩. RX and RZ rotate around X and Z, coupling amplitude and phase.' },
          { title: 'Universal set', body: 'Any unitary on n qubits can be approximated with H, T, and CNOT — rotations make the continuous math approachable in the Lab.' },
        ],
        example: { text: 'RY(π/2) takes |0⟩ to the equator — nothing else in the circuit.', qubits: 1, gates: [{ type: 'RY', qubit: 0, moment: 0 }] },
        quiz: [
          { q: 'RY(π/2)|0⟩ produces…', options: ['|1⟩', 'Equal superposition', 'Phase flip', 'Identity'], answer: 1, explain: 'A 90° rotation to the equator = equal superposition.' },
          { q: 'To build an arbitrary qubit state you need at least…', options: ['One rotation', 'Two rotations', 'Three rotations', 'Four rotations'], answer: 1, explain: 'Z–Y–Z or Y–Z decompositions use two real parameters (θ, φ).' },
        ],
      },
      {
        id: 'controlled',
        title: 'Controlled Gates',
        minutes: 12,
        summary: [
          'Control qubits switch operations on targets.',
          'The CNOT is the entangler at the heart of computation.',
        ],
        concepts: [
          { title: 'CNOT', body: 'CX applies X to the target only when the control is |1⟩. Combined with H it produces the Bell state — the simplest entangled pair.' },
          { title: 'Why controlled gates matter', body: 'They couple qubits so amplitudes of one qubit depend on another, enabling entanglement and, with it, exponential information capacity.' },
        ],
        example: { text: 'H → CX: the classic Bell state. Only |00⟩ and |11⟩ ever appear.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'CX', qubit: 0, moment: 1 }, { type: 'Measure', qubit: 0, moment: 2 }, { type: 'Measure', qubit: 1, moment: 2 }] },
        quiz: [
          { q: 'For the Bell state, the histogram has nonzero bars in…', options: ['All 4 states', '00 and 11 only', '01 and 10 only', 'Only 00'], answer: 1, explain: '|00⟩+|11⟩ over √2 — anti-correlated outcomes.' },
          { q: 'CX(control=0, target=1) acts on |10⟩ as…', options: ['|11⟩', '|10⟩', '|01⟩', '|00⟩'], answer: 0, explain: 'Control is 1, so the target flips: 10 → 11.' },
        ],
      },
    ],
  },
  {
    id: 'circuits',
    level: 3,
    title: 'Quantum Circuits',
    tagline: 'Design principles, entanglement, and Bell states',
    color: '#34d399',
    lessons: [
      {
        id: 'circuit-design',
        title: 'Circuit Design',
        minutes: 9,
        summary: [
          'A circuit is a time-ordered sequence of gates on wires.',
          'Design rules: keep it reversible, mind the wires.',
        ],
        concepts: [
          { title: 'Reading a circuit', body: 'Each horizontal line is a qubit. Gates read left-to-right (time flows right). Vertical meetings are two-qubit gates; the ● is the control and ⊕ the target.' },
          { title: 'The golden rule', body: 'Unitary circuits are reversible — every gate has an inverse. Measurement is the only non-reversible step and belongs at the very end of the computational part.' },
        ],
        example: { text: 'A small two-qubit circuit mixing H and X before measurement.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'X', qubit: 1, moment: 0 }, { type: 'H', qubit: 0, moment: 1 }] },
        quiz: [
          { q: 'Which step is irreversible?', options: ['Rotation', 'CNOT', 'Measurement', 'Hadamard'], answer: 2, explain: 'Measurement collapses the state.' },
          { q: 'On a circuit diagram, time flows…', options: ['Bottom-up', 'Left-to-right', 'Right-to-left', 'Top-down'], answer: 1, explain: 'Gates are applied in reading order.' },
        ],
      },
      {
        id: 'entanglement',
        title: 'Entanglement',
        minutes: 14,
        summary: [
          'Entanglement links qubits beyond any classical correlation.',
          'It is Einstein’s "spooky action" made testable.',
        ],
        concepts: [
          { title: 'What entanglement is', body: 'A composite state that cannot be written as a product of single-qubit states. Measuring one qubit instantly determines the other — no classical bit-copy can reproduce the correlations.' },
          { title: 'In the Lab', body: 'The results panel reports entanglement automatically by tracing out a qubit: a pure reduced state means separable, a mixed one means entangled.' },
        ],
        example: { text: 'The same Bell recipe — watch the entanglement badge light up.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'CX', qubit: 0, moment: 1 }, { type: 'Measure', qubit: 0, moment: 2 }, { type: 'Measure', qubit: 1, moment: 2 }] },
        quiz: [
          { q: 'A state is entangled if it cannot be written as…', options: ['A unit vector', 'A product of single-qubit states', 'A sum of kets', 'A pure state'], answer: 1, explain: 'Product-separability is the definition of "not entangled".' },
          { q: 'The Bell state is symbolically…', options: ['|00⟩', '|01⟩+|10⟩ over √2', '(|00⟩+|11⟩)/√2', '|11⟩'], answer: 2, explain: 'Maximally entangled, perfect anti-correlation.' },
        ],
      },
      {
        id: 'bell-states',
        title: 'Bell States & Teleportation',
        minutes: 15,
        summary: [
          'The four maximally entangled Bell states.',
          'Teleportation: move a qubit using entanglement + 2 classical bits.',
        ],
        concepts: [
          { title: 'Four Bell states', body: '|Φ±⟩ = (|00⟩ ± |11⟩)/√2 and |Ψ±⟩ = (|01⟩ ± |10⟩)/√2. They differ by X and Z on one qubit — reachable via H, CNOT and phase gates.' },
          { title: 'Teleportation scheme', body: 'Alice and Bob share a Bell pair. Alice entangles her qubit with hers, measures (2 classical bits), and Bob applies X^a Z^b to recover the original state exactly.' },
        ],
        example: { text: 'Build |Φ+⟩ with H then CX, exactly as the challenge expects.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'CX', qubit: 0, moment: 1 }, { type: 'Measure', qubit: 0, moment: 2 }, { type: 'Measure', qubit: 1, moment: 2 }] },
        quiz: [
          { q: 'How many Bell states exist?', options: ['1', '2', '4', '8'], answer: 2, explain: 'Two CNOT families × sign = four.' },
          { q: 'Teleportation requires how many classical bits?', options: ['0', '1', '2', '3'], answer: 2, explain: 'The two measurement outcomes (2 classical bits).' },
        ],
      },
    ],
  },
  {
    id: 'algorithms',
    level: 4,
    title: 'Algorithms',
    tagline: 'Deutsch-Jozsa, Grover search, QFT and Shor',
    color: '#fbbf24',
    lessons: [
      {
        id: 'deutsch-jozsa',
        title: 'Deutsch–Jozsa',
        minutes: 12,
        summary: [
          'First algorithm to beat any classical machine.',
          'One query decides constant vs balanced oracles.',
        ],
        concepts: [
          { title: 'The problem', body: 'Given a black-box function that is either constant or balanced, decided classically needs 2^(n-1)+1 queries in the worst case. Deutsch–Jozsa needs exactly one!' },
          { title: 'How it works', body: 'Put n+1 qubits in superposition, query the oracle (which applies phase kicks), then apply H again. All outputs |0⟩ means constant; any |1⟩ means balanced.' },
        ],
        example: { text: 'Balanced oracle setup: X + H + CNOTs — all ancilla’s H’s yield |1⟩ on measurement.', qubits: 3, gates: [{ type: 'X', qubit: 2, moment: 0 }, { type: 'H', qubit: 0, moment: 1 }, { type: 'H', qubit: 1, moment: 1 }, { type: 'H', qubit: 2, moment: 1 }, { type: 'CX', qubit: 0, moment: 2 }, { type: 'H', qubit: 0, moment: 3 }, { type: 'H', qubit: 1, moment: 3 }] },
        quiz: [
          { q: 'Classical worst-case queries for 2-bit Deutsch–Jozsa:…', options: ['1', '2', '3', '4'], answer: 2, explain: '2^(n-1)+1 = 3 for n=2.' },
          { q: 'If every measured register qubit is |0⟩, the function is…', options: ['Balanced', 'Constant', 'Unknown', 'Broken'], answer: 1, explain: 'All-zero reads out "constant".' },
        ],
      },
      {
        id: 'grover',
        title: 'Grover’s Algorithm',
        minutes: 16,
        summary: [
          'Quadratic speedup for unstructured search.',
          'Amplitude amplification pinpoints the target.',
        ],
        concepts: [
          { title: 'Setup', body: 'Start with a uniform superposition, then iterate: (1) oracle flips the target amplitude’s sign, (2) diffusion operator inverts all amplitudes about the mean. Each iteration boosts the target.' },
          { title: 'Size of speedup', body: 'Searching N = 2ⁿ items needs O(√N) Grover iterations vs O(N) classically. After ~π√N/4 iterations the target amplitude is maximal — measure!' },
        ],
        example: { text: 'A 2-qubit Grover skeleton: H, oracle scaffolding, H, and amplification.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'H', qubit: 1, moment: 0 }, { type: 'X', qubit: 0, moment: 1 }, { type: 'H', qubit: 1, moment: 1 }, { type: 'CX', qubit: 0, moment: 2 }, { type: 'H', qubit: 1, moment: 3 }, { type: 'X', qubit: 0, moment: 4 }, { type: 'H', qubit: 0, moment: 5 }, { type: 'H', qubit: 1, moment: 5 }, { type: 'X', qubit: 0, moment: 6 }, { type: 'X', qubit: 1, moment: 6 }, { type: 'CX', qubit: 0, moment: 7 }, { type: 'H', qubit: 1, moment: 8 }, { type: 'X', qubit: 0, moment: 9 }, { type: 'X', qubit: 1, moment: 9 }, { type: 'H', qubit: 0, moment: 10 }, { type: 'H', qubit: 1, moment: 10 }] },
        quiz: [
          { q: 'Grover search of 1024 items needs about…', options: ['1024 iterations', '512', '128', '32'], answer: 3, explain: 'O(√N) ≈ 32 iterations (π√1024/4 ≈ 25).' },
          { q: 'The diffusion operator is often described as…', options: ['Inversion about mean', 'Phase kick', 'Measurement', 'Parameter scan'], answer: 0, explain: 'It flips every amplitude around the average.' },
        ],
      },
      {
        id: 'qft',
        title: 'Quantum Fourier Transform',
        minutes: 13,
        summary: [
          'The QFT maps amplitudes to phases over the computational basis.',
          'The engine inside Shor, phase estimation, and more.',
        ],
        concepts: [
          { title: 'Intuition', body: 'For n qubits on a register, QFT converts a computational-basis state into a superposition of all states weighted by phases e^{2πi k·x / 2ⁿ} — time-domain to frequency-domain for qubits.' },
          { title: 'Structure', body: 'It is built purely from H gates and controlled-rotations (R_k = RZ paths), with qubit reordering at the end.' },
        ],
        example: { text: 'A tiny 2-qubit QFT: H, controlled-RZ(π/2), then SWAP.', qubits: 2, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'CZ', qubit: 0, moment: 1 }, { type: 'H', qubit: 1, moment: 2 }, { type: 'SWAP', qubit: 0, moment: 3 }] },
        quiz: [
          { q: 'QFT is built from which two gate families?', options: ['X and Y', 'H and controlled-rotations', 'Only Pauli', 'Only CNOT'], answer: 1, explain: 'H forces the spread; controlled phase rotations encode the frequencies.' },
          { q: 'QFT underlies…', options: ['Only games', 'Shor & phase estimation', 'Classical DRAM', 'Error correction only'], answer: 1, explain: 'It is the workhorse of period-finding.' },
        ],
      },
      {
        id: 'shor',
        title: 'Shor’s Algorithm',
        minutes: 14,
        summary: [
          'Factor integers in polynomial time.',
          'Combines modular exponentiation with QFT-based phase estimation.',
        ],
        concepts: [
          { title: 'Idea', body: 'To factor N, pick a, compute f(x) = aˣ mod N, and find its period r using the QFT. Then gcd(a^{r/2} ± 1, N) often yields a factor.' },
          { title: 'Impact', body: 'This breaks RSA, the basis of most encryption. Real quantum computers now factor numbers, but with far more qubits and error correction than are available for real RSA keys.' },
        ],
        example: { text: 'A conceptual scaffold: the register qubits get Hadamards, physics is captured in the controlled operations between registers.', qubits: 4, gates: [{ type: 'H', qubit: 0, moment: 0 }, { type: 'H', qubit: 1, moment: 0 }, { type: 'H', qubit: 2, moment: 0 }, { type: 'X', qubit: 3, moment: 0 }, { type: 'CX', qubit: 0, moment: 1 }] },
        quiz: [
          { q: 'Shor’s algorithm reduces factoring to…', options: ['Search', 'Period-finding', 'Groversampling', 'Tensor contraction'], answer: 1, explain: 'Period of modular exponentiation via QFT.' },
          { q: 'The security of RSA relies on…', options: ['Quantum speed', 'Hardness of factoring', 'Prime count', 'Key length only'], answer: 1, explain: 'Classical factoring is hard; Shor erases that assumption.' },
        ],
      },
    ],
  },
]

export function findCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id)
}

export function findLesson(courseId: string, lessonId: string): Lesson | undefined {
  return findCourse(courseId)?.lessons.find((l) => l.id === lessonId)
}

export const TOTAL_LESSONS = COURSES.reduce((acc, c) => acc + c.lessons.length, 0)