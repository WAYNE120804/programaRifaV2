# Sistema de Rifas V2

Proyecto para administrar rifas, vendedores, asignacion de boletas, ventas, caja, gastos, abonos, recibos y premios anticipados.

## Estado actual

- La base de datos objetivo es PostgreSQL.
- Existe un `backend/prisma/schema.prisma` amplio y alineado con la evolucion funcional del sistema.
- El backend legacy de Sequelize fue retirado.
- El backend base de Fase 0 ya fue creado sobre `Express + Prisma`.
- El frontend ya tiene pantallas base para rifas, vendedores, asignaciones, abonos, gastos, caja y recibos.
- El documento funcional base es `C:/Users/jhons/Downloads/Especificacion Sistema Rifas Codex.docx`.
- Se decidio construir backend y frontend en TypeScript.
- Se realizo una ronda de actualizacion de dependencias y `npm audit` quedo en cero en backend y frontend.
- La migracion tecnica inicial a TypeScript ya fue aplicada en backend y frontend.

## Decision de trabajo

Antes de desarrollar modulos nuevos, toda implementacion debe:

- tomar como fuente de verdad el schema Prisma y no los modelos legacy de Sequelize;
- mantener este `README.md` actualizado con cambios estructurales;
- mantener `codex.md` actualizado con contexto operativo, decisiones y avances por fase;
- reconstruir el backend desde cero y retirar la base legacy de `Sequelize`, ya que no hay datos productivos que preservar.

## Arquitectura objetivo

### Backend

- `Express + TypeScript` como API HTTP.
- `Prisma Client` como capa de acceso a datos.
- Organizacion sugerida:
  - `src/lib/prisma.js`
  - `src/modules/<modulo>/<modulo>.service.js`
  - `src/modules/<modulo>/<modulo>.controller.js`
  - `src/modules/<modulo>/<modulo>.routes.js`
  - `src/modules/<modulo>/<modulo>.schemas.js`

### Frontend

- `React + TypeScript + Vite + Zustand`.
- Consumo incremental por modulo, con pruebas funcionales en paralelo contra endpoints reales.

## Fases de implementacion

### Fase 0. Base tecnica

- Eliminar backend legacy basado en Sequelize.
- Crear backend nuevo basado en Prisma.
- Definir estructura modular del backend.
- Agregar manejo uniforme de errores, validaciones y serializacion decimal/fecha.
- Preparar `README.md` y `codex.md` como documentos vivos.

### Avance actual de Fase 0

- backend legacy eliminado;
- estructura base modular creada;
- cliente Prisma configurado y verificado contra PostgreSQL;
- endpoint `GET /api/health` operativo.
- frontend actualizado y `npm run build` exitoso.
- backend compila con `npm run build`.
- frontend pasa `npm run typecheck` y `npm run build`.

### Fase 1. Rifas, usuarios base y vendedores

- Backend: rifas, vendedores, vinculacion `RifaVendedor`.
- Frontend: CRUD de rifas, CRUD de vendedores, detalle de rifa y detalle de vendedor.
- Validacion: crear rifa, crear vendedor, vincular vendedor a rifa.

### Fase 2. Boletas y asignaciones

- Backend: generacion/listado de boletas, asignacion y devolucion.
- Frontend: pantalla de asignar boletas e historial.
- Validacion: asignar lote de boletas, devolver boletas, consultar estados.

### Avance inicial Fase 2

- se creo el modulo `boletas` en backend con:
  - `GET /api/boletas`
  - `GET /api/boletas/:id`
  - `PUT /api/boletas/:id`
- el listado de boletas ya soporta filtros por:
  - `rifaId`
  - `rifaVendedorId`
  - `estado`
  - `numero`
- se agrego nueva pantalla `Boletas` en el frontend con:
  - acceso desde menu lateral;
  - vista por rifa;
  - buscador dinamico por numero;
  - filtros por estado y vendedor;
  - cuadricula de boletas numeradas;
  - edicion puntual de una boleta para cambiar estado y asignacion.
- prueba end-to-end realizada:
  - crear rifa de prueba;
  - crear vendedor;
  - vincular vendedor a rifa;
  - listar 100 boletas de una rifa de 2 cifras;
  - editar una boleta puntual y asignarla a un vendedor.
- se extendio `Asignaciones` para crear asignaciones reales de boletas por lote:
  - aleatoria por cantidad;
  - por rango;
  - por lista pegada.
- se agrego `Devoluciones` sobre la misma relacion `rifa-vendedor` con dos modos:
  - por lista pegada;
  - devolver todas las boletas actualmente asignadas a ese vendedor.
- la lista pegada acepta separadores flexibles como:
  - saltos de linea;
  - espacios;
  - comas;
  - guiones;
  - punto y coma.
- cada asignacion crea su historial y actualiza:
  - `AsignacionBoletas`;
  - `AsignacionDetalle`;
  - estado de boletas a `ASIGNADA`;
  - `saldoActual` del `RifaVendedor`.
- cada devolucion crea su historial y actualiza:
  - `DevolucionBoletas`;
  - `DevolucionDetalle`;
  - estado de boletas a `DISPONIBLE`;
  - limpieza de `rifaVendedorId`;
  - descuento de `saldoActual` del `RifaVendedor`.
- si en una devolucion por lista se mezclan boletas que si pertenecen al vendedor con otras que no:
  - el sistema ya no bloquea todo con un mensaje plano;
  - abre un modal practico con las boletas que si se pueden devolver;
  - muestra las boletas no retornables con su estado actual y el vendedor al que pertenecen si aplica;
  - el usuario puede cancelar o continuar solo con las boletas validas.
- si en una asignacion por rango o por lista hay boletas ya ocupadas:
  - ya no se muestra solo un banner plano;
  - el sistema abre un modal con las boletas bloqueadas, su estado y el vendedor actual si existe;
  - el usuario puede cancelar o continuar solo con las boletas disponibles.
- se agrego modulo `Configuracion` con persistencia para:
  - nombre de la casa rifera;
  - logo de la empresa.
- `Configuracion` ahora tambien guarda:
  - nombre del responsable de la rifa;
  - telefono;
  - direccion;
  - ciudad;
  - departamento;
  - numero de resolucion de autorizacion;
  - entidad que autoriza.
- el nombre y logo configurados ya se reflejan en:
  - menu lateral;
  - planillas de impresion de boletas.
- los colores configurados ya controlan:
  - fondo lateral;
  - color de botones del menu;
  - color del item activo;
  - fondo y texto del topbar;
  - encabezados de tablas.
- los datos regulatorios y del responsable ahora tambien aparecen en la planilla de impresion y quedan listos para futura pagina publica.
- se agrego impresion de boletas en:
  - pantalla `Boletas`, usando el filtro activo por `rifa-vendedor`;
  - historial general de `Asignaciones`;
  - historial inmediato dentro de `Asignaciones`.
- `Devoluciones` se separo de `Asignaciones` y ahora vive en su propio menu y pantalla dedicada.
- la planilla de impresion:
  - muestra nombre de la casa rifera y nombre de la rifa en el encabezado;
  - toma vendedor, telefono y direccion de la relacion `rifa-vendedor`;
  - muestra responsable, entidad autorizadora y resolucion;
  - resalta con fondos distintos el bloque de vendedor, responsable y total de boletas;
  - elimina la columna lateral de orden;
  - ordena los numeros por columnas `0` a `9`;
  - pagina automaticamente cuando no caben todos los numeros;
  - muestra indicador de pagina `1/2`, `2/2`, etc.;
  - agrega pie con fecha/hora de impresion y resumen pequeno de asignaciones por fecha.

### Fase 3. Ventas y clientes

- Backend: clientes, ventas, reserva de boletas, cambio de estados, saldo pendiente.
- Frontend: flujo de venta con seleccion de boletas y cliente.
- Validacion: venta pendiente, abonos del cliente, venta pagada.

### Fase 4. Caja, pagos, abonos y recibos

- Backend: cajas, subcajas, movimientos, pagos de cliente, abonos de vendedor, recibos.
- Frontend: dashboard de caja, crear abono, historial, vista de recibo.
- Validacion: registrar ingreso/egreso, actualizar saldos, emitir recibo.

### Avance 2026-03-30 - Caja subfase 4.1 y 4.2

- backend:
  - se agregaron endpoints:
    - `GET /api/cajas`
    - `GET /api/cajas/:id`
    - `GET /api/cajas/resumen?rifaId=...`
    - `GET /api/subcajas?rifaId=...`
    - `POST /api/subcajas`
    - `DELETE /api/subcajas/:id`
  - `AbonoVendedor` ahora puede quedar ligado a una `subCaja`;
  - `Gasto` ahora puede quedar ligado a una `subCaja`;
  - al registrar un abono:
    - obliga seleccion de subcaja;
    - incrementa saldo de caja general;
    - incrementa saldo de subcaja;
    - crea movimiento `INGRESO`.
  - al registrar un gasto con subcaja:
    - descuenta saldo de caja general;
    - descuenta saldo de subcaja;
    - crea movimiento `EGRESO`.
  - el resumen de caja por rifa ya calcula:
    - `dineroPorRecoger`
    - `dineroRecogido`
    - `dineroFaltante`
    - estado por vendedor (`AL_DIA`, `PENDIENTE`, `SALDO_A_FAVOR`)
- frontend:
  - `Registrar abono` ahora exige `subcaja destino`;
  - `Registrar gasto` ahora permite `subcaja origen`;
  - `Caja` fue rehecha para trabajar por rifa y ahora muestra:
    - dinero a recoger;
    - dinero recogido;
    - faltante por recoger;
    - saldo de caja general;
    - listado y creacion de subcajas;
    - abonos y gastos por subcaja;
    - tabla de estado de recaudo por vendedor.
  - `Movimientos de caja` ahora trabaja por rifa y muestra ingresos/egresos recientes.
- verificacion:
  - `prisma generate` correcto;
  - `prisma db push --accept-data-loss` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`.

### Avance 2026-03-30 - Caja subfase 4.3 y 4.4

- frontend:
  - se agrego `VER INFORME` en `Caja`;
  - se creo vista dedicada del informe general de caja;
  - desde esa vista tambien se puede `IMPRIMIR INFORME`.
- el informe carta de caja ahora incluye:
  - resumen general de ingresos, egresos y saldo;
  - caja general;
  - subcajas;
  - estado por vendedor con colores;
  - dinero a recoger, recogido y faltante;
  - resumen de gastos por categoria;
  - consolidado final para revision administrativa.
- verificacion:
  - frontend pasa `typecheck` y `build`.

### Ajuste de prioridad administrativa

- antes de construir `clientes` y `ventas`, se adelanta el slice administrativo de `abonos + recibos`;
- la razon es operativa: el panel ya necesitaba control real de deuda por vendedor y soporte de recibos verificables.

### Fase 5. Gastos y cierres operativos

- Backend: gastos por rifa y trazabilidad de movimientos.
- Frontend: CRUD de gastos y consulta de movimientos.
- Validacion: registrar gasto y reflejarlo en caja.

### Fase 6. Premios y premios anticipados

- Backend: `Premio`, `BoletaPremio`, reglas de asignacion, consulta por premio.
- Frontend: gestion de premios por rifa y visualizacion de participacion de boletas.
- Validacion: crear premio mayor, crear anticipado, asignar boletas, consultar elegibilidad.

### Fase 7. Reportes y exportaciones

- Backend: exportacion por vendedor y por premio.
- Frontend: filtros y acciones de exportacion.
- Validacion: archivos consistentes con estados reales de boletas.

## Criterio de avance

Cada fase debe cerrar con:

- endpoints funcionando;
- frontend conectado al backend real;
- prueba manual del flujo principal;
- actualizacion de `README.md` y `codex.md`.

## Avance Fase 1

- modulo `rifas` implementado en backend con Prisma;
- pantallas de `rifas` adaptadas al contrato nuevo del backend;
- prueba end-to-end realizada sobre PostgreSQL para crear, listar y consultar rifas;
- caja principal creada automaticamente al registrar una rifa.
- al crear una rifa ahora se define `numeroCifras` con opciones `2`, `3` o `4`;
- al crear una rifa el sistema genera automaticamente sus boletas:
  - `2 cifras`: `00` a `99`;
  - `3 cifras`: `000` a `999`;
  - `4 cifras`: `0000` a `9999`.
- modulo `vendedores` implementado en backend con Prisma;
- pantallas de `vendedores` adaptadas al contrato nuevo del backend;
- prueba end-to-end realizada sobre PostgreSQL para crear, listar y consultar vendedores.
- modulo `RifaVendedor` implementado en backend con Prisma;
- pantalla de asignaciones adaptada para gestionar la relacion real entre rifas y vendedores;
- prueba end-to-end realizada sobre PostgreSQL para crear rifa, crear vendedor, vincularlos y consultar la relacion.
- pantalla de asignaciones mejorada con:
  - buscador dinamico por rifa;
  - buscador dinamico por vendedor;
  - edicion de comision y precio casa;
  - vista filtrada por rifa desde el detalle de la rifa.

## Avance 2026-03-30 - Abonos y recibos administrativos

- backend:
  - se agregaron endpoints:
    - `GET /api/rifa-vendedores/:id/abonos`
    - `POST /api/rifa-vendedores/:id/abonos`
    - `GET /api/recibos/:id`
    - `GET /api/recibos/codigo/:codigo`
  - `AbonoVendedor` ahora guarda snapshot de:
    - `descripcion`
    - `saldoAnterior`
    - `saldoDespues`
    - `boletasActuales`
  - al registrar abono:
    - valida que exista deuda;
    - valida que el valor no supere la deuda actual;
    - descuenta `saldoActual` en `RifaVendedor`;
    - crea `Recibo` con `consecutivo` y `codigoUnico`.
- frontend:
  - `Abonos` fue rehecho sobre el contrato nuevo de `RifaVendedor`;
  - `Registrar abono` permite:
    - buscar relacion rifa-vendedor;
    - registrar fecha;
    - registrar valor;
    - registrar descripcion;
    - elegir metodo de pago;
    - navegar directo al recibo generado.
  - `Historial de abonos` ahora muestra:
    - fecha;
    - valor;
    - deuda anterior;
    - deuda despues;
    - boletas actuales;
    - descripcion;
    - acceso a `Ver recibo`.
  - la vista `Recibo` ahora funciona como tirilla e incluye:
    - logo y nombre de la casa rifera;
    - informacion de la rifa;
    - informacion del vendedor;
    - valor del abono;
    - deuda anterior;
    - deuda restante;
    - boletas al momento del abono;
    - descripcion;
    - QR de verificacion.
  - se agrego pagina publica de verificacion:
    - ruta ` /verificacion/abonos/:codigo`
    - muestra detalle ampliado del recibo para validar autenticidad.
  - el `codigoUnico` del recibo ahora usa formato legible:
    - `RIFAID-ULT4DOC-CONSECUTIVO-VALOR`
  - en `Abonos` ahora existe buscador interno por:
    - `codigoUnico`
    - `consecutivo`
    dentro de la relacion `rifa-vendedor` seleccionada.
  - el boton `Registrar abono` se movio junto al filtro principal del estado de cuenta.
  - la impresion del recibo ya no usa `window.print()` sobre toda la pagina:
    - imprime solo la tirilla;
    - usa formato angosto tipo supermercado;
    - permite elegir `1` o `2` copias antes de abrir el dialogo normal de impresion.
- verificacion:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`.

## Avance 2026-03-30 - Gastos administrativos

- backend:
  - se agregaron endpoints:
    - `GET /api/gastos`
    - `GET /api/gastos/:id`
    - `POST /api/gastos`
    - `GET /api/gasto-recibos/:id`
    - `GET /api/gasto-recibos/codigo/:codigo`
  - se agrego `GastoRecibo` para dejar cada gasto con:
    - `consecutivo`
    - `codigoUnico`
    - fecha del recibo
  - al registrar un gasto:
    - valida `rifaId`;
    - valida `valor > 0`;
    - toma la fecha elegida por el usuario y la combina con la hora real del sistema;
    - genera recibo verificable de gasto.
- frontend:
  - `Gastos` fue rehecho para trabajar sobre el backend nuevo;
  - `Registrar gasto` ahora permite:
    - seleccionar rifa;
    - seleccionar categoria;
    - registrar valor;
    - registrar fecha;
    - registrar descripcion;
    - navegar directo al recibo generado.
  - `Historial de gastos` ahora incluye:
    - filtro por rifa;
    - filtro por categoria;
    - buscador por descripcion;
    - buscador por `codigoUnico`;
    - buscador por `consecutivo`;
    - resumen de total de gastos y valor acumulado;
    - acceso a `Ver recibo`.
  - la vista `Recibo de gasto` ahora funciona en estilo tirilla e incluye:
    - logo y nombre de la casa rifera;
    - informacion regulatoria y del responsable;
    - datos de la rifa;
    - consecutivo y codigo unico;
    - fecha;
    - valor;
    - categoria;
    - descripcion.
  - la impresion del gasto:
    - imprime solo la tirilla;
    - usa formato angosto;
    - permite elegir `1` o `2` copias antes del dialogo normal de impresion.
  - se agrego `Imprimir informe` en formato carta:
    - toma todos los gastos de la rifa seleccionada;
    - agrupa por categoria;
    - muestra detalle por categoria con fecha, hora, rifa, descripcion, codigo y valor;
    - incluye resumen visual por categoria;
    - cierra con totales por categoria y total general.
  - se agrego `Ver informe`:
    - abre una vista dedicada del informe por rifa;
    - desde esa vista tambien se puede imprimir el mismo informe carta.
  - categorias iniciales disponibles:
    - sueldos;
    - publicidad;
    - arriendo;
    - recibos de servicio publico;
    - gasolina y transporte;
    - impresion y papeleria;
    - premios y logistica;
    - mantenimiento;
    - comisiones bancarias;
    - otros.
- verificacion:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`.

## Avance 2026-03-30 - Anulacion operativa y formato COP

- backend:
  - `AbonoVendedor` ahora guarda:
    - `anuladoAt`
    - `anuladoMotivo`
  - `Gasto` ahora guarda:
    - `anuladoAt`
    - `anuladoMotivo`
  - se agregaron endpoints:
    - `POST /api/rifa-vendedores/:id/abonos/:abonoId/anular`
    - `POST /api/gastos/:id/anular`
  - la anulacion de abonos:
    - revierte `saldoActual` del vendedor;
    - descuenta caja general y subcaja;
    - crea movimiento compensatorio de caja;
    - marca el abono como rechazado y anulado.
  - la anulacion de gastos:
    - devuelve saldo a caja general y subcaja;
    - crea movimiento compensatorio de caja;
    - marca fecha y motivo de anulacion.
- frontend:
  - `MoneyInput` ahora formatea valores COP en vivo con separadores de miles:
    - `20000` se visualiza como `20.000`
  - esto ya aplica a formularios de:
    - abonos;
    - gastos.
  - `ReciboView` permite anular abonos con motivo obligatorio.
  - `GastoReciboView` permite anular gastos con motivo obligatorio.
  - `HistorialAbonos` y `GastoList` ahora muestran acceso directo a anulacion via recibo y estado `ANULADO` cuando aplica.
  - el estado por vendedor en `Caja` e `Informe general de caja` ahora colorea toda la fila:
    - rojo si aun debe;
    - verde si esta al dia;
    - ambar si tiene saldo a favor.
- criterio funcional:
  - para operaciones contables se prioriza `anular` sobre `editar` para mantener trazabilidad y reversar caja correctamente.
- verificacion:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend compila.

## Ajuste 2026-03-30 - Correccion de dinero fantasma en caja

- problema corregido:
  - los reportes de caja estaban tomando todos los `INGRESO` como si fueran abonos reales y todos los `EGRESO` como si fueran gastos reales;
  - eso hacia que un reverso de anulacion apareciera como dinero operativo valido.
- correccion aplicada:
  - el `saldo` de caja y subcaja sigue dependiendo del efecto neto de movimientos;
  - pero los indicadores de negocio ahora se calculan asi:
    - `dineroRecogido` desde `AbonoVendedor` confirmado y no anulado;
    - `totalIngresos` desde abonos vigentes;
    - `totalGastos` desde `Gasto` no anulado;
    - `ingresosAbonos` por subcaja desde abonos vigentes;
    - `egresosGastos` por subcaja desde gastos vigentes.
- impacto:
  - desaparece el dinero fantasma en dashboard e informe de caja;
  - una anulacion puede seguir existiendo en historial y movimientos, pero ya no infla ingresos o gastos reales.
- frontend alineado:
  - `CajaReportView` excluye gastos anulados de sus graficas;
  - `GastoList` y `GastoReportView` excluyen anulados de totales e informes operativos;
  - el resumen impreso de `Abonos` excluye abonos anulados.
- verificacion:
  - backend compila;
  - frontend compila.

## Avance 2026-03-30 - Purga total para pruebas finales

- se ejecuto una purga completa de datos operativos de desarrollo para reiniciar pruebas finales;
- se vaciaron las tablas de negocio:
  - rifas;
  - vendedores;
  - relaciones;
  - boletas;
  - premios;
  - clientes;
  - ventas;
  - abonos;
  - gastos;
  - movimientos de caja;
  - recibos;
  - subcajas;
  - caja;
  - configuracion persistida en base si existiera.
- tambien se reinicio el archivo:
  - `backend/storage/configuracion.json`
  a valores por defecto.
- se dejaron scripts reutilizables en backend:
  - `npm run db:purge:all`
  - `npm run config:reset`
  - `npm run dev:reset:all`
- uso esperado:
  - ejecutar `npm run dev:reset:all` desde `backend/` cuando se necesite reiniciar el sistema completo en entorno de desarrollo.

## Avance 2026-03-30 - Devoluciones fuera de circulacion, premios y reglamento

- asignaciones:
  - la tabla de relaciones ahora muestra primero vendedor, luego rifa;
  - tambien muestra:
    - boletas actuales;
    - total abonado;
    - `precio al vendedor` en lugar de `precio casa`.
- historial:
  - el historial de asignaciones y devoluciones ahora incluye:
    - vendedor;
    - accion;
    - total monetario de la transaccion;
    - boletas afectadas.
- devoluciones:
  - antes de devolver, el admin puede elegir:
    - volver a `DISPONIBLE`;
    - o dejar la boleta como `DEVUELTA / FUERA DE CIRCULACION`.
  - cuando queda fuera de circulacion:
    - se libera del vendedor actual;
    - no vuelve a mostrarse como disponible;
    - conserva referencia textual del vendedor que la devolvio.
- boletas:
  - el panel de boletas ahora permite filtrar por:
    - estado `DEVUELTA`;
    - nombre del vendedor;
    - devoluciones fuera de circulacion.
- premios:
  - se creo el modulo `Premios y boletas que juegan` por rifa;
  - permite:
    - crear premios anticipados y premio mayor;
    - definir nombre, descripcion, valor y fecha;
    - pegar la lista de boletas que juegan en cada premio.
- configuracion:
  - se agrego carga de `reglamento` para dejarlo listo para el futuro panel publico.
- verificacion:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend compila.

## Avance 2026-03-30 - Modulo JUEGO

- se creo el menu `JUEGO` debajo de `BOLETAS`.
- el flujo es independiente de `premios`:
  - trabaja por `rifa`;
  - y registra por `vendedor` cuales boletas si juegan.
- reglas:
  - solo se pueden marcar como jugantes boletas que actualmente pertenezcan al vendedor;
  - si una boleta se devuelve o queda fuera de circulacion, deja de jugar automaticamente.
- opciones operativas:
  - pegar lista de boletas;
  - marcar `jugar todas las boletas`;
  - quitar todo el juego del vendedor.
- salidas:
  - exportacion tipo Excel agrupada por columnas, una por vendedor;
  - impresion administrativa con responsables, fecha de impresion y total de boletas que juegan.

## Ajuste 2026-03-30 - Juego por premio y loteria

- `JUEGO` ya no es generico:
  - ahora exige `rifa + premio + vendedor`.
- las boletas que juegan se registran dirigidas a un premio especifico de la rifa.
- las descargas e impresiones ahora incluyen:
  - loteria de la rifa;
  - nombre del premio;
  - descripcion del premio;
  - fecha y hora de juego del premio.
- `Rifa` ahora guarda `loteriaNombre`.

## Avance 2026-03-31 - Usuarios y autenticacion

- backend:
  - se agrego `auth` con login y perfil actual;
  - se agrego administracion basica de usuarios;
  - todas las rutas administrativas quedaron protegidas por token;
  - se usa hash de contrasena con `scrypt` y firma de token con `crypto` nativo;
  - el sistema crea un admin inicial automaticamente si la base esta vacia.
- frontend:
  - se agrego pantalla `Login`;
  - se implemento sesion persistente;
  - el panel ahora usa guardia de rutas;
  - se agrego pagina `Usuarios`;
  - el sidebar muestra usuario actual y `Cerrar sesion`.
- rutas publicas conservadas:
  - `GET /api/configuracion`
  - `GET /api/recibos/codigo/:codigo`
  - `GET /api/health`
- credenciales bootstrap por defecto en desarrollo:
  - email: `admin@rifas.local`
  - contrasena: `Admin123*`
  - se recomienda cambiarlas por variables de entorno en cuanto se prepare un entorno mas serio.

## Avance 2026-03-31 - Roles y trazabilidad operativa

- `ADMIN` conserva acceso total al panel.
- `CAJERO` ahora solo tiene acceso a modulos operativos:
  - `Abonos`
  - `Asignaciones`
  - `Devoluciones`
  - `Juego`
  - gestion operativa de `Boletas`
- `CAJERO` ya no puede ver:
  - `Dashboard`
  - `Gastos`
  - `Caja`
  - `Configuracion`
  - `Usuarios`
- el modulo de `clientes` aun no existe; cuando se construya, el permiso de `registrar clientes` debera quedar dentro del rol `CAJERO`.
- las siguientes operaciones ya guardan el usuario autenticado que las realizo:
  - abonos
  - gastos
  - asignaciones
  - devoluciones
  - juego
- esa trazabilidad ya se muestra en:
  - tablas de historial
  - recibos
  - filtros por trabajador en modulos operativos relevantes

## Avance 2026-03-31 - Configuracion pagina web

- se agrego una nueva pantalla administrativa:
  - `Configuracion pagina web`
- esta pantalla reutiliza el mismo endpoint de configuracion del sistema y permite dejar preparado el futuro panel publico.
- ya soporta:
  - titulo y subtitulo de portada
  - CTA principal y secundario
  - imagen principal del hero
  - texto `quienes somos`
  - telefonos, WhatsApp, email y direccion publica
  - redes sociales
  - texto de soporte
  - texto de terminos y condiciones
  - fondo de la ficha publica de boleta
  - galeria de imagenes para carrusel del premio
- la ruta queda protegida para `ADMIN`.
- backend y frontend compilan correctamente despues del ajuste.

## Ajuste 2026-03-31 - Fotos del premio vs galeria institucional

- la galeria del carrusel del premio ya no se maneja desde `Configuracion pagina web`.
- ahora cada `Premio` dentro de la rifa puede cargar sus propias fotos con:
  - titulo corto;
  - descripcion;
  - imagen.
- `Configuracion pagina web` queda enfocada en fotos institucionales de la casa rifera:
  - entrega de premios;
  - ubicacion;
  - imagenes de confianza o respaldo;
  - fondo de ficha publica de boleta.

## Avance 2026-03-31 - Base operativa del canal web

- ya existe preparacion administrativa por rifa para el futuro modulo publico.
- desde `Caja`, el admin puede ejecutar `Preparar canal web`, lo que asegura:
  - vendedor especial `PAGINA WEB`;
  - relacion `RifaVendedor` para la rifa seleccionada con comision `0`;
  - subcaja `WOMPI WEB` en la caja principal de la rifa.
- el resumen de `Caja` ahora muestra:
  - estado del vendedor web;
  - estado de la subcaja web;
  - boletas actualmente asignadas al canal;
  - total abonado del canal web.
- esto deja lista la base operativa para:
  - home publico;
  - detalle de rifa;
  - seleccion publica de boletas;
  - flujo posterior con Wompi.

## Avance 2026-03-31 - Home publico y detalle publico de rifa

- se agregaron rutas publicas iniciales:
  - `/publico`
  - `/publico/rifas/:id`
- el panel publico reutiliza:
  - logo de configuracion;
  - nombre de la casa rifera;
  - colores principales del sistema;
  - textos y contenidos de `Configuracion pagina web`.
- el home publico ahora muestra:
  - hero institucional;
  - rifa activa destacada;
  - navegacion basica;
  - galeria institucional;
  - reglamento;
  - contacto publico.
- el detalle publico de rifa ahora muestra:
  - datos de la rifa;
  - loteria;
  - precio;
  - fecha de cierre;
  - carrusel de fotos del premio;
  - cronograma de premios;
  - bloque de soporte;
  - CTA listo para conectar el futuro selector de boletas.
- backend ajustado:
  - `GET /api/rifas/:id` ahora incluye en cada premio:
    - `imagenesJson`
    - `mostrarValor`
    - `valor`
- esto deja listo el siguiente punto del plan:
  - seleccion publica de boletas desde el vendedor especial `PAGINA WEB`.
