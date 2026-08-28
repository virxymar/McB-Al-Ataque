/* McB · Al Ataque V2 — compatibilidad y migraciones seguras.
   Repara estructuras antiguas/incompletas sin borrar datos válidos. */
(function () {
  'use strict';

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function text(v, fallback) { return typeof v === 'string' ? v : fallback; }

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (e) { return null; }
  }

  function activeHomeFrom(v) {
    if (!v || typeof v !== 'object') return null;
    if (Array.isArray(v.homes) && v.homes.length) {
      return v.homes.find(function(h){ return h && h.id === v.activeHomeId; }) || v.homes[0];
    }
    return v;
  }

  function configuredHome() {
    var keys=['mcb_v2_home','mcb_config_v2','mcb_home_v2','mcb_config_lab','mcb_v2_home_draft'];
    for (var i=0;i<keys.length;i++) {
      var h=activeHomeFrom(readJSON(keys[i]));
      if (h) return h;
    }
    return null;
  }

  function mapParticipation(v) {
    return v==='no'?'no':(v==='sencilla'||v==='simple')?'simple':'normal';
  }

  function mapCapacity(v) {
    if (v==='poca'||v==='low') return 'low';
    if (v==='bastante'||v==='high') return 'high';
    if (v==='none') return 'none';
    return 'normal';
  }

  function syncConfigPeople() {
    if (typeof people === 'undefined') return;
    var h=configuredHome();
    if (!h) return;
    var source=arr(h.members).length?h.members:h.people;
    if (!Array.isArray(source) || !source.length) return;

    var onlyDefault = Array.isArray(people.members) && people.members.length===1 &&
      people.members[0] && people.members[0].id==='me' && people.members[0].name==='Yo';
    if (!onlyDefault && people.members && people.members.length) return;

    people.members=source.map(function(p,i){
      p=obj(p);
      var participation=mapParticipation(p.participation);
      return Object.assign({},p,{
        id:text(p.id,'cfg_person_'+i),
        name:text(p.name,p.nombre||('Persona '+(i+1))),
        participation:participation,
        capacity:mapCapacity(p.capacity||p.availability),
        active:participation!=='no'
      });
    });
  }

  function normalize() {
    if (typeof state !== 'undefined') {
      state = obj(state);
      state.mode = ['10','30','60','normal','none'].includes(state.mode) ? state.mode : 'normal';
      state.done = obj(state.done);
      state.quick = arr(state.quick).map(function (q) {
        if (typeof q === 'string') return { text:q, done:false };
        q = obj(q); return Object.assign({}, q, { text:text(q.text,''), done:!!q.done });
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
        return Object.assign({}, b, { id:text(b.id,'legacy_'+i), name:text(b.name,'Carga de ropa'), step:step });
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
        x=obj(x); return Object.assign({}, x, {name:text(x.name,''),portions:Number(x.portions)||1});
      }).filter(function(x){return x.name;});
      food.dishes = arr(food.dishes).map(function(x){
        if(typeof x==='string') return {name:x,tags:[]};
        x=obj(x); return Object.assign({}, x, {name:text(x.name,''),tags:arr(x.tags).filter(function(t){return typeof t==='string';})});
      }).filter(function(x){return x.name;});
      if(!food.dishes.length) food.dishes=[{name:'Lentejas',tags:['guiso','facil']},{name:'Tortilla de patata',tags:['facil']},{name:'Pasta',tags:['rapido','facil']}];
      food.filter = ['rapido','guiso','facil','congelador','aprovechar','sorpresa'].includes(food.filter) ? food.filter : 'facil';
    }

    if (typeof shop !== 'undefined') {
      shop = obj(shop);
      shop.items = arr(shop.items).map(function(x,i){
        if(typeof x==='string') x={name:x}; else x=obj(x);
        var name=text(x.name,'').trim();
        return Object.assign({}, x, {id:text(x.id,'legacy_shop_'+i),name:name,category:text(x.category,typeof cat==='function'?cat(name):'Despensa y otros'),urgent:!!x.urgent,bought:!!x.bought,source:text(x.source,'manual')});
      }).filter(function(x){return x.name;});
      shop.stock = arr(shop.stock).map(function(x){
        if(typeof x==='string') return {name:x,state:'ok'};
        x=obj(x); return Object.assign({}, x, {name:text(x.name,''),state:['ok','low','out'].includes(x.state)?x.state:'ok'});
      }).filter(function(x){return x.name;});
      if(!shop.stock.length) shop.stock=[{name:'Papel higiénico',state:'ok'},{name:'Detergente',state:'ok'},{name:'Leche',state:'ok'}];
    }

    if (typeof people !== 'undefined') {
      people = obj(people);
      people.assignments = obj(people.assignments);
      people.members = arr(people.members).map(function(p,i){
        p=obj(p); var participation=mapParticipation(p.participation);
        var capacity=mapCapacity(p.capacity||p.availability);
        return Object.assign({}, p, {id:text(p.id,'legacy_person_'+i),name:text(p.name,p.nombre||('Persona '+(i+1))),participation:participation,capacity:capacity,active:participation!=='no' && p.active!==false});
      });
      syncConfigPeople();
      var ids=new Set(people.members.map(function(p){return p.id;}));
      Object.keys(people.assignments).forEach(function(k){ if(!ids.has(people.assignments[k])) delete people.assignments[k]; });
    }

    if (typeof save === 'function') save();
  }

  if (typeof window.cfg === 'function') {
    window.cfg = function(){ return configuredHome(); };
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
