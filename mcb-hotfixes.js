/* McB · Al Ataque V2 — capa de hotfixes segura.
   Permite corregir comportamientos pequeños sin reescribir el index monolítico.
   Cuando V2 se modularice, estos parches se moverán a sus módulos definitivos. */
(function () {
  'use strict';

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
    if (typeof window.taskHTML !== 'function' || window.__mcbHotfixesInstalled) return;
    var originalTaskHTML = window.taskHTML;
    window.taskHTML = function (task) {
      return window.mcbTaskHTML(task, originalTaskHTML);
    };
    window.__mcbHotfixesInstalled = true;
    if (typeof window.render === 'function') window.render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
