/* McB · Al Ataque V2 — compatibilidad y migraciones seguras.
   Repara estructuras antiguas/incompletas sin borrar datos válidos. */
(function () {
  'use strict';

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function text(v, fallback) { return typeof v === 'string' ? v : fallback; }

  function normalize() {
    if (typeof state !== 'undefined') {
      state = obj(state);
      state.mode = ['10','30','60','normal','none'].includes(state.mode) ? state.mode : 'normal';
      state.done = obj(state.done);
      state.quick = arr(state.quick).map(function (q) {
        if (typeof q === 'string') return { text:q, done:false };
        q = obj(q); return { text:text(q.text,''), done:!!q.done };
      }).filter(function(q){ return q.text; });
    }

    if (typeof house !== 'undefined') {
      house = obj(house);
      house.condition = ['poco','normal','mucho','minimo'].includes(house.condition) ? house.condition : 'normal';
    }

    if (typeof laundry !== 'undefined') {
      laundry = obj(laundry);
      laundry.basket = ['low','medium','full'].includes(laundry.basket) ? laundry.basket : 'medium';
      laundry.drying = ['tender','dryer'].includes(laundry.drying) ? laundry.drying : 'tender';
      laundry.batches = arr(laundry.batches).map(function (b,i) {
        b=obj(b); var step=['dirty','washing','drying','clean','done'].includes(b.step)?b.step:'dirty';
        return { id:text(b.id,'legacy_'+i), name:text(b.name,'Carga de ropa'), step:step };
      });
    }

    if (typeof food !== 'undefined') {
      food = obj(food);
      food.plans = obj(food.plans);
      food.plans.today = text(food.plans.today,'');
      food.plans.tomorrow = text(food.plans.tomorrow,'');
      food.leftovers = arr(food.leftovers).filter(function(x){return typeof x==='string'&&x.trim();});
      food.useSoon = arr(food.useSoon).filter(function(x){return typeof x==='string'&&x.trim();});
      food.freezer = arr(food.freezer).map(function(x){
        if(typeof x==='string') return {name:x,portions:1};
        x=obj(x); return {name:text(x.name,''),portions:Number(x.portions)||1};
      }).filter(function(x){return x.name;});
      food.dishes = arr(food.dishes).map(function(x){
        if(typeof x==='string') return {name:x,tags:[]};
        x=obj(x); return {name:text(x.name,''),tags:arr(x.tags).filter(function(t){return typeof t==='string';})};
      }).filter(function(x){return x.name;});
      if(!food.dishes.length) food.dishes=[{name:'Lentejas',tags:['guiso','facil']},{name:'Tortilla de patata',tags:['facil']},{name:'Pasta',tags:['rapido','facil']}];
      food.filter = ['rapido','guiso','facil','congelador','aprovechar','sorpresa'].includes(food.filter) ? food.filter : 'facil';
    }

    if (typeof shop !== 'undefined') {
      shop = obj(shop);
      shop.items = arr(shop.items).map(function(x,i){
        if(typeof x==='string') x={name:x}; else x=obj(x);
        var name=text(x.name,'').trim();
        return {id:text(x.id,'legacy_shop_'+i),name:name,category:text(x.category,typeof cat==='function'?cat(name):'Despensa y otros'),urgent:!!x.urgent,bought:!!x.bought,source:text(x.source,'manual')};
      }).filter(function(x){return x.name;});
      shop.stock = arr(shop.stock).map(function(x){
        if(typeof x==='string') return {name:x,state:'ok'};
        x=obj(x); return {name:text(x.name,''),state:['ok','low','out'].includes(x.state)?x.state:'ok'};
      }).filter(function(x){return x.name;});
      if(!shop.stock.length) shop.stock=[{name:'Papel higiénico',state:'ok'},{name:'Detergente',state:'ok'},{name:'Leche',state:'ok'}];
    }

    if (typeof people !== 'undefined') {
      people = obj(people);
      people.assignments = obj(people.assignments);
      people.members = arr(people.members).map(function(p,i){
        p=obj(p); var participation=['no','simple','normal'].includes(p.participation)?p.participation:'normal';
        var capacity=['none','low','normal','high'].includes(p.capacity)?p.capacity:'normal';
        return {id:text(p.id,'legacy_person_'+i),name:text(p.name,p.nombre||('Persona '+(i+1))),participation:participation,capacity:capacity,active:participation!=='no' && p.active!==false};
      });
      var ids=new Set(people.members.map(function(p){return p.id;}));
      Object.keys(people.assignments).forEach(function(k){ if(!ids.has(people.assignments[k])) delete people.assignments[k]; });
    }

    if (typeof save === 'function') save();
  }

  function foodDecisionTask(task) {
    return task && task.id === 'food_today' && typeof food !== 'undefined' && Array.isArray(food.leftovers) && food.leftovers.length > 0 && food.plans && !food.plans.today;
  }

  window.mcbTaskHTML = function (task, originalTaskHTML) {
    if (!foodDecisionTask(task)) return originalTaskHTML(task);
    var assigned = typeof assignee === 'function' ? assignee(task) : '';
    return '<div class="task"><div class="taskHead"><div><b>' + esc(task.text) + '</b> ' + assigned +
      '<div class="meta">Elige una sobra o decide otra comida.</div></div>' +
      '<button class="btn soft" type="button" onclick="openView(\'comida\')">Decidir comida →</button></div></div>';
  };

  function install() {
    if (window.__mcbHotfixesInstalled) return;
    normalize();
    if (typeof window.taskHTML === 'function') {
      var originalTaskHTML = window.taskHTML;
      window.taskHTML = function (task) { return window.mcbTaskHTML(task, originalTaskHTML); };
    }
    window.__mcbHotfixesInstalled = true;
    if (typeof window.render === 'function') window.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
