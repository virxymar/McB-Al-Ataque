/* McB · Hoy V2 — una portada útil, no una lista para llorar. */
(function(){'use strict';
function n(v){return Math.max(0,Number(v)||0)}
function baseTasks(){return typeof rawTasks==='function'?rawTasks().filter(t=>t&&!state.done[t.id]):[]}
function modeBudget(){return state.mode==='10'?10:state.mode==='30'?30:state.mode==='60'?60:state.mode==='none'?8:75}
function modeMax(){return state.mode==='none'?2:state.mode==='10'?3:state.mode==='30'?5:state.mode==='60'?7:8}
function rank(t){let areaBoost={colada:4,comida:3,compra:2,casa:1}[t.area]||0;return n(t.priority)*100+areaBoost*10-Math.min(n(t.min),30)}
function canFit(t,used,budget,picked){let min=n(t.min);if(!picked.length)return true;return used+min<=budget}
function chosenToday(){let tasks=baseTasks(),budget=modeBudget(),max=modeMax(),picked=[],used=0,areaCount={casa:0,colada:0,comida:0,compra:0};
  let essentials=tasks.filter(t=>n(t.priority)>=3).sort((a,b)=>rank(b)-rank(a));
  for(const t of essentials){if(picked.length>=max)break;if(state.mode==='none'&&picked.length>=2)break;if(!canFit(t,used,budget,picked))continue;picked.push(t);used+=n(t.min);areaCount[t.area]=(areaCount[t.area]||0)+1}
  if(state.mode==='none')return picked;
  let rest=tasks.filter(t=>n(t.priority)<3&&!picked.some(p=>p.id===t.id)).sort((a,b)=>{let aa=areaCount[a.area]||0,bb=areaCount[b.area]||0;if(aa!==bb)return aa-bb;return rank(b)-rank(a)});
  let progress=true;while(progress&&picked.length<max){progress=false;for(let i=0;i<rest.length&&picked.length<max;i++){let t=rest[i];if(!t)continue;let min=n(t.min);if(used+min>budget)continue;let sameArea=areaCount[t.area]||0;if(sameArea>=3&&Object.values(areaCount).some(v=>v===0))continue;picked.push(t);used+=min;areaCount[t.area]=sameArea+1;rest[i]=null;progress=true}}
  return picked}
function quickPending(){return Array.isArray(state.quick)?state.quick.filter(q=>q&&!q.done):[]}
function renderTodaySafe(){let a=chosenToday(),groups={casa:[],colada:[],comida:[],compra:[]};a.forEach(t=>(groups[t.area]||groups.casa).push(t));let labels={casa:'🏠 Casa',colada:'🧺 Colada',comida:'🍳 Comidas',compra:'🛒 Compra'},visible=Object.keys(groups).filter(k=>groups[k].length),html='';if(!a.length){html='<div class="card"><div class="empty"><b>Por hoy, suficiente 😌</b><div class="meta" style="margin-top:6px">McB no va a inventarse trabajo para rellenar la pantalla.</div></div></div>'}else visible.forEach(k=>{html+='<div class="sectionTitle"><h2>'+labels[k]+'</h2><button class="mini" onclick="openView(\''+k+'\')">Ver →</button></div><div class="card">'+groups[k].map(taskHTML).join('')+'</div>'});todayContent.innerHTML=html;importantCount.textContent=a.length;let mins=a.reduce((s,t)=>s+n(t.min),0);activeTime.textContent=mins+' min';let q=quickPending().length;if(q)todayContent.insertAdjacentHTML('beforeend','<div class="softbox" style="margin-top:12px">📝 Además tienes '+q+' '+(q===1?'cosa apuntada en “Ha surgido algo”.':'cosas apuntadas en “Ha surgido algo”.')+' No las meto a escondidas en el tiempo de casa.</div>')}
function install(){window.allTasks=chosenToday;window.renderToday=renderTodaySafe;if(typeof render==='function')render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();})();