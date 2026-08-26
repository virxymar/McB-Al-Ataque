/* McB · checklists de Estancias v2 */
(function(){
  function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').toLowerCase()}
  const aliases={
    'lavavajillas_filtro_juntas':'lavavajillas',
    'lavadora_goma_cajetin_filtro':'lavadora',
    'aspirar_colchones_1_2_meses':'colchones',
    'persianas_2_3_meses':'persianas',
    'cortinas_visillos_3_6_meses':'cortinas',
    'interior_canapes_3_6_meses':'canapes',
    'parte_superior_detras_frigorifico':'frigo'
  };
  function periodicFor(item){
    const id=aliases[slug(item)];
    return id ? periodic.find(p=>p[0]===id) : null;
  }
  function roomKey(name,group,item){
    if(group==='Diario') return 'mcb_room_day_'+localISO()+'_'+slug(name)+'_'+slug(item);
    if(group==='Semanal') return 'mcb_room_week_'+currentWeek()+'_'+slug(name)+'_'+slug(item);
    return 'mcb_room_date_'+slug(name)+'_'+slug(group)+'_'+slug(item);
  }
  function addDays(date,days){const d=new Date(date+'T12:00');d.setDate(d.getDate()+days);return d}
  function stateFor(name,group,item){
    const key=roomKey(name,group,item), p=periodicFor(item);
    if(group==='Diario'||group==='Semanal')return{key,checked:localStorage.getItem(key)==='1',date:null,p:null};
    if(p){const h=hist(),date=h[p[0]]||null;return{key,checked:!!date,date,p}}
    const date=localStorage.getItem(key);return{key,checked:!!date,date,p:null};
  }
  function status(group,s){
    if(group==='Diario'||group==='Semanal')return '';
    if(!s.date)return '<div class="muted" style="margin-left:30px">Sin registrar</div>';
    let txt='Última: '+new Date(s.date+'T12:00').toLocaleDateString('es-ES');
    if(s.p){const next=addDays(s.date,s.p[2]),dif=Math.ceil((next-new Date())/86400000);txt+=' · Próxima: '+next.toLocaleDateString('es-ES')+' · '+(dif<=0?'Toca ahora':'faltan '+dif+' días')}
    else if(group==='Mensual'){const next=addDays(s.date,30);txt+=' · Próxima referencia: '+next.toLocaleDateString('es-ES')}
    return '<div class="muted" style="margin-left:30px">'+txt+'</div>';
  }
  window.fillRoom=function(name,group){
    const a=rooms[name][group];
    if(!a.length){rtasks.innerHTML='<div class="muted" style="padding:12px 0">Sin tareas fijas.</div>';return}
    rtasks.innerHTML=a.map((item,i)=>{const s=stateFor(name,group,item);return '<div class="list"><label class="task '+(s.checked?'done':'')+'"><input type="checkbox" data-roomcheck="'+i+'" '+(s.checked?'checked':'')+'><span>'+item+'</span></label>'+status(group,s)+'</div>'}).join('');
    rtasks.querySelectorAll('[data-roomcheck]').forEach(cb=>cb.addEventListener('change',()=>{
      const item=a[Number(cb.dataset.roomcheck)],s=stateFor(name,group,item);
      if(group==='Diario'||group==='Semanal'){
        if(cb.checked)localStorage.setItem(s.key,'1');else localStorage.removeItem(s.key);
      }else if(s.p){
        const h=hist();if(cb.checked)h[s.p[0]]=localISO();else if(h[s.p[0]]===s.date)delete h[s.p[0]];setHist(h);
      }else{
        if(cb.checked)localStorage.setItem(s.key,localISO());else localStorage.removeItem(s.key);
      }
      window.fillRoom(name,group);
    }));
  };
})();