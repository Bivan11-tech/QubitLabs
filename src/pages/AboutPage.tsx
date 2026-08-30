import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">About QubitLabs</h1>
      <div className="mt-6 space-y-4 text-slate-300 leading-relaxed">
        <p>
          <strong>Background.</strong> Quantum computing is transforming science and industry, but education stays abstract,
          static and hard to access. Real hardware is limited, and most resources are text-heavy with no hands-on interaction.
        </p>
        <p>
          <strong>Our answer.</strong> QubitLabs is an AI-powered interactive platform that unifies theoretical instruction,
          visual circuit design, real-time simulation and personalized AI guidance in one learning loop:
          <em> Learn → Build → Run → Visualize → Ask AI → Practice → Track</em>.
        </p>
        <p>
          <strong>For the demo.</strong> The frontend ships its own browser-based state-vector simulator, so every circuit
          produces genuine measurement histograms, state vectors and Bloch vectors with no backend. It speaks the same
          <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-accent-300">/api/simulate</code> contract that a Qiskit Aer,
          PennyLane, Cirq or qBraid service would serve, so wiring a real engine later changes nothing in the Lab UI.
        </p>
        <p>
          Built as an internal SIH demo build. The single most important architecture decision, per the spec:
          the circuit lives as a framework-independent data structure in the frontend, and the visual editor, code generator,
          simulator, visualizations and AI tutor all consume that one source of truth.
        </p>
      </div>
      <Link to="/" className="btn-primary mt-8 px-5 py-2.5">Back to home</Link>
    </div>
  )
}