let IDX=null;
async function idx(){ if(!IDX){ IDX=await (await fetch('/search.json')).json(); } return IDX; }
const q=document.getElementById('q');
const results=document.getElementById('results');
const list=document.getElementById('postlist');
function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
async function run(term){
  const data=await idx(); term=term.trim().toLowerCase();
  if(!term){ if(results){results.hidden=true;results.innerHTML='';} if(list)list.hidden=false; return; }
  if(list)list.hidden=true;
  const hits=data.filter(p=>(p.t+' '+p.x).toLowerCase().includes(term)).slice(0,60);
  let h='<h2>'+hits.length+' result'+(hits.length==1?'':'s')+' for “'+esc(term)+'”</h2>';
  if(!hits.length){ h+='<p class="nores">No posts matched. Try another term.</p>'; }
  else{ h+='<ul>'+hits.map(p=>'<li><a href="'+p.u+'">'+esc(p.t)+'<time>'+p.d+'</time></a></li>').join('')+'</ul>'; }
  if(results){results.innerHTML=h;results.hidden=false;}
}
if(q){ q.addEventListener('input',e=>run(e.target.value)); }
const rb=document.getElementById('rand');
if(rb){ rb.addEventListener('click',async()=>{ const d=await idx(); if(d.length){ location.href=d[Math.floor(Math.random()*d.length)].u; } }); }
