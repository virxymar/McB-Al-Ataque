/* McB · Estancias + Próxima vuelta + controles periódicos v3 */
(function(){
  function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').toLowerCase()}
  const aliases={
    'lavavajillas_filtro_juntas':'lavavajillas','lavadora_goma_cajetin_filtro':'lavadora','aspirar_colchones_1_2_meses':'colchones','persianas_2_3_meses':'persianas','cortinas_visillos_3_6_meses':'cortinas','interior_canapes_3_6_meses':'canapes','parte_superior_detras_frigorifico':'frigo'
  };
  function periodicFor(item){const id=aliases[slug(item)];return id?periodic.find(p=>p[0]===id):null}
  function roomKey(name,group,item){if(group==='Diario')return'mcb_room_day_'+localISO()+'_'+slug(name)+'_'+slug(item);if(group==='Semanal')return'mcb_room_week_'+currentWeek()+'_'+slug(name)+'_'+slug(item);return'mcb_room_date_'+slug(name)+'_'+slug(group)+'_'+slug(item)}
  function addDays(date,days){const d=new Date(date+'T12:00');d.setDate(d.getDate()+days);return d}
  function stateFor(name,group,item){const key=roomKey(name,group,item),p=periodicFor(item);if(group==='Diario'||group==='Semanal')return{key,checked:localStorage.getItem(key)==='1',date:null,p:null};if(p){const h=hist(),date=h[p[0]]||null;return{key,checked:!!date,date,p}}const date=localStorage.getItem(key);return{key,checked:!!date,date,p:null}}
  function status(group,s){if(group==='Diario'||group==='Semanal')return'';if(!s.date)return'<div class="muted" style="margin-left:30px">Sin registrar</div>';let txt='Última: '+new Date(s.date+'T12:00').toLocaleDateString('es-ES');if(s.p){const next=addDays(s.date,s.p[2]),dif=Math.ceil((next-new Date())/86400000);txt+=' · Próxima: '+next.toLocaleDateString('es-ES')+' · '+(dif<=0?'Toca ahora':'faltan '+dif+' días')}else if(group==='Mensual'){const next=addDays(s.date,30);txt+=' · Próxima referencia: '+next.toLocaleDateString('es-ES')}return'<div class="muted" style="margin-left:30px">'+txt+'</div>'}

  window.fillRoom=function(name,group){
    const a=rooms[name][group];if(!a.length){rtasks.innerHTML='<div class="muted" style="padding:12px 0">Sin tareas fijas.</div>';return}
    rtasks.innerHTML=a.map((item,i)=>{const s=stateFor(name,group,item);return'<div class="list"><label class="task '+(s.checked?'done':'')+'"><input type="checkbox" data-roomcheck="'+i+'" '+(s.checked?'checked':'')+'><span>'+item+'</span></label>'+status(group,s)+'</div>'}).join('');
    rtasks.querySelectorAll('[data-roomcheck]').forEach(cb=>cb.addEventListener('change',()=>{const item=a[Number(cb.dataset.roomcheck)],s=stateFor(name,group,item);if(group==='Diario'||group==='Semanal'){if(cb.checked)localStorage.setItem(s.key,'1');else localStorage.removeItem(s.key)}else if(s.p){const h=hist();if(cb.checked)h[s.p[0]]=localISO();else if(h[s.p[0]]===s.date)delete h[s.p[0]];setHist(h)}else{if(cb.checked)localStorage.setItem(s.key,localISO());else localStorage.removeItem(s.key)}window.fillRoom(name,group)}));
  };

  function pending(){return JSON.parse(localStorage.getItem('mcb_pending_rotations')||'[]')}
  function savePending(a){localStorage.setItem('mcb_pending_rotations',JSON.stringify(a))}
  function todayCode(){return dayCodes[new Date().getDay()]}
  function pendingKey(){return 'w'+currentWeek()+'-'+todayCode()}
  function deferToday(){const c=todayCode();if(!base[c])return;const w=currentWeek(),k=pendingKey(),a=pending();const old=a.find(x=>x.key===k&&x.status==='pending');const due=new Date();due.setDate(due.getDate()+28);if(old){old.due=localISO(due);old.saved=localISO()}else a.push({key:k,week:w,day:c,title:rotations[w].items[c],saved:localISO(),due:localISO(due),status:'pending'});savePending(a);window.renderToday()}
  function completePendingToday(){const k=pendingKey(),a=pending();let ch=false;a.forEach(x=>{if(x.key===k&&x.status==='pending'){x.status='done';x.completed=localISO();ch=true}});if(ch)savePending(a)}
  function enhanceToday(){
    const c=todayCode();if(!base[c])return;const cards=document.querySelectorAll('#tareas .card');if(!cards.length)return;const last=cards[cards.length-1],label=last.querySelector('.task'),cb=last.querySelector('input[type=checkbox]');if(!label||!cb)return;
    const k=pendingKey(),p=pending().find(x=>x.key===k&&x.status==='pending');
    const box=document.createElement('div');box.style.marginTop='8px';
    if(p&&p.due<=localISO())box.innerHTML='<div class="muted" style="margin-bottom:6px">⏭️ Pendiente de la vuelta anterior</div>';
    if(!cb.checked){const b=document.createElement('button');b.className='mini';b.textContent=p?'✓ Ya está guardada para próxima vuelta':'⏭️ Próxima vuelta';b.disabled=!!p;b.addEventListener('click',deferToday);box.appendChild(b)}
    else if(p){completePendingToday()}
    last.appendChild(box);
    cb.addEventListener('change',()=>{if(cb.checked)completePendingToday()});
  }
  const originalRenderToday=window.renderToday;
  window.renderToday=function(){originalRenderToday();enhanceToday()};

  function undoPeriodic(id){const h=hist();if(!h[id])return;delete h[id];setHist(h);window.renderPeriodic();if(document.getElementById('historial')&&!document.getElementById('historial').classList.contains('hidden'))window.renderHistory()}
  window.renderPeriodic=function(){
    const h=hist();periodicList.innerHTML=periodic.map(([id,t,d])=>{const last=h[id]?new Date(h[id]+'T12:00'):null;let status='Sin registrar';if(last){const next=new Date(last);next.setDate(next.getDate()+d);const dif=Math.ceil((next-new Date())/86400000);status='Última: '+last.toLocaleDateString('es-ES')+' · '+(dif<=0?'Toca ahora':'Faltan '+dif+' días')}return'<div class="card"><span class="pill">'+d+' días aprox.</span><h2 style="margin-top:7px">'+t+'</h2><div class="muted">'+status+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px"><button class="btn" data-p="'+id+'">✓ Hecha hoy</button>'+(last?'<button class="btn alt" data-undo-p="'+id+'">↶ Deshacer registro</button>':'')+'</div></div>'}).join('');
    document.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{const h=hist();h[b.dataset.p]=localISO();setHist(h);window.renderPeriodic()}));
    document.querySelectorAll('[data-undo-p]').forEach(b=>b.addEventListener('click',()=>undoPeriodic(b.dataset.undoP)));
  };
  window.renderHistory=function(){
    const h=hist(),rows=periodic.filter(x=>h[x[0]]);histList.innerHTML=rows.length?rows.map(([id,t,d])=>{const last=new Date(h[id]+'T12:00'),next=new Date(last);next.setDate(next.getDate()+d);return'<div class="card"><h2>'+t+'</h2><div class="muted">Última: '+last.toLocaleDateString('es-ES')+'</div><div class="muted">Próxima referencia: '+next.toLocaleDateString('es-ES')+'</div><button class="btn alt" style="margin-top:8px" data-hundo="'+id+'">↶ Borrar este registro</button></div>'}).join(''):'<div class="card">Sin historial todavía.</div>';document.querySelectorAll('[data-hundo]').forEach(b=>b.addEventListener('click',()=>undoPeriodic(b.dataset.hundo)))};

  window.renderToday();window.renderPeriodic();
})();