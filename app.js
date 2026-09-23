const $ = id => document.getElementById(id);
const subjects = [
  ["🐍","Python","Programming and problem solving"],["☕","Java","Object-oriented programming"],
  ["🗄️","DBMS","Databases and SQL"],["🌳","Data Structures","Algorithms and structures"],
  ["💻","Computer Architecture","Computer organization and architecture"],["⚙️","C++","Programming fundamentals"],
  ["🌐","Web Development","HTML, CSS and JavaScript"],["📐","Other Subjects","Add your own topic"]
];

function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  $(page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  window.scrollTo({top:0,behavior:"smooth"});
  document.querySelector(".sidebar")?.classList.remove("open");
}
function toggleSidebar(){document.querySelector(".sidebar").classList.toggle("open")}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function openTutor(q){showPage("tutor"); if(q){$("tutorQ").value=q; askTutor();}}
function toast(msg){const t=$("toast");t.textContent=msg;t.style.display="block";setTimeout(()=>t.style.display="none",2200)}
function loading(el){el.classList.remove("hidden");el.innerHTML="<div>✦ EduGenie is thinking...</div>"}
function md(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/^### (.*)$/gm,"<h4>$1</h4>")
    .replace(/^## (.*)$/gm,"<h3>$1</h3>").replace(/^# (.*)$/gm,"<h2>$1</h2>")
    .replace(/^\- (.*)$/gm,"• $1").replace(/\n/g,"<br>");
}
async function api(url, options={}){
  const r=await fetch(url,options); const data=await r.json();
  if(!r.ok) throw new Error(data.error||"Something went wrong");
  return data;
}
async function askTutor(){
  const out=$("tutorResult"); loading(out);
  try{const d=await api("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:$("tutorQ").value,subject:$("tutorSubject").value})});out.innerHTML=md(d.answer);}
  catch(e){out.innerHTML="⚠️ "+e.message}
}
async function makeNotes(){
  const out=$("notesResult");loading(out);
  try{const d=await api("/api/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:$("notesTopic").value,subject:$("notesSubject").value,level:$("notesLevel").value})});out.innerHTML=md(d.answer);}
  catch(e){out.innerHTML="⚠️ "+e.message}
}
async function makeQuiz(){
  const out=$("quizResult");loading(out);
  try{
    const d=await api("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:$("quizTopic").value,subject:$("quizSubject").value,difficulty:$("quizDifficulty").value,count:$("quizCount").value})});
    if(!d.quiz.length){out.innerHTML=md(d.raw);return}
    out.innerHTML=d.quiz.map((q,i)=>`<div class="quiz-q"><b>${i+1}. ${q.question}</b>${q.options.map((o,j)=>`<button class="option" onclick="this.classList.add('selected');this.parentElement.querySelector('.explain').innerHTML='<b>Answer:</b> ${q.options[q.answer]}<br>${q.explanation||""}'">${o}</button>`).join("")}<div class="explain"></div></div>`).join("");
  }catch(e){out.innerHTML="⚠️ "+e.message}
}
async function makeCards(){
  const out=$("cardsResult");loading(out);
  try{const d=await api("/api/flashcards",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:$("cardTopic").value,subject:$("cardSubject").value})});
    if(!d.cards.length){out.innerHTML=md(d.raw);return}
    out.innerHTML=d.cards.map((c,i)=>`<div class="flashcard"><b>Card ${i+1}</b><h3>${c.question}</h3><p>${c.answer}</p></div>`).join("");
  }catch(e){out.innerHTML="⚠️ "+e.message}
}
async function makePlan(){
  const out=$("planResult");loading(out);
  try{const d=await api("/api/exam",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:$("planSubject").value,topics:$("planTopics").value,examDate:$("planDate").value})});out.innerHTML=md(d.answer);}
  catch(e){out.innerHTML="⚠️ "+e.message}
}
async function makeExam(){
  const out=$("examResult");loading(out);
  try{const d=await api("/api/exam",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:$("examSubject").value,topics:$("examTopics").value,examDate:$("examDate").value})});out.innerHTML=md(d.answer);}
  catch(e){out.innerHTML="⚠️ "+e.message}
}
async function processPDF(){
  const out=$("pdfResult"); const file=$("pdfFile").files[0];
  if(!file){toast("Choose a PDF first");return}
  loading(out);
  const fd=new FormData();fd.append("pdf",file);fd.append("action",$("pdfAction").value);
  try{const d=await api("/api/pdf",{method:"POST",body:fd});out.innerHTML=`<b>${d.filename}</b><br><small>${d.extractedCharacters} characters extracted</small><hr>${md(d.answer)}`}
  catch(e){out.innerHTML="⚠️ "+e.message}
}
$("subjectGrid").innerHTML=subjects.map(s=>`<div class="subject-card" onclick="document.querySelector('#tutorSubject').value='${s[1]}';showPage('tutor')"><div class="subject-icon">${s[0]}</div><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join("");
fetch("/api/health").then(r=>r.json()).then(d=>{if(!d.geminiConfigured) toast("Add your Gemini API key in .env");}).catch(()=>{});
