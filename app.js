let questions = [];
let current = [];
let index = 0;
let score = 0;
let mode = "";
let selectedCategory = "";

const $ = (id) => document.getElementById(id);

fetch("questions.json").then(r=>r.json()).then(data=>{
  questions = data;
  renderCategories();
  $("countBox").innerHTML = `<strong>${questions.length}</strong> questões carregadas • ${new Set(questions.map(q=>q.categoria)).size} matérias`;
});

function setScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo(0,0);
}
function goHome(){ setScreen("home"); }

function showStudy(){
  renderCategories();
  setScreen("study");
}
function renderCategories(){
  const cats = [...new Set(questions.map(q=>q.categoria))];
  $("categoryList").innerHTML = cats.map(c=>{
    const total = questions.filter(q=>q.categoria===c).length;
    return `<button onclick="startStudy('${c}')">${icon(c)} ${c}<br><small>${total} questões</small></button>`;
  }).join("");
}
function icon(c){
  if(c.includes("Químicas")) return "☣️";
  if(c.includes("APH")) return "🚑";
  if(c.includes("Extintores")) return "🧯";
  if(c.includes("Equipamentos")) return "🚒";
  if(c.includes("Legislação")) return "📜";
  if(c.includes("Comunicação")) return "📡";
  return "🔥";
}
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function startStudy(cat){
  mode = "Estudo";
  selectedCategory = cat;
  current = shuffle(questions.filter(q=>q.categoria===cat));
  index = 0; score = 0;
  setScreen("quiz");
  renderQuestion();
}
function startSimulado(){
  mode = "Simulado";
  selectedCategory = "Todas";
  current = shuffle(questions).slice(0,30);
  index = 0; score = 0;
  setScreen("quiz");
  renderQuestion();
}
function renderQuestion(){
  const q = current[index];
  $("quizMeta").textContent = `${mode} • ${selectedCategory} • ${index+1}/${current.length}`;
  $("scoreMeta").textContent = `Acertos: ${score}`;
  $("progressBar").style.width = `${((index)/current.length)*100}%`;
  $("levelTag").textContent = `${q.categoria} • nível ${q.nivel}`;
  $("questionText").textContent = q.pergunta;
  $("feedback").innerHTML = "";
  $("nextBtn").disabled = true;

  $("answers").innerHTML = Object.entries(q.alternativas).map(([k,v]) =>
    `<button class="answer" onclick="answerQuestion('${k}', this)"><strong>${k})</strong> ${v}</button>`
  ).join("");
}
function answerQuestion(letter, btn){
  const q = current[index];
  const buttons = document.querySelectorAll(".answer");
  buttons.forEach(b=>b.disabled=true);

  const ok = letter === q.resposta;
  if(ok){ score++; btn.classList.add("correct"); }
  else{
    btn.classList.add("wrong");
    buttons.forEach(b=>{ if(b.textContent.trim().startsWith(q.resposta + ")")) b.classList.add("correct"); });
    saveWrong(q);
  }
  saveAttempt(q, ok);
  $("feedback").innerHTML = `<strong>${ok ? "✅ Correto!" : "❌ Incorreto."}</strong><br>${q.explicacao}`;
  $("scoreMeta").textContent = `Acertos: ${score}`;
  $("nextBtn").disabled = false;
}
function nextQuestion(){
  index++;
  if(index >= current.length) finishQuiz();
  else renderQuestion();
}
function finishQuiz(){
  $("progressBar").style.width = "100%";
  const percent = Math.round((score/current.length)*100);
  $("resultBox").innerHTML = `<h3>${score}/${current.length} acertos</h3><p>Nota: <strong>${percent}%</strong></p><p>${percent>=80 ? "🔥 Excelente!" : percent>=70 ? "✅ Bom desempenho!" : "📚 Revise os erros e tente novamente."}</p>`;
  setScreen("result");
}
function saveAttempt(q, ok){
  const stats = JSON.parse(localStorage.getItem("stats") || "{}");
  if(!stats[q.categoria]) stats[q.categoria] = {total:0, correct:0};
  stats[q.categoria].total++;
  if(ok) stats[q.categoria].correct++;
  localStorage.setItem("stats", JSON.stringify(stats));
}
function saveWrong(q){
  let wrong = JSON.parse(localStorage.getItem("wrong") || "[]");
  if(!wrong.find(x=>x.id===q.id)) wrong.push(q);
  localStorage.setItem("wrong", JSON.stringify(wrong));
}
function showPerformance(){
  const stats = JSON.parse(localStorage.getItem("stats") || "{}");
  const keys = Object.keys(stats);
  $("performanceBox").innerHTML = keys.length ? keys.map(k=>{
    const s = stats[k], p = Math.round((s.correct/s.total)*100);
    return `<div class="stat"><strong>${icon(k)} ${k}</strong><br>${s.correct}/${s.total} acertos • ${p}%</div>`;
  }).join("") : `<div class="card">Você ainda não respondeu questões.</div>`;
  setScreen("performance");
}
function showReview(){
  const wrong = JSON.parse(localStorage.getItem("wrong") || "[]");
  if(!wrong.length){
    $("reviewBox").innerHTML = `<div class="card">Nenhuma questão errada salva ainda.</div>`;
  } else {
    $("reviewBox").innerHTML = wrong.map(q=>`
      <div class="stat">
        <strong>${q.pergunta}</strong><br>
        <small>${q.categoria} • ${q.nivel}</small>
        <p>Resposta correta: <strong>${q.resposta}) ${q.alternativas[q.resposta]}</strong></p>
        <p>${q.explicacao}</p>
      </div>
    `).join("");
  }
  setScreen("review");
}
function clearWrong(){
  localStorage.removeItem("wrong");
  showReview();
}
