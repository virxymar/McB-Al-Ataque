# McB · Al Ataque — Batería de pruebas V1

Objetivo: comprobar recorridos reales, no solo pantallas sueltas. Una prueba solo pasa si el estado queda coherente después de cerrar/reabrir la app.

## 1. Configuración desde cero
- Crear hogar con 3 personas: participación normal, tareas sencillas y no participa.
- Añadir mascotas, secadora/plancha y tiempo disponible.
- Guardar hogar.
- Esperado: nombre del hogar visible; personas importadas; `sencilla → simple`; quien no participa queda fuera del reparto.

## 2. Hoy
- Probar 10 min, 30 min, 1 h, Normal y Hoy no puedo.
- Esperado: reduce carga sin inventar trabajo; el tiempo mostrado es activo; los apuntes de “Ha surgido algo” no se meten a escondidas en el presupuesto.

## 3. Casa
- Probar los cuatro estados de la casa.
- Marcar una tarea hecha y desmarcarla.
- Probar “Puede esperar”.
- Esperado: desaparece durante 24 h y vuelve después; no queda marcada como hecha.
- Probar “No lo necesita” y “Volver a activar”.
- Esperado: queda oculta hasta reactivarla.
- Marcar “Cambio de sábanas”.
- Esperado: crea una carga de ropa de cama.
- Desmarcar inmediatamente “Cambio de sábanas”.
- Esperado: elimina únicamente la carga automática si sigue en Cesto; nunca borra una colada ya iniciada.

## 4. Colada
- Cesto rojo sin cargas → crear carga desde Hoy.
- Recorrer Cesto → Lavando → Secando → Seca → Guardada.
- Probar Atrás.
- Cambiar Tender/Secadora.
- Probar plancha y mantenimiento.
- Esperado: Hoy siempre enseña solo el siguiente paso y conserva la persona asignada mientras la carga avanza.

## 5. Comidas
- Sin plan → decidir hoy y mañana.
- Usar una sobra hoy.
- Usar algo de “gastar pronto”.
- Congelador con 2 raciones → usar una y comprobar que queda 1.
- Cambio de día de 1 jornada: mañana pasa a hoy.
- Salto de más de 1 día: planes antiguos no deben reaparecer como si fueran actuales.
- Esperado: ninguna decisión se puede fingir con un simple checkbox.

## 6. Compra
- Añadir producto manual.
- Añadir el mismo producto otra vez.
- Esperado: no duplica.
- Marcar un básico 🟠 y después 🔴.
- Esperado: una sola línea de compra; 🔴 = necesario.
- Marcar comprado.
- Esperado: permanece en “En el carro” y se puede desmarcar.
- Terminar compra.
- Esperado: desaparecen solo los comprados y los básicos correspondientes vuelven a 🟢.
- Eliminar un artículo.
- Esperado: no depende del objeto global `event`.

## 7. Personas y reparto
- Asignar una tarea manualmente.
- Ejecutar “Ayúdame a repartir”.
- Esperado: respeta la asignación manual.
- Persona con tareas sencillas.
- Esperado: no recibe tareas de más de 10 min.
- Persona “No puede hoy”.
- Esperado: queda fuera y se liberan sus tareas.

## 8. Persistencia y PWA
- Cerrar/reabrir tras cambios en cada módulo.
- Probar dato local JSON corrupto.
- Esperado: el preflight conserva copia y permite arrancar.
- Probar online/offline: app y configurador.
- Esperado: cada navegación conserva su propia página; `configurador.html` nunca sustituye al `index.html` offline.

## Criterio de salida V1
No se mergea a `main` mientras exista un fallo que pueda perder datos, bloquear el arranque, duplicar responsabilidades, ocultar una tarea necesaria o hacer reaparecer trabajo que el usuario ya resolvió.
