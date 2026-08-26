/* McB · checklists de Estancias */
(function(){
  const originalFillRoom = window.fillRoom;
  function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').toLowerCase()}
  function roomKey(name,group,item){
    if(group==='Diario') return 'mcb_room_day_'+localISO()+'_'+slug(name)+'_'+slug(item);
    if(group==='Semanal') return 'mcb_room_week_'+currentWeek()+'_'+slug(name)+'_'+slug(item);
    return 'mcb_room_date_'+slug(name)+'_'+slug(group)+'_'+slug(item);
  }
  function statusText(group,key){
    if(group==='Diario'||group==='Semanal') return '';
    const d=localStorage.getItem(key);
    return d ? '<div class="muted" style="margin-left:30px">Última: '+new Date(d+'T12:00').toLocaleDateString('es-ES')+'</div>' : '<div class="muted" style="margin-left:30px">Sin registrar</div>';
  }
  window.fillRoom=function(name,group){
    const a=rooms[name][group];
    if(!a.length){rtasks.innerHTML='<div class="muted" style="padding:12px 0">Sin tareas fijas.</div>';return}
    rtasks.innerHTML=a.map((item,i)=>{
      const key=roomKey(name,group,item), val=localStorage.getItem(key), checked=(group==='Diario'||group==='Semanal')?val==='1':!!val;
      return '<div class="list"><label class="task '+(checked?'done':'')+'"><input type="checkbox" data-roomcheck="'+i+'" '+(checked?'checked':'')+'><span>'+item+'</span></label>'+statusText(group,key)+'</div>';
    }).join('');
    rtasks.querySelectorAll('[data-roomcheck]').forEach(cb=>cb.addEventListener('change',()=>{
      const item=a[Number(cb.dataset.roomcheck)], key=roomKey(name,group,item);
      if(group==='Diario'||group==='Semanal'){
        if(cb.checked)localStorage.setItem(key,'1');else localStorage.removeItem(key);
      }else{
        if(cb.checked)localStorage.setItem(key,localISO());else localStorage.removeItem(key);
        // Si coincide con una periódica principal, sincroniza también su historial.
        const match=periodic.find(p=>slug(p[1]).includes(slug(item))||slug(item).includes(slug(p[1])));
        if(match){const h=hist();if(cb.checked)h[match[0]]=localISO();else if(h[match[0]]===localISO())delete h[match[0]];setHist(h)}
      }
      window.fillRoom(name,group);
    }));
  };
})();