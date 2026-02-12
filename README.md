<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WorkERP</title>
<style>
body{font-family:-apple-system;background:#111;color:white;text-align:center;padding:20px}
button{margin:5px;padding:12px;border-radius:12px;border:none;background:#007aff;color:white;font-size:16px}
.card{background:#222;padding:20px;margin:15px 0;border-radius:20px}
.status{font-size:18px;margin:10px}
</style>
</head>
<body>

<h1>Work ERP</h1>

<div class="status" id="status">Parado</div>

<div class="card">
<h2>Horas Hoje</h2>
<p id="hoursToday">0.00 h</p>
</div>

<button onclick="startWork()">Iniciar</button>
<button onclick="startBreak()">Pausa</button>
<button onclick="endBreak()">Voltar</button>
<button onclick="endWork()">Terminar</button>

<div class="card">
<h2>Banco de Horas</h2>
<p id="bankHours">0.00 h</p>
</div>

<div class="card">
<h2>Salário</h2>
<p id="salary">CHF 0</p>
</div>

<script>
let entryTime=null;
let breakStart=null;
let totalBreak=0;
let timer=null;

const hourlyRate=22.31;
const expectedDailyHours=8.75;

function startWork(){
entryTime=new Date();
totalBreak=0;
document.getElementById("status").innerText="🟢 Trabalhando";
timer=setInterval(updateLive,1000);
}

function startBreak(){
breakStart=new Date();
document.getElementById("status").innerText="🟠 Em pausa";
}

function endBreak(){
if(breakStart){
totalBreak+=(new Date()-breakStart);
breakStart=null;
document.getElementById("status").innerText="🟢 Trabalhando";
}
}

function endWork(){
if(!entryTime)return;
clearInterval(timer);
let exitTime=new Date();
let totalWorked=(exitTime-entryTime-totalBreak)/3600000;
saveDay(totalWorked);
updateUI(totalWorked);
document.getElementById("status").innerText="Finalizado";
}

function updateLive(){
if(!entryTime)return;
let now=new Date();
let worked=(now-entryTime-totalBreak)/3600000;
document.getElementById("hoursToday").innerText=worked.toFixed(2)+" h";
}

function saveDay(hours){
let days=JSON.parse(localStorage.getItem("days"))||[];
days.push(hours);
localStorage.setItem("days",JSON.stringify(days));
}

function updateUI(todayHours){
document.getElementById("hoursToday").innerText=todayHours.toFixed(2)+" h";
let days=JSON.parse(localStorage.getItem("days"))||[];
let total=days.reduce((a,b)=>a+b,0);
let bank=total-(days.length*expectedDailyHours);
let salary=total*hourlyRate;
document.getElementById("bankHours").innerText=bank.toFixed(2)+" h";
document.getElementById("salary").innerText="CHF "+salary.toFixed(0);
}
</script>

</body>
</html>
