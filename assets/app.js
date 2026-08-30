
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const app = $("#app");

const defaultState = {
  user: {name:"Quantum Learner", email:"learner@example.com", level:"Beginner"},
  progress: {superposition:65, entanglement:35, gates:80, algorithms:20},
  circuit: [
    ["H","","","CX","","","",""],
    ["","","","X","","","",""],
  ],
  code: `from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

print(qc)`,
  messages: [
    {role:"ai", text:"Hi! I’m your quantum tutor. Ask me about qubits, gates, circuits, algorithms, or the lab."}
  ],
  settings:{theme:"dark", notifications:true}
};
let state = JSON.parse(localStorage.getItem("qlearn-state") || "null") || structuredClone(defaultState);
function save(){ localStorage.setItem("qlearn-state", JSON.stringify(state)); }
function toast(t){ const x=document.createElement("div");x.className="toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2200); }
function route(){ return location.hash.slice(1) || "/"; }
function nav(path){ location.hash=path; window.scrollTo(0,0); }

function layout(content, title="Quantum Learning Platform"){
  document.title=title;
  return `<div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#/"><span class="logo">Q</span><span>Quantum<span class="gradient">Lab</span></span></a>
      <nav class="nav">
        ${["/dashboard","/learn","/lab","/challenges","/tutor","/progress"].map((p)=>`<button class="${route()===p?'active':''}" data-nav="${p}">${p.slice(1).replace("-"," ")}</button>`).join("")}
      </nav>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="icon-btn" data-nav="/settings">⚙</button>
        <button class="icon-btn" data-nav="/profile">◉</button>
      </div>
    </header>${content}<div class="footer">Quantum Learning Platform · Static frontend demo</div></div>`;
}
function page(body){return `<main class="page">${body}</main>`}

const courses=[
 {id:"superposition",title:"Quantum Superposition",desc:"Understand how a qubit can be represented as a combination of basis states.",level:"Beginner",progress:65,lessons:8},
 {id:"entanglement",title:"Entanglement",desc:"Explore correlations between quantum systems and the foundations of quantum communication.",level:"Beginner",progress:35,lessons:7},
 {id:"gates",title:"Quantum Gates",desc:"Build intuition for H, X, Y, Z, controlled gates and circuit composition.",level:"Beginner",progress:80,lessons:10},
 {id:"algorithms",title:"Quantum Algorithms",desc:"Move from circuits to Grover, Deutsch–Jozsa and other algorithmic ideas.",level:"Intermediate",progress:20,lessons:12},
];

function landing(){
 return layout(`<main class="page">
  <section class="hero">
   <div>
    <span class="badge">INTERACTIVE QUANTUM EDUCATION</span>
    <h1>Learn quantum.<br><span class="gradient">Build circuits.</span><br>Run experiments.</h1>
    <p>A hands-on learning platform for qubits, superposition, entanglement, quantum gates and algorithms — combining guided lessons with a visual quantum lab and code workspace.</p>
    <div class="actions"><button class="btn primary" data-nav="/dashboard">Enter the platform →</button><button class="btn" data-nav="/lab">Open Quantum Lab</button></div>
   </div>
   <div class="card">
    <div class="small muted">LIVE CIRCUIT PREVIEW</div>
    <div class="circuit" style="margin-top:12px">
      <div class="wire"><div class="wire-label">q0</div>${["H","","●","","M","","",""].map((x,i)=>`<div class="cell">${x?`<span class="gate">${x}</span>`:""}</div>`).join("")}</div>
      <div class="wire"><div class="wire-label">q1</div>${["","","X","","M","","",""].map((x,i)=>`<div class="cell">${x?`<span class="gate">${x}</span>`:""}</div>`).join("")}</div>
    </div>
    <div class="stat-row" style="margin-top:16px"><span>Backend</span><strong>Qiskit Aer · demo</strong></div>
    <div class="stat-row"><span>State</span><strong>Ready to run</strong></div>
   </div>
  </section>
  <section class="section-title"><h2>Why this platform</h2></section>
  <div class="grid grid-3">
   ${[["01","Learn visually","Interactive concepts replace purely static explanations."],["02","Build circuits","Place quantum gates on a visual circuit grid and experiment."],["03","Understand results","Inspect measurement probabilities and connect them to the theory."]].map(x=>`<div class="card"><span class="badge">${x[0]}</span><h3 style="margin-top:14px">${x[1]}</h3><p class="muted">${x[2]}</p></div>`).join("")}
  </div>
 </main>`);
}

function dashboard(){
 return layout(page(`<div class="section-title"><div><span class="badge">LEARNING DASHBOARD</span><h1 style="margin:8px 0">Welcome back, ${state.user.name.split(" ")[0]}.</h1><p class="muted">Continue your quantum learning journey.</p></div><button class="btn primary" data-nav="/lab">Launch Lab →</button></div>
 <div class="grid grid-4">
  <div class="card"><div class="small muted">LESSONS COMPLETED</div><div class="kpi">18</div><div class="muted small">of 42 total</div></div>
  <div class="card"><div class="small muted">LAB RUNS</div><div class="kpi">27</div><div class="muted small">this learning cycle</div></div>
  <div class="card"><div class="small muted">CHALLENGE SCORE</div><div class="kpi">780</div><div class="muted small">+120 this week</div></div>
  <div class="card"><div class="small muted">CURRENT LEVEL</div><div class="kpi">3</div><div class="muted small">Circuit Explorer</div></div>
 </div>
 <div class="section-title"><h2>Continue learning</h2><button class="btn" data-nav="/learn">View all</button></div>
 <div class="grid grid-2">${courses.slice(0,2).map(courseCard).join("")}</div>
 <div class="section-title"><h2>Quick actions</h2></div>
 <div class="grid grid-3">
  <div class="card"><h3>Build a Bell state</h3><p class="muted">Create H + CX and inspect the output.</p><button class="btn primary" data-nav="/lab">Start experiment</button></div>
  <div class="card"><h3>Ask the tutor</h3><p class="muted">Get an explanation of a quantum concept.</p><button class="btn" data-nav="/tutor">Open tutor</button></div>
  <div class="card"><h3>Take a challenge</h3><p class="muted">Test your understanding with interactive questions.</p><button class="btn" data-nav="/challenges">Practice</button></div>
 </div>`));
}
function courseCard(c){return `<div class="card course-card"><div><span class="badge">${c.level}</span><h3 style="margin-top:13px">${c.title}</h3><p class="muted">${c.desc}</p></div><div class="bottom"><div class="stat-row"><span>${c.lessons} lessons</span><strong>${c.progress}%</strong></div><div class="progress"><span style="width:${c.progress}%"></span></div><button class="btn" style="margin-top:13px" data-nav="/learn/${c.id}/1">Continue →</button></div></div>`}

function learn(){
 return layout(page(`<div class="section-title"><div><span class="badge">LEARNING PATH</span><h1 style="margin:8px 0">Explore quantum computing</h1><p class="muted">Move from fundamentals to algorithms through short, practical lessons.</p></div></div>
 <div class="grid grid-2">${courses.map(courseCard).join("")}</div>
 <div class="section-title"><h2>Learning path</h2></div>
 <div class="card timeline">
  ${["Qubits & measurement","Superposition","Quantum gates","Entanglement","Circuit design","Quantum algorithms"].map((x,i)=>`<div class="timeline-item"><strong>${i+1}. ${x}</strong><div class="muted small">${i<3?"Core foundation":"Next step"} · ${i<3?"Available now":"Unlock as you progress"}</div></div>`).join("")}
 </div>`));
}
function lesson(id){
 const c=courses.find(x=>x.id===id)||courses[0];
 const concepts={
  superposition:["A qubit can be represented as α|0⟩ + β|1⟩, where the amplitudes determine measurement probabilities.","Apply an H gate to |0⟩ to create an equal superposition in the ideal case."],
  entanglement:["Entanglement creates correlations that cannot be described by treating the qubits as independent classical systems.","A Hadamard followed by a controlled-X gate is a common two-qubit Bell-state example."],
  gates:["Quantum gates transform quantum states while preserving reversibility for unitary operations.","H creates interference between basis states; X flips |0⟩ and |1⟩."],
  algorithms:["Quantum algorithms combine state preparation, controlled transformations and measurement.","Start with circuit intuition before studying algorithm-specific speedups."]
 };
 const parts=concepts[id]||concepts.superposition;
 return layout(page(`<div class="actions"><button class="btn" data-nav="/learn">← Back to Learn</button><button class="btn" data-nav="/lab">Try it in Lab</button></div>
 <div class="grid grid-2" style="margin-top:18px"><article class="card"><span class="badge">${c.level} · LESSON 1</span><h1>${c.title}</h1><p class="muted">${c.desc}</p><hr style="border-color:var(--line);border-width:1px 0 0;margin:22px 0">
 <h2>Core idea</h2><p>${parts[0]}</p><h2>Experiment</h2><p>${parts[1]}</p><div class="card" style="background:#071321;margin-top:18px"><div style="font-size:24px;text-align:center">|ψ⟩ = α|0⟩ + β|1⟩</div></div>
 <h2>Check your understanding</h2><p class="muted">What happens to an ideal |0⟩ state after applying H?</p><button class="choice" data-answer="correct">It becomes an equal superposition of |0⟩ and |1⟩.</button><button class="choice" data-answer="wrong">It is permanently measured as |1⟩.</button>
 </article><aside><div class="card"><div class="small muted">LESSON PROGRESS</div><div class="kpi">${c.progress}%</div><div class="progress"><span style="width:${c.progress}%"></span></div><button class="btn primary" style="width:100%;margin-top:18px" data-complete="${id}">Mark lesson complete</button></div><div class="card" style="margin-top:14px"><h3>Key terms</h3>${["qubit","basis state","amplitude","measurement","interference"].map(t=>`<div class="stat-row" style="padding:9px 0;border-bottom:1px solid var(--line)"><span>${t}</span><span>→</span></div>`).join("")}</div></aside></div>`));
}

function lab(){
 const gates=["H","X","Y","Z","CX","M"];
 const rows=state.circuit.map((row,r)=>`<div class="wire"><div class="wire-label">q${r}</div>${row.map((g,c)=>`<div class="cell" data-cell="${r},${c}">${g?`<span class="gate">${g}</span>`:""}</div>`).join("")}</div>`).join("");
 return layout(page(`<div class="section-title"><div><span class="badge">QUANTUM LAB</span><h1 style="margin:8px 0">Circuit Composer</h1><p class="muted">Place gates on qubit wires, edit code, then run a frontend simulation.</p></div><div class="actions"><button class="btn" data-clear-circuit>Clear</button><button class="btn primary" data-run>Run circuit ▶</button></div></div>
 <div class="lab-toolbar"><span class="muted small">Selected gate:</span><strong id="selectedGate">H</strong>${gates.map(g=>`<button class="btn gate-btn" data-gate="${g}">${g}</button>`).join("")}</div>
 <div class="lab-layout"><div class="card gate-palette"><h3>Gates</h3><p class="muted small">Select a gate, then click a cell.</p>${gates.map(g=>`<button class="btn" data-gate="${g}"><strong>${g}</strong> <span class="muted">${g==="CX"?"controlled X":g==="M"?"measure":g+" gate"}</span></button>`).join("")}</div>
 <div class="card"><div class="circuit">${rows}</div><p class="muted small" style="margin-bottom:0">Tip: H + CX on q0/q1 gives a simple entanglement experiment.</p></div>
 <div class="card"><div class="tabs"><button class="active" data-tab="visual">Visual</button><button data-tab="code">Code</button></div><div id="labSide"><h3>Experiment setup</h3><div class="stat-row"><span>Qubits</span><strong>2</strong></div><div class="stat-row"><span>Moments</span><strong>8</strong></div><div class="stat-row"><span>Shots</span><strong>1024</strong></div><div class="progress"><span style="width:78%"></span></div><p class="muted small">Frontend simulation is deterministic enough for a demo and ready to be replaced by a FastAPI/Qiskit endpoint.</p></div></div></div>
 <div class="section-title"><h2>Code workspace</h2><span class="badge">PYTHON</span></div>
 <div class="code-result"><div class="card"><textarea id="codeEditor" class="code-editor">${escapeHtml(state.code)}</textarea><button class="btn" style="margin-top:10px" data-save-code>Save code</button></div><div class="card"><h3>Result</h3><div id="resultPanel"><p class="muted">Run the circuit to generate measurement probabilities.</p></div></div></div>`));
}
function escapeHtml(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}

function renderResult(){
 const counts = state.circuit[0][0]==="H" && state.circuit[0][3]==="CX" ? [["00",50],["11",50]] : [["00",72],["01",14],["10",9],["11",5]];
 return `<div class="bars">${counts.map(([k,v])=>`<div class="bar" style="height:${v*2.6}px"><em>${v}%</em><span>${k}</span></div>`).join("")}</div><div class="stat-row" style="margin-top:32px"><span>Shots</span><strong>1024</strong></div><div class="stat-row"><span>Most likely</span><strong>${counts[0][0]}</strong></div><p class="muted small">Demo output. Connect this panel to your simulator API for real Qiskit/Aer execution.</p>`;
}

const challenges=[
 {id:"bell",title:"Build a Bell state",difficulty:"Beginner",q:"Which sequence creates the standard |Φ+⟩ Bell state from |00⟩?",opts:["H on q0, then CX(q0,q1)","X on q0, then Z on q1","H on both qubits only","Measure both qubits first"],correct:0},
 {id:"hadamard",title:"Hadamard intuition",difficulty:"Beginner",q:"What is the ideal measurement distribution after H|0⟩?",opts:["100% 0","50% 0 and 50% 1","100% 1","25% each of 00,01,10,11"],correct:1},
 {id:"xgate",title:"Gate recognition",difficulty:"Beginner",q:"What does X do to computational-basis states?",opts:["Leaves them unchanged","Swaps |0⟩ and |1⟩","Measures them","Creates entanglement by itself"],correct:1}
];
function challengesPage(){
 return layout(page(`<div class="section-title"><div><span class="badge">PRACTICE</span><h1 style="margin:8px 0">Quantum challenges</h1><p class="muted">Apply concepts, earn points, and reinforce your intuition.</p></div></div>
 <div class="grid">${challenges.map((c,i)=>`<div class="card challenge"><div><span class="badge">${c.difficulty}</span><h3 style="margin:9px 0">${c.title}</h3><p class="muted">${c.q}</p></div><button class="btn primary" data-nav="/challenges/${c.id}">Attempt →</button></div>`).join("")}</div>`));
}
function challenge(id){
 const c=challenges.find(x=>x.id===id)||challenges[0];
 return layout(page(`<button class="btn" data-nav="/challenges">← Challenges</button><div class="card" style="max-width:820px;margin:18px auto"><span class="badge">${c.difficulty}</span><h1>${c.title}</h1><h3 style="margin-top:28px">${c.q}</h3><div id="choices">${c.opts.map((o,i)=>`<button class="choice" data-choice="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><button class="btn primary" data-submit-challenge="${c.id}">Submit answer</button><div id="challengeFeedback" style="margin-top:15px"></div></div>`));
}

function tutor(){
 return layout(page(`<div class="section-title"><div><span class="badge">AI TUTOR</span><h1 style="margin:8px 0">Ask about quantum computing</h1><p class="muted">A guided tutor interface ready to connect to your LLM backend.</p></div></div>
 <div class="card chat"><div class="messages" id="messages">${state.messages.map(m=>`<div class="msg ${m.role}">${escapeHtml(m.text)}</div>`).join("")}</div><div class="chat-input"><input id="chatInput" placeholder="e.g. Explain superposition simply…" /><button class="btn primary" data-send-chat>Send</button></div></div>`));
}
function tutorReply(q){
 const s=q.toLowerCase();
 if(s.includes("superposition")) return "Superposition means a qubit can be represented as a combination of basis states. Measurement samples a definite outcome, with probabilities determined by the amplitudes.";
 if(s.includes("entanglement")) return "Entanglement is a joint quantum state whose correlations cannot be reduced to independent descriptions of each qubit. A Bell circuit is a useful first experiment.";
 if(s.includes("hadamard")||s.includes(" h gate")) return "The H gate maps |0⟩ to an equal-amplitude combination of |0⟩ and |1⟩. It also maps |1⟩ to the corresponding relative-phase combination.";
 return "Try asking about qubits, superposition, entanglement, quantum gates, measurement, or algorithms. In production this panel can call your FastAPI + LLM service.";
}

function progress(){
 const avg=Math.round(Object.values(state.progress).reduce((a,b)=>a+b,0)/4);
 return layout(page(`<div class="section-title"><div><span class="badge">YOUR PROGRESS</span><h1 style="margin:8px 0">Learning analytics</h1><p class="muted">Track your understanding across the learning path.</p></div></div>
 <div class="grid grid-4"><div class="card"><div class="small muted">OVERALL</div><div class="kpi">${avg}%</div></div><div class="card"><div class="small muted">STREAK</div><div class="kpi">7 days</div></div><div class="card"><div class="small muted">LAB RUNS</div><div class="kpi">27</div></div><div class="card"><div class="small muted">POINTS</div><div class="kpi">780</div></div></div>
 <div class="section-title"><h2>Course progress</h2></div><div class="grid grid-2">${courses.map(c=>`<div class="card"><div class="stat-row"><strong>${c.title}</strong><strong>${state.progress[c.id]??c.progress}%</strong></div><div class="progress"><span style="width:${state.progress[c.id]??c.progress}%"></span></div></div>`).join("")}</div>
 <div class="section-title"><h2>Recent activity</h2></div><div class="card">${["Completed Superposition lesson","Ran Bell-state circuit","Solved Hadamard intuition challenge","Asked tutor about entanglement"].map((x,i)=>`<div class="stat-row" style="padding:14px 0;border-bottom:1px solid var(--line)"><span>${x}</span><span>${i+1}d ago</span></div>`).join("")}</div>`));
}

function profile(){
 return layout(page(`<div class="section-title"><div><span class="badge">PROFILE</span><h1 style="margin:8px 0">Your learner profile</h1></div></div><div class="grid grid-2"><div class="card"><div class="logo" style="width:70px;height:70px;font-size:28px;margin-bottom:16px">${state.user.name[0]}</div><h2>${state.user.name}</h2><p class="muted">${state.user.email}</p><span class="badge">${state.user.level}</span></div><div class="card"><h3>Edit profile</h3><label>Name</label><input id="profileName" value="${escapeHtml(state.user.name)}"><label>Email</label><input id="profileEmail" value="${escapeHtml(state.user.email)}"><button class="btn primary" style="margin-top:14px" data-save-profile>Save changes</button></div></div>`));
}
function settings(){
 return layout(page(`<div class="section-title"><div><span class="badge">SETTINGS</span><h1 style="margin:8px 0">Platform settings</h1></div></div><div class="card" style="max-width:760px"><div class="stat-row" style="padding:15px 0"><span><strong>Theme</strong><br><span class="small muted">Dark mode is optimized for the quantum lab.</span></span><select id="theme"><option ${state.settings.theme==="dark"?"selected":""}>dark</option><option ${state.settings.theme==="light"?"selected":""}>light</option></select></div><div class="stat-row" style="padding:15px 0"><span><strong>Notifications</strong><br><span class="small muted">Learning reminders and challenge updates.</span></span><button class="btn" data-toggle-notifications>${state.settings.notifications?"Enabled":"Disabled"}</button></div><button class="btn primary" data-save-settings>Save settings</button></div>`));
}
function auth(type){
 return `<div class="auth-wrap"><div class="auth card"><div class="auth-logo"><span class="logo" style="margin:auto">Q</span><h2>${type==="login"?"Welcome back":"Create your learner account"}</h2><p class="muted">${type==="login"?"Sign in to continue learning.":"Start building your quantum intuition."}</p></div><label>Email</label><input id="authEmail" value="${type==="login"?"learner@example.com":""}" placeholder="you@example.com"><label>Password</label><input type="password" value="quantum123"><button class="btn primary" style="width:100%;margin-top:18px" data-auth-submit>${type==="login"?"Sign in":"Create account"}</button><button class="btn ghost" style="width:100%;margin-top:8px" data-nav="${type==="login"?"/register":"/login"}">${type==="login"?"Need an account? Register":"Already have an account? Sign in"}</button><button class="btn ghost" style="width:100%;margin-top:8px" data-nav="/">← Back home</button></div></div>`;
}

function render(){
 let r=route(), html;
 if(r==="/") html=landing();
 else if(r==="/login") html=auth("login");
 else if(r==="/register") html=auth("register");
 else if(r==="/dashboard") html=dashboard();
 else if(r==="/learn") html=learn();
 else if(r.startsWith("/learn/")) html=lesson(r.split("/")[2]);
 else if(r==="/lab") html=lab();
 else if(r==="/challenges") html=challengesPage();
 else if(r.startsWith("/challenges/")) html=challenge(r.split("/")[2]);
 else if(r==="/tutor") html=tutor();
 else if(r==="/progress") html=progress();
 else if(r==="/profile") html=profile();
 else if(r==="/settings") html=settings();
 else html=landing();
 app.innerHTML=html;
 bind();
}
function bind(){
 $$("[data-nav]").forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 $$("[data-gate]").forEach(b=>b.onclick=()=>{ window.selectedGate=b.dataset.gate; const x=$("#selectedGate"); if(x)x.textContent=window.selectedGate; toast(`Selected ${window.selectedGate} gate`);});
 $$("[data-cell]").forEach(b=>b.onclick=()=>{ const [r,c]=b.dataset.cell.split(",").map(Number); state.circuit[r][c]=window.selectedGate||"H"; save(); render(); });
 const run=$("[data-run]"); if(run)run.onclick=()=>{ const p=$("#resultPanel"); if(p)p.innerHTML=renderResult(); toast("Circuit simulated"); };
 const clear=$("[data-clear-circuit]"); if(clear)clear.onclick=()=>{state.circuit=state.circuit.map(r=>r.map(()=>''));save();render();toast("Circuit cleared");};
 const sc=$("[data-save-code]"); if(sc)sc.onclick=()=>{state.code=$("#codeEditor").value;save();toast("Code saved");};
 $$("[data-answer]").forEach(b=>b.onclick=()=>{toast(b.dataset.answer==="correct"?"Correct!":"Not quite — review the lesson."); if(b.dataset.answer==="correct") b.classList.add("selected");});
 $$("[data-complete]").forEach(b=>b.onclick=()=>{state.progress[b.dataset.complete]=100;save();toast("Lesson completed");render();});
 const send=$("[data-send-chat]"); if(send)send.onclick=sendChat;
 const chat=$("#chatInput"); if(chat)chat.onkeydown=e=>{if(e.key==="Enter")sendChat();};
 $$("[data-choice]").forEach(b=>b.onclick=()=>{ $$("[data-choice]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected"); window.choice=Number(b.dataset.choice); });
 const submit=$("[data-submit-challenge]"); if(submit)submit.onclick=()=>{const c=challenges.find(x=>x.id===submit.dataset.submitChallenge);const f=$("#challengeFeedback");if(window.choice===c.correct){f.innerHTML='<span class="badge">Correct · +100 points</span>';toast("Challenge passed");}else f.innerHTML='<span class="badge" style="color:#ffdce1;background:rgba(255,107,122,.12)">Try again</span>';};
 const sp=$("[data-save-profile]"); if(sp)sp.onclick=()=>{state.user.name=$("#profileName").value;state.user.email=$("#profileEmail").value;save();toast("Profile saved");render();};
 const nt=$("[data-toggle-notifications]");if(nt)nt.onclick=()=>{state.settings.notifications=!state.settings.notifications;save();render();};
 const ss=$("[data-save-settings]");if(ss)ss.onclick=()=>{state.settings.theme=$("#theme").value;save();toast("Settings saved");};
 const au=$("[data-auth-submit]");if(au)au.onclick=()=>{state.user.email=$("#authEmail").value||state.user.email;save();toast("Signed in to demo account");nav("/dashboard");};
}
function sendChat(){ const x=$("#chatInput");if(!x||!x.value.trim())return;state.messages.push({role:"user",text:x.value.trim()});state.messages.push({role:"ai",text:tutorReply(x.value.trim())});save();render(); }
window.addEventListener("hashchange",render);
window.addEventListener("load",render);
