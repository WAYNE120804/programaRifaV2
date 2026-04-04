# Contexto Codex

## Fecha de inicio de contexto

- 2026-03-26

## Fuente funcional principal

- Documento analizado: `C:/Users/jhons/Downloads/Especificacion Sistema Rifas Codex.docx`

## Hallazgos iniciales

- El schema Prisma ya contempla gran parte del sistema objetivo:
  - usuarios y roles;
  - rifas;
  - premios y premios anticipados;
  - boletas y relacion `BoletaPremio`;
  - vendedores y `RifaVendedor`;
  - asignaciones y devoluciones;
  - clientes, ventas y pagos;
  - caja, subcaja, movimientos y gastos;
  - abonos a vendedor y recibos.
- El documento funcional de premios anticipados esta alineado con el schema en:
  - entidad `Premio`;
  - enum `TipoPremio`;
  - relacion `BoletaPremio`;
  - exportaciones por vendedor y por premio.
- El backend activo aun es legacy:
  - usa `Sequelize`;
  - tiene modelos y controladores antiguos;
  - no refleja el schema Prisma como fuente real de datos.
- El frontend ya tiene una base navegable y varias pantallas operativas, pero estan pensadas para el backend legacy actual.

## Riesgos detectados

- Riesgo alto de inconsistencia entre nombres/campos del backend legacy y Prisma.
- Riesgo alto de romper frontend si se reemplazan endpoints sin capa de compatibilidad.
- Riesgo medio de reglas de negocio incompletas en ventas, pagos y auditoria si se construye por tablas y no por flujos.

## Decisiones de trabajo

- Prisma sera la fuente de verdad de datos.
- No se deben extender modelos Sequelize existentes.
- Se reconstruira el backend desde cero sobre Prisma porque el sistema actual no tiene datos que preservar.
- El proyecto completo se construira en TypeScript.
- El frontend se mantendra en React y tambien migrara a TypeScript.
- Cada modulo backend debe salir con su consumo frontend en la misma fase.
- Cada fase debe dejar pruebas manuales ejecutables.
- Este archivo debe registrar decisiones, avances, riesgos y pendientes despues de cada fase.

## Plan macro aprobado para ejecutar

### Fase 0

- base tecnica de backend Prisma;
- estructura modular;
- utilidades comunes;
- documentacion viva.

### Fase 1

- rifas;
- vendedores;
- vinculacion rifa-vendedor.

### Fase 2

- boletas;
- asignaciones;
- devoluciones.

### Fase 3

- clientes;
- ventas;
- pagos de cliente.

### Fase 4

- caja;
- subcajas;
- movimientos;
- abonos vendedor;
- recibos.

### Fase 5

- gastos;
- conciliacion operativa.

### Fase 6

- premios;
- premios anticipados;
- participacion de boletas.

### Fase 7

- reportes;
- exportaciones Excel;
- endurecimiento final.

## Pendientes inmediatos

- eliminar la base backend legacy de Sequelize sin tocar el frontend reutilizable;
- revisar si el schema Prisma requiere pequeños ajustes tecnicos antes de generar el cliente;
- decidir el primer modulo de ejecucion: recomendable iniciar por rifas + vendedores.

## Avance 2026-03-26 - Fase 0 base

- Se elimino la estructura legacy de `Sequelize` del backend.
- Se creo nueva base backend con:
  - `src/app.js`;
  - `src/index.js`;
  - `src/config/env.js`;
  - `src/lib/prisma.js`;
  - `src/routes/index.js`;
  - modulo inicial `health`;
  - middlewares de error, not found y serializacion.
- Se actualizo `backend/package.json` para usar scripts y dependencias del backend nuevo.
- Se simplifico Prisma a una configuracion estable con cliente binario y `DATABASE_URL` en schema.
- Se verifico correctamente `GET /api/health`.

## Nuevos pendientes

- iniciar Fase 1 con modulo `rifas`;
- migrar la base nueva de backend a TypeScript;
- migrar el frontend React a TypeScript;
- definir DTOs/validaciones base para modulos;
- decidir convencion final de nombres de endpoints para no romper el frontend al integrarlo.

## Avance 2026-03-26 - Hardening previo a fases

- Se decidio usar TypeScript en backend y frontend.
- Backend:
  - Prisma ajustado a `6.12.0`;
  - `npm audit` en cero;
  - conexion Prisma verificada con consulta `SELECT 1`.
- Frontend:
  - actualizados `axios`, `react-router-dom`, `vite` y `@vitejs/plugin-react`;
  - `npm audit` en cero;
  - `npm run build` exitoso.

## Avance 2026-03-26 - Migracion inicial a TypeScript

- Backend migrado a TypeScript:
  - `src/` convertido a `.ts`;
  - `tsconfig.json` creado;
  - scripts `dev`, `build`, `typecheck` ajustados;
  - salida compilada en `dist/`;
  - verificacion de arranque realizada contra `dist/app.js`.
- Frontend migrado a TypeScript:
  - `src/` convertido a `.ts` y `.tsx`;
  - `vite.config.ts` y `tsconfig.json` creados;
  - `vite-env.d.ts` agregado;
  - `npm run typecheck` exitoso;
  - `npm run build` exitoso.

## Estado para Fase 1

- La base tecnica ya permite iniciar implementacion funcional sobre TypeScript en backend y frontend.
- El siguiente modulo recomendado sigue siendo `rifas`.

## Avance 2026-03-26 - Fase 1 modulo Rifas

- Backend:
  - creado modulo `rifas` con `routes`, `controller`, `service` y `schemas`;
  - endpoints activos:
    - `GET /api/rifas`
    - `GET /api/rifas/:id`
    - `POST /api/rifas`
    - `PUT /api/rifas/:id`
    - `DELETE /api/rifas/:id`
  - validaciones basicas de payload:
    - nombre obligatorio;
    - fechas validas;
    - `fechaFin >= fechaInicio`;
    - `precioBoleta > 0`;
    - estado dentro de `EstadoRifa`.
  - al crear una rifa se crea automaticamente `Caja principal`.
- Frontend:
  - actualizadas `RifaList`, `RifaForm` y `RifaDetail`;
  - frontend de rifas ya consume el contrato nuevo (`fechaInicio`, `fechaFin`, `precioBoleta`, `estado`);
  - `VITE_API_URL` por defecto ajustado a `http://localhost:3002/api`.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real ejecutada:
    - crear rifa;
    - listar rifas;
    - consultar detalle;
    - confirmar creacion automatica de caja.

## Siguiente paso recomendado

- continuar Fase 1 con modulo `vendedores`;
- luego implementar `RifaVendedor` para cerrar la vinculacion entre ambos en paralelo con frontend.

## Avance 2026-03-26 - Fase 1 modulo Vendedores

- Backend:
  - creado modulo `vendedores` con `routes`, `controller`, `service` y `schemas`;
  - endpoints activos:
    - `GET /api/vendedores`
    - `GET /api/vendedores/:id`
    - `POST /api/vendedores`
    - `PUT /api/vendedores/:id`
    - `DELETE /api/vendedores/:id`
  - validaciones basicas:
    - nombre obligatorio;
    - telefono, documento y direccion opcionales;
    - bloqueo de eliminacion si el vendedor ya tiene rifas o movimientos asociados.
- Frontend:
  - actualizadas `VendedorList`, `VendedorForm` y `VendedorDetail`;
  - CRUD basico completo con eliminar y confirmacion;
  - detalle muestra resumen y rifas asociadas si existen.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real ejecutada:
    - crear vendedor;
    - listar vendedores;
    - consultar detalle.

## Siguiente paso recomendado actualizado

- continuar Fase 1 con modulo `RifaVendedor`;
- desde ahi cerrar la vinculacion `rifa <-> vendedor` y preparar asignaciones.

## Avance 2026-03-28 - Fase 1 modulo RifaVendedor

- Backend:
  - creado modulo `rifa-vendedores` con `routes`, `controller`, `service` y `schemas`;
  - endpoints activos:
    - `GET /api/rifa-vendedores`
    - `GET /api/rifa-vendedores/:id`
    - `POST /api/rifa-vendedores`
    - `DELETE /api/rifa-vendedores/:id`
  - agregada restriccion unica `@@unique([rifaId, vendedorId])` en schema Prisma;
  - validaciones basicas:
    - rifa y vendedor obligatorios;
    - comision valida entre 0 y 100;
    - precio casa valido;
    - bloqueo de duplicados por pareja `rifa-vendedor`;
    - bloqueo de eliminacion si ya hay boletas, asignaciones, devoluciones o abonos asociados.
- Frontend:
  - la pantalla `Asignaciones` ahora gestiona la relacion real `rifa-vendedor`;
  - `HistorialAsignaciones` muestra las relaciones actuales;
  - `RifaDetail` ya lista vendedores asociados;
  - `VendedorDetail` ya refleja rifas asociadas desde el backend nuevo.
- Verificacion:
  - `prisma db push --accept-data-loss` aplicado tras verificar que no habia duplicados;
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real ejecutada:
    - crear rifa;
    - crear vendedor;
    - crear relacion `RifaVendedor`;
    - listar relaciones;
    - consultar detalle.

## Siguiente paso recomendado actualizado

- continuar con el slice de `boletas`;
- despues cerrar `asignaciones` ya sobre boletas reales.

## Ajuste 2026-03-28 - UX de RifaVendedor

- Backend:
  - agregado `PUT /api/rifa-vendedores/:id` para editar `comisionPct` y `precioCasa`;
  - mantenido filtro por query `rifaId` y `vendedorId` en `GET /api/rifa-vendedores`.
- Frontend:
  - `Asignaciones` ahora incluye buscador dinamico por rifa y por vendedor usando `SearchableSelect`;
  - la tabla de relaciones puede verse filtrada por rifa;
  - desde `RifaDetail` existe acceso directo a `Ver asignaciones` con `rifaId` preseleccionado;
  - se agrego edicion de relacion para ajustar comision y precio casa.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real ejecutada:
    - crear relacion;
    - editar comision/precio casa;
    - filtrar relaciones por `rifaId`.

## Regla de negocio confirmada 2026-03-28

- `precioCasa` en `RifaVendedor` no es editable por el usuario.
- El sistema siempre lo calcula automaticamente con la formula:
  - `precioCasa = precioBoleta - (precioBoleta * comisionPct / 100)`
- Esto aplica tanto al crear como al editar una relacion `RifaVendedor`.
- El frontend lo muestra como campo calculado de solo lectura.
- El backend ignora cualquier intento del cliente de fijar manualmente `precioCasa`.

## Avance 2026-03-28 - Inicio bloque Boletas desde Rifas

- Se agrego `numeroCifras` a `Rifa` en Prisma con valor por defecto `4`.
- El formulario de rifas ahora obliga a elegir `2`, `3` o `4` cifras.
- Al crear una rifa el backend genera automaticamente todas las boletas de la rifa:
  - `2 cifras`: 100 boletas de `00` a `99`;
  - `3 cifras`: 1000 boletas de `000` a `999`;
  - `4 cifras`: 10000 boletas de `0000` a `9999`.
- Cada boleta se crea con:
  - `numero` con padding a la izquierda;
  - `precio` igual al `precioBoleta` de la rifa;
  - `estado` por defecto `DISPONIBLE`.
- Si la rifa ya tiene boletas generadas, no se permite cambiar `numeroCifras` en edicion.
- Verificacion ejecutada:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real:
    - crear rifa de `2` cifras;
    - respuesta API con `100` boletas;
    - verificacion directa en base con `100` boletas;
    - limpieza de la rifa temporal de prueba.

## Avance 2026-03-28 - Modulo explicito de Boletas

- Backend:
  - creado modulo `boletas` con `routes`, `controller`, `service` y `schemas`;
  - endpoints activos:
    - `GET /api/boletas`
    - `GET /api/boletas/:id`
    - `PUT /api/boletas/:id`
  - filtros soportados en listado:
    - `rifaId`
    - `rifaVendedorId`
    - `estado`
    - `numero`
  - regla aplicada al editar:
    - si la boleta pasa a `DISPONIBLE`, se limpia `rifaVendedorId`;
    - si pasa a `ASIGNADA`, debe existir `rifaVendedorId`;
    - una boleta solo puede asignarse a una relacion `RifaVendedor` de la misma rifa.
- Frontend:
  - creada pantalla `Boletas` accesible desde el menu lateral;
  - la vista trabaja por rifa y permite:
    - seleccionar rifa;
    - filtrar por vendedor;
    - filtrar por estado;
    - buscar numero en tiempo real;
    - ver boletas en cuadricula;
    - abrir modal de edicion por boleta.
  - `RifaDetail` ahora tiene acceso directo a `Ver boletas`.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real:
    - crear rifa de prueba con `2` cifras;
    - crear vendedor y vincularlo;
    - listar `100` boletas por API;
    - editar una boleta puntual a estado `ASIGNADA`;
    - verificar vendedor asociado en la respuesta;
    - limpiar datos temporales de prueba.

## Avance 2026-03-28 - Asignacion real de boletas

- Backend:
  - se agregaron endpoints en `rifa-vendedores`:
    - `GET /api/rifa-vendedores/:id/asignaciones`
    - `POST /api/rifa-vendedores/:id/asignaciones`
  - metodos soportados:
    - `ALEATORIA` con `cantidad`
    - `RANGO` con `numeroDesde` y `numeroHasta`
    - `LISTA` con `listaNumeros`
  - la asignacion:
    - solo toma boletas `DISPONIBLE`;
    - valida que pertenezcan a la rifa de la relacion;
    - marca boletas como `ASIGNADA`;
    - vincula `rifaVendedorId`;
    - crea `AsignacionBoletas` y `AsignacionDetalle`;
    - incrementa `saldoActual` del vendedor segun `precioCasa * cantidad`.
- Parsing de lista pegada:
  - se aceptan entradas mezcladas como:
    - `01` en lineas separadas;
    - `01 02 45 69`;
    - `01, 02, 78`;
    - valores separados por guiones, comas, espacios o punto y coma.
  - internamente se extraen secuencias numericas y se normalizan al padding de la rifa.
- Frontend:
  - `Asignaciones` ahora permite:
    - seleccionar relacion `rifa-vendedor`;
    - asignar por cantidad aleatoria;
    - asignar por rango;
    - pegar lista libre de numeros;
    - ver historial inmediato de asignaciones de la relacion seleccionada.
  - `HistorialAsignaciones` fue actualizado para mostrar historial real por relacion.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real:
    - aleatoria: `08,54,64`
    - rango: `10,11,12`
    - lista pegada: `20,21,22,23,24,25`
    - historial devuelto por API: `3` asignaciones.

## Ajuste 2026-03-28 - Conflicto parcial en asignaciones

- Cuando una asignacion por `RANGO` o `LISTA` incluye boletas ya no disponibles:
  - backend responde conflicto estructurado `PARTIAL_ASSIGNMENT_CONFLICT`;
  - el payload incluye:
    - boletas bloqueadas;
    - estado actual;
    - `vendedorNombre` si la boleta pertenece a un `RifaVendedor`;
    - lista de boletas que si siguen disponibles.
- Frontend:
  - `Asignaciones` ya no deja ese caso solo en `ErrorBanner`;
  - ahora abre un modal con:
    - tabla de boletas bloqueadas;
    - vendedor actual cuando aplica;
    - opcion `Asignar disponibles`;
    - opcion `Cancelar asignacion`.

## Avance 2026-03-28 - Devoluciones

- Backend:
  - se agregaron endpoints:
    - `GET /api/rifa-vendedores/:id/devoluciones`
    - `POST /api/rifa-vendedores/:id/devoluciones`
  - metodos soportados:
    - `LISTA`
    - `TODAS`
  - la devolucion:
    - solo toma boletas `ASIGNADA` de esa misma relacion `rifa-vendedor`;
    - cambia estado a `DISPONIBLE`;
    - limpia `rifaVendedorId`;
    - crea `DevolucionBoletas` y `DevolucionDetalle`;
    - descuenta `saldoActual` segun `precioCasa * cantidad`.
- Frontend:
  - `Asignaciones` ahora incluye una seccion `Devolver boletas`;
  - permite:
    - pegar lista de boletas devueltas;
    - devolver todas las boletas del vendedor;
    - ver historial inmediato de devoluciones.
- Verificacion:
  - backend compila;
  - frontend pasa `typecheck` y `build`;
  - prueba end-to-end real:
    - asignadas `01,02,03,04,05,06`
    - devolucion por lista: `02,04`
    - devolucion total restante: `01,03,05,06`
    - historial devuelto por API: `2` devoluciones.

## Ajuste 2026-03-28 - Conflicto parcial en devoluciones

- Backend:
  - cuando una devolucion por `LISTA` mezcla boletas validas con otras que no pertenecen a la relacion actual, ahora responde conflicto estructurado `PARTIAL_RETURN_CONFLICT`;
  - el payload incluye:
    - boletas no retornables;
    - `estado`;
    - `vendedorNombre` cuando la boleta pertenece a otra relacion;
    - `availableNumbers` con las boletas que si se pueden devolver.
- Frontend:
  - `Asignaciones` ya no deja este caso solo como error generico;
  - ahora abre un modal que muestra:
    - boletas que si se pueden desasignar de ese vendedor;
    - boletas que no se pueden devolver;
    - detalle practico indicando si pertenecen a otro vendedor o si ya estan disponibles;
    - opcion `Devolver las que si pertenecen`;
    - opcion `Cancelar devolucion`.
- Objetivo de UX confirmado:
  - ejemplo esperado:
    - si se pega `97` y `02`, y `97` si pertenece al vendedor actual pero `02` no;
    - el modal debe dejar claro que `97` si se puede desasignar;
    - `02` no se puede desasignar desde esa relacion y se informa su estado y propietario actual si existe.

## Avance 2026-03-30 - Configuracion e impresion de boletas

- Backend:
  - agregado modulo `configuracion` con endpoints:
    - `GET /api/configuracion`
    - `PUT /api/configuracion`
  - finalmente `Configuracion` quedo persistida en `backend/storage/configuracion.json` para evitar bloqueo recurrente de Prisma en Windows en este modulo de metadatos.
  - se extendieron respuestas de `boletas` y `rifa-vendedores` para incluir en vendedor:
    - `telefono`
    - `direccion`
- Frontend:
  - se creo pantalla `Configuracion` accesible desde el menu lateral;
  - permite:
    - editar nombre de la casa rifera;
    - subir logo de la empresa;
    - quitar logo;
    - registrar datos del responsable;
    - registrar entidad autorizadora y resolucion;
    - administrar colores base del panel;
    - ver vista previa.
  - el sidebar ahora usa logo y nombre configurados.
  - `Devoluciones` se separo de `Asignaciones` y ahora tiene pantalla propia en el menu lateral.
- Impresion de boletas:
  - se creo utilidad `printBoletaSheet` con impresion via `iframe` para evitar bloqueo de popups;
  - la planilla:
    - muestra `CASA RIFERA - NOMBRE DE RIFA` en el encabezado;
    - toma datos del vendedor desde `RifaVendedor`;
    - muestra responsable, entidad autorizadora y resolucion;
    - resalta por color vendedor, responsable y total de boletas;
    - elimina columna lateral de orden;
    - ordena boletas por columnas `0` a `9`;
    - pagina automaticamente en bloques de 35 filas;
    - muestra `Pagina X/Y`;
    - agrega pie con fecha/hora de impresion y resumen pequeno de asignaciones por fecha.
  - se agrego accion `Imprimir planilla` en:
    - `Boletas`, usando la relacion filtrada actual;
    - historial general de `Asignaciones`;
    - historial inmediato dentro de `Asignaciones`.
- Nota operativa:
  - Prisma ahora genera fuera de `node_modules` hacia `backend/generated/prisma-client`;
  - backend actualizado para importar Prisma desde `src/lib/prisma-client.ts`;
  - consulta real verificada correctamente contra PostgreSQL con el cliente generado nuevo.

## Avance 2026-03-30 - Abonos administrativos y recibos verificables

- Cambio de prioridad:
  - se decide adelantar `abonos + recibos` antes de `clientes + ventas`;
  - la motivacion es dejar primero listo el panel administrativo real.
- Prisma:
  - `AbonoVendedor` se amplio con:
    - `descripcion`
    - `saldoAnterior`
    - `saldoDespues`
    - `boletasActuales`
  - `prisma generate` correcto;
  - `prisma db push` correcto sobre PostgreSQL local.
- Backend:
  - se creo modulo `abonos` con:
    - parser de payload;
    - servicio de listado por `RifaVendedor`;
    - creacion de abono con transaccion;
    - actualizacion de `saldoActual`;
    - generacion de `Recibo` con `consecutivo` y `codigoUnico`.
  - se creo modulo `recibos` con:
    - `GET /api/recibos/:id`
    - `GET /api/recibos/codigo/:codigo`
  - reglas de negocio activas:
    - el abono debe ser mayor a 0;
    - no puede superar la deuda actual;
    - si la deuda es 0 no se permite registrar abono;
    - el recibo queda ligado al snapshot del abono y no al saldo actual posterior.
- Frontend:
  - `Abonos/CrearAbono` fue rehecho totalmente contra los contratos nuevos;
  - `Abonos/HistorialAbonos` ya no usa el modelo legacy y ahora trabaja por relacion `rifa-vendedor`;
  - `ReciboView` fue rehecho para mostrar detalle administrativo completo;
  - se agrego `ReciboPublicView` en:
    - `/verificacion/abonos/:codigo`
  - `ReceiptTicket` ahora genera QR real con la libreria `qrcode`.
- Dependencias:
  - se instalo `qrcode` en frontend para soportar QR escaneable real.
- Recibo actual:
  - logo de empresa;
  - nombre de la casa rifera;
  - rifa;
  - vendedor;
  - fecha;
  - consecutivo;
  - codigo unico;
  - valor abonado;
  - deuda anterior;
  - deuda restante;
  - boletas actuales;
  - descripcion;
  - QR hacia verificacion publica.
- Ajuste 2026-03-30 - ergonomia de abonos y recibos:
  - `codigoUnico` ya no es aleatorio largo;
  - ahora se genera como:
    - `segmentoRifa-ultimos4Documento-consecutivo-valor`
  - el objetivo es facilitar lectura manual y soporte operativo.
  - `HistorialAbonos` agrega buscador local por:
    - `codigoUnico`
    - `consecutivo`
    siempre dentro de la relacion `rifa-vendedor` seleccionada.
  - el boton `Registrar abono` se movio junto al filtro principal.
  - la impresion del recibo ya no imprime toda la pagina:
    - usa documento aislado en `iframe`;
    - layout de tirilla angosta;
    - selector previo para `1` o `2` copias.
- Riesgos/puntos pendientes:
  - el recibo ya es imprimible, pero aun no se integro a movimientos de caja;
  - la verificacion publica existe dentro del mismo frontend actual, luego se podra mover a futura pagina publica;
  - `Dashboard` y otros modulos antiguos todavia tienen restos de contratos legacy que conviene ir limpiando al avanzar fase por fase.

## Avance 2026-03-30 - Gastos administrativos

- Prisma:
  - se agrego el modelo `GastoRecibo` ligado uno a uno con `Gasto`;
  - cada gasto ahora puede dejar:
    - `consecutivo`
    - `codigoUnico`
    - `fecha` del recibo.
- Backend:
  - se creo modulo `gastos` con:
    - `GET /api/gastos`
    - `GET /api/gastos/:id`
    - `POST /api/gastos`
  - se creo modulo `gasto-recibos` con:
    - `GET /api/gasto-recibos/:id`
    - `GET /api/gasto-recibos/codigo/:codigo`
  - reglas aplicadas:
    - un gasto requiere rifa;
    - `valor > 0`;
    - la fecha toma el dia seleccionado y la hora real del sistema;
    - cada gasto genera su recibo verificable inmediatamente.
  - `codigoUnico` de gasto usa formato legible:
    - `GST-segmentoRifa-consecutivo-valor`
- Frontend:
  - `GastoForm` fue rehecho con selector de rifa y registro directo de fecha, valor y descripcion;
  - `GastoList` fue rehecho con:
    - filtro por rifa;
    - filtro por categoria;
    - buscador por descripcion;
    - buscador por `codigoUnico`;
    - buscador por `consecutivo`;
    - tarjetas resumen;
    - acceso a `Ver recibo`.
  - se creo `GastoReciboView` con estilo administrativo + tirilla;
  - la impresion de gasto usa documento aislado y permite `1` o `2` copias, igual que en abonos.
- Ajuste 2026-03-30 - categorias y ergonomia de gastos:
  - `Gasto` ahora guarda `categoria` real en base de datos;
  - categorias iniciales:
    - `SUELDOS`
    - `PUBLICIDAD`
    - `ARRIENDO`
    - `SERVICIOS_PUBLICOS`
    - `GASOLINA_TRANSPORTE`
    - `IMPRESION_PAPELERIA`
    - `PREMIOS_LOGISTICA`
    - `MANTENIMIENTO`
    - `COMISIONES_BANCARIAS`
    - `OTROS`
  - esto cubre casos operativos como impresion de boletas y volantes dentro de `IMPRESION_PAPELERIA`;
  - `GastoList` ahora:
    - pone `REGISTRAR GASTO` al lado del filtro principal;
    - agrega `IMPRIMIR INFORME`;
    - mueve la barra de busqueda debajo de los cuadros resumen y encima de la tabla;
    - muestra columna de categoria;
    - permite filtrar y buscar tambien por categoria.
  - se creo impresion de informe carta para gastos:
    - ya no depende de busqueda o categoria activa;
    - usa todos los gastos de la rifa seleccionada;
    - agrupa por categoria;
    - agrega resumen visual tipo barras por categoria;
    - muestra tablas por categoria con fecha, hora, rifa, descripcion, codigo y valor;
    - cierra con tabla final de totales por categoria y total general.
  - se agrego `GastoReportView`:
    - ruta `/gastos/informe?rifaId=...`;
    - muestra el informe en pantalla;
    - desde ahi tambien se puede imprimir el mismo informe carta.
- Verificacion:
  - `prisma generate` correcto;
  - `prisma db push` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`.

## Pendiente siguiente recomendado

- si se mantiene la prioridad administrativa, el siguiente bloque natural es `caja`:
  - movimientos;
  - ingresos por abonos;
  - egresos por gastos;
  - saldos y trazabilidad.

## Avance 2026-03-30 - Caja subfase 4.1 y 4.2

- Prisma:
  - `AbonoVendedor` ahora puede referenciar `subCaja`;
  - `Gasto` ahora puede referenciar `subCaja`;
  - `SubCaja` ahora relaciona:
    - `abonos`
    - `gastos`
    - `movimientos`
  - se agrego restriccion unica `@@unique([cajaId, nombre])` para evitar subcajas duplicadas dentro de la misma caja.
- Backend:
  - se creo modulo `cajas` con:
    - `GET /api/cajas`
    - `GET /api/cajas/:id`
    - `GET /api/cajas/resumen?rifaId=...`
  - se creo soporte de `subcajas` con:
    - `GET /api/subcajas?rifaId=...`
    - `POST /api/subcajas`
    - `DELETE /api/subcajas/:id`
  - `createAbono` ahora:
    - valida que la subcaja pertenezca a la rifa;
    - guarda `subCajaId`;
    - incrementa caja general y subcaja;
    - crea `MovimientoCaja` de tipo `INGRESO`.
  - `createGasto` ahora puede:
    - validar subcaja por rifa;
    - guardar `subCajaId`;
    - descontar caja general y subcaja;
    - crear `MovimientoCaja` de tipo `EGRESO`.
  - `getCajaResumenByRifa` ya devuelve:
    - caja general;
    - subcajas con saldo, abonos y gastos;
    - metricas de recaudo;
    - resumen por vendedor;
    - movimientos recientes.
- Logica de negocio:
  - `dineroARecoger` por vendedor:
    - `totalBoletasActuales * precioCasa`
  - `dineroRecogido`:
    - suma de abonos confirmados
  - `dineroFaltante`:
    - `dineroARecoger - dineroRecogido`
  - estado de cuenta:
    - `AL_DIA`
    - `PENDIENTE`
    - `SALDO_A_FAVOR`
- Frontend:
  - `CrearAbono` ahora obliga `subcaja destino`;
  - `HistorialAbonos` ya muestra columna `SUBCAJA`;
  - `GastoForm` ahora permite `subcaja origen`;
  - `CajaDashboard` fue rehecho para mostrar por rifa:
    - dinero a recoger;
    - dinero recogido;
    - faltante por recoger;
    - saldo de caja general;
    - creacion y eliminacion de subcajas;
    - tarjetas por subcaja;
    - tabla de vendedores con estado de recaudo.
  - `MovimientosCaja` fue rehecho para mostrar ingresos y egresos recientes por rifa.
- Verificacion:
  - `prisma generate` correcto;
  - `prisma db push --accept-data-loss` correcto;
  - backend compila;
  - frontend pasa `typecheck` y `build`.

## Pendiente siguiente recomendado actualizado

- caja subfase 4.3 y 4.4:
  - informe carta de caja;
  - resumen integrado de ingresos y egresos;
  - consolidado por vendedor con colores;
  - comparativo final de utilidad/saldo de la rifa.

## Avance 2026-03-30 - Caja subfase 4.3 y 4.4

- Frontend:
  - se creo `CajaReportView` en ruta:
    - `/caja/informe?rifaId=...`
  - `CajaDashboard` ahora expone `VER INFORME`;
  - el informe de caja se puede ver en pantalla y tambien imprimir.
- Impresion:
  - se agrego `printCajaLetterReport` en `print.ts`;
  - el informe carta incluye:
    - encabezado administrativo;
    - resumen financiero;
    - subcajas;
    - gastos por categoria;
    - tabla de vendedores con estado de recaudo;
    - colores por estado (`AL_DIA`, `PENDIENTE`, `SALDO_A_FAVOR`).
- Logica visual:
  - `AL_DIA` en verde;
  - `PENDIENTE` en rojo;
  - `SALDO_A_FAVOR` en tono intermedio.
- Verificacion:
  - frontend pasa `typecheck` y `build`.

## Siguiente paso recomendado actualizado

- cerrar el bloque administrativo de caja con refinamientos operativos:
  - filtros extra en informe de caja;
  - exportacion o impresion tabular mas formal;
  - luego retomar `clientes` y `ventas`.

## Ajuste 2026-03-30 - Anulacion de abonos y gastos

- Decision funcional:
  - en movimientos financieros es mejor `anular` que `editar`;
  - la razon es conservar auditoria y permitir reversion consistente de caja.
- Prisma:
  - `AbonoVendedor` agrega:
    - `anuladoAt`
    - `anuladoMotivo`
  - `Gasto` agrega:
    - `anuladoAt`
    - `anuladoMotivo`
- Backend:
  - `anularAbono`:
    - valida que no este anulado;
    - revierte `saldoActual` del vendedor;
    - descuenta caja general y subcaja;
    - crea movimiento compensatorio tipo `EGRESO`;
    - marca el abono como `RECHAZADO` con motivo.
  - `anularGasto`:
    - valida que no este anulado;
    - devuelve dinero a caja general y subcaja;
    - crea movimiento compensatorio tipo `INGRESO`;
    - registra fecha y motivo de anulacion.
- Frontend:
  - `ReciboView` y `GastoReciboView` ya exponen anulacion con modal y motivo obligatorio.
  - `HistorialAbonos` y `GastoList` dejan visible la accion `ANULAR` desde los listados via recibo.

## Ajuste 2026-03-30 - COP y criterio visual de deuda

- `MoneyInput` ahora agrega separadores de miles para COP mientras el usuario escribe.
- Esto reduce errores operativos al registrar abonos y gastos.
- `CajaDashboard`, `CajaReportView` y `printCajaLetterReport` ahora comparten la misma semantica visual:
  - fila completa roja para vendedores con deuda;
  - fila completa verde para vendedores al dia;
  - fila completa ambar para saldo a favor.

## Estado posterior a este ajuste

- Prisma sincronizado.
- Backend compila.
- Frontend compila.

## Ajuste 2026-03-30 - Correccion de reportes de caja tras anulaciones

- causa raiz identificada:
  - la anulacion por reverso ya existia, pero `caja.service.ts` calculaba:
    - ingresos = suma de movimientos `INGRESO`
    - gastos = suma de movimientos `EGRESO`
  - eso metia reversos dentro de indicadores operativos y producia dinero fantasma visible en el dashboard.
- correccion aplicada:
  - `getCajaResumenByRifa` ya no usa movimientos brutos para calcular negocio;
  - ahora usa:
    - `AbonoVendedor` con `estado = CONFIRMADO` y `anuladoAt = null`;
    - `Gasto` con `anuladoAt = null`.
- regla resultante:
  - libro contable:
    - sigue conservando movimientos y contramovimientos;
  - indicadores de negocio:
    - solo usan operaciones vigentes no anuladas.
- zonas corregidas:
  - resumen por vendedor;
  - ingresos y gastos por subcaja;
  - total de ingresos;
  - total de gastos;
  - informe de caja en pantalla;
  - informe de caja impreso;
  - informe de gastos;
  - resumen impreso de abonos.

## Avance 2026-03-30 - Reset total de desarrollo

- se realizo purga completa del sistema para iniciar pruebas finales desde cero.
- estrategia aplicada:
  - truncado completo de tablas operativas via `backend/prisma/purge-all.sql`;
  - reset de configuracion persistida via `backend/scripts/reset-config.cjs`.
- scripts nuevos:
  - `npm run db:purge:all`
  - `npm run config:reset`
  - `npm run dev:reset:all`
- objetivo:
  - permitir limpiar todo el sistema de forma repetible sin tocar schema ni codigo.

## Avance 2026-03-30 - Devoluciones fuera de circulacion, premios y reglamento

- `Boleta` agrega:
  - `devueltaPorVendedorNombre`
  - `devueltaObservacion`
- `DevolucionBoletas` agrega:
  - `destino`
    - `DISPONIBLE`
    - `FUERA_CIRCULACION`
- criterio operativo:
  - una devolucion puede:
    - regresar a disponibles;
    - o sacar la boleta de circulacion manteniendola en estado `DEVUELTA`.
- backend:
  - `listBoletas` ahora soporta filtro por `vendedorNombre`;
  - ese filtro busca tanto en vendedor asignado como en devolucion historica;
  - `listRifaVendedores` y `getRifaVendedorById` agregan `totalAbonado`;
  - asignaciones y devoluciones exponen `accion` y `totalTransaccion`;
  - se creo modulo `premios` con CRUD y asignacion de boletas que juegan por premio.
- frontend:
  - `Asignaciones` reorganiza columnas y renombra `precio casa` a `precio al vendedor`;
  - `HistorialAsignaciones` y `DevolucionesPage` muestran vendedor, accion y total;
  - `Boletas` permite buscar por vendedor/devolucion y ver boletas devueltas fuera de circulacion;
  - se creo `RifaPremiosPage` en ruta:
    - `/rifas/:id/premios`
  - `Configuracion` ahora permite adjuntar reglamento para el panel publico futuro.
- estado:
  - schema sincronizado;
  - backend compila;
  - frontend compila.

## Avance 2026-03-30 - Modulo JUEGO

- `Boleta` agrega:
  - `juega Boolean @default(false)`
- se crea backend `juego`:
  - `GET /api/juego`
  - `PUT /api/juego/rifa-vendedores/:id`
- comportamiento:
  - `LISTA`: reemplaza el juego del vendedor con la lista pegada;
  - `TODAS`: marca como jugantes todas las boletas actuales del vendedor;
  - `NINGUNA`: limpia el juego del vendedor.
- validacion critica:
  - no permite marcar boletas que no pertenezcan actualmente al vendedor o no esten en estado jugable.
- integracion:
  - al devolver o liberar una boleta, `juega` vuelve a `false`.
- frontend:
  - nueva pantalla `/juego`;
  - exportacion `.xls` agrupada por vendedor;
  - impresion carta del juego por columnas;
  - usa filtros activos; si no hay filtro por vendedor, toma todo el juego de la rifa.

## Ajuste 2026-03-30 - Juego por premio y loteria

- `JUEGO` deja de ser una marca global de boleta y pasa a operar sobre `Premio` + `BoletaPremio`.
- backend:
  - `GET /api/juego` ahora exige:
    - `rifaId`
    - `premioId`
  - `PUT /api/juego/rifa-vendedores/:id` ahora exige `premioId` en body.
- validacion:
  - solo se pueden cargar al premio boletas que actualmente pertenezcan al vendedor y esten jugables.
- integracion:
  - al devolver/liberar/cambiar vendedor de una boleta, se limpian sus relaciones `BoletaPremio`.
- `Rifa` agrega:
  - `loteriaNombre`
- reportes de juego:
  - incluyen loteria;
  - nombre del premio;
  - descripcion;
  - fecha/hora de juego.

## Plan funcional-tecnico 2026-03-31 - Modulo pagina publica y seguridad

### Objetivo general

- construir la experiencia publica de la casa rifera y de las rifas activas;
- permitir compra web de boletas sin romper la logica administrativa actual;
- dejar preparado el flujo real para integracion posterior con Wompi;
- proteger el panel administrativo con autenticacion, roles y endurecimiento basico de seguridad.

### Decisiones funcionales aprobadas

- la venta publica no trabajara sobre boletas libres del sistema de forma directa;
- se crea una entidad operativa especial tipo vendedor llamada:
  - `PAGINA WEB`
- solo las boletas asignadas al vendedor `PAGINA WEB` seran visibles como comprables en la pagina publica;
- si el admin quiere vender boletas devueltas por web:
  - primero las deja `DISPONIBLE`;
  - luego las asigna a `PAGINA WEB`;
- si el admin no reactiva una boleta devuelta:
  - se mantiene `DEVUELTA` y amarrada al historial operativo;
- la venta web tendra su propia subcaja operativa:
  - `WOMPI WEB`
- si una boleta queda pagada en su totalidad:
  - queda elegible para `JUEGO`;
  - el control final del premio se mantiene desde el modulo administrativo.

### Requisitos funcionales del panel publico

#### Home publico

- mostrar identidad de la casa rifera;
- barra superior de navegacion:
  - `Rifas`
  - `Quienes somos`
  - `Reglamento`
  - `Verificar`
  - `Contacto`
- hero principal con rifa activa o rifas destacadas;
- acceso a rifas activas;
- informacion de confianza:
  - responsable;
  - entidad autorizadora;
  - resolucion;
  - reglamento.

#### Detalle publico de rifa

- hero con foto principal del premio;
- carrusel de imagenes del premio;
- nombre de la rifa;
- loteria con la que juega;
- fecha del premio mayor;
- lista de premios anticipados y premio mayor;
- descripcion comercial clara;
- reglamento visible o descargable;
- boton fijo de accion:
  - `Comprar boletas`

#### Selector publico de boletas

- mostrar solo boletas del vendedor `PAGINA WEB`;
- navegacion por rangos:
  - `0000 - 0999`, etc.;
- buscador por numero;
- seleccion multiple;
- resumen de seleccion fijo;
- estados claros por boleta:
  - disponible;
  - reservada;
  - pagada;
  - no disponible.

#### Checkout publico

- datos minimos obligatorios del cliente:
  - nombre;
  - telefono;
  - cedula;
- email opcional;
- resumen de boletas seleccionadas;
- total a pagar;
- aceptacion de terminos;
- boton visual de pago preparado para Wompi.

#### Verificacion publica

- consulta por telefono como criterio principal;
- opcionalmente por cedula o codigo de compra;
- debe mostrar:
  - boletas compradas o reservadas;
  - estado del pago;
  - datos basicos de la rifa;
  - informacion suficiente para soporte al cliente.

#### Verificacion publica por boleta y QR

- cada boleta debe tener un QR unico;
- al escanearlo debe abrir una ficha publica de la boleta;
- esa ficha debe mostrar:
  - nombre de la casa rifera;
  - imagen/fondo de boleta cargado por admin;
  - numero de boleta;
  - nombre de la rifa;
  - loteria;
  - premio al que juega;
  - estado:
    - `DISPONIBLE`
    - `RESERVADA`
    - `PAGADA`
    - `JUGANDO`
    - `DEVUELTA`
    - `FUERA DE CIRCULACION`
  - datos del comprador si existen;
  - si no existen datos:
    - mostrar `Disponible` o `Sin datos`.

### Consistencia visual

- el panel publico debe reutilizar el sistema de colores y direccion visual del panel administrativo;
- el admin debe poder configurar colores base desde un modulo dedicado;
- se debe mantener coherencia entre:
  - panel admin;
  - home publica;
  - detalle de rifa;
  - selector de boletas;
  - ficha publica de boleta;
  - CTA y mensajes de estado.

### Nuevo modulo administrativo requerido

#### Configuracion pagina web

- se agregara un nuevo menu dentro del panel administrativo:
  - `Configuracion pagina web`
- este modulo debe permitir administrar:
  - logo publico;
  - portada/hero;
  - imagenes del carrusel del premio;
  - imagen/fondo de ficha publica de boleta;
  - texto `Quienes somos`;
  - texto de contacto;
  - direccion publica;
  - telefonos publicos;
  - redes sociales;
  - reglamento publico;
  - textos de terminos y condiciones;
  - textos promocionales de la rifa activa;
  - configuracion de CTA y botones;
  - datos visibles de soporte al comprador.

### Seguridad y endurecimiento del panel administrativo

#### Objetivos

- evitar que el panel administrativo quede publico;
- exigir autenticacion para toda ruta administrativa;
- manejar usuarios, sesiones y roles;
- endurecer backend frente a malas entradas, abuso e intentos basicos de ataque;
- reducir el riesgo de SQL injection y exposicion accidental de informacion.

#### Usuarios y acceso

- crear modulo `usuarios` y `auth`;
- login administrativo obligatorio;
- rutas administrativas protegidas;
- roles iniciales recomendados:
  - `SUPERADMIN`
  - `ADMIN`
  - `CAJERO`
  - `OPERADOR`
- permisos posteriores por modulo si se requiere.

#### Seguridad tecnica minima

- `Prisma` ya reduce fuertemente el riesgo de SQL injection al trabajar con consultas parametrizadas;
- aun asi se debe endurecer:
  - validacion estricta de payloads;
  - sanitizacion de query params y filtros;
  - rate limiting para auth y rutas publicas sensibles;
  - headers de seguridad;
  - CORS controlado;
  - manejo de archivos subidos;
  - tokens o sesiones seguras;
  - hashing de contrasenas;
  - expiracion de sesion;
  - logs de acceso y errores.

#### Reglas de seguridad funcional

- no exponer rutas admin en modo anonimo;
- no exponer datos financieros en la pagina publica;
- no exponer datos completos del cliente salvo en verificacion controlada;
- el QR de boleta debe usar token publico seguro, no ids internos;
- las operaciones criticas deben registrar usuario responsable.

### Modelo operativo recomendado para ventas web

#### Canal de venta

- `PAGINA WEB` sera un `Vendedor` real del sistema;
- tendra relacion `RifaVendedor` como cualquier otro vendedor;
- el admin podra:
  - asignarle boletas aleatorias;
  - asignarle boletas especificas;
  - moverle boletas desde devoluciones activadas;
  - retirarle boletas para pasarlas a otro vendedor.

#### Cliente

- datos minimos:
  - `nombre`
  - `telefono`
  - `cedula`
- opcional:
  - `email`
- el telefono sera la llave operativa principal para verificacion publica.

#### Reserva y venta web

- se recomienda crear entidad `ReservaWeb` o `VentaWeb`;
- estados recomendados:
  - `CREADA`
  - `RESERVADA`
  - `PENDIENTE_PAGO`
  - `PAGADA`
  - `EXPIRADA`
  - `CANCELADA`
- la venta web debe quedar ligada a:
  - cliente;
  - rifa;
  - vendedor `PAGINA WEB`;
  - boletas;
  - subcaja `WOMPI WEB`.

#### Pago Wompi

- aunque aun no haya credenciales, desde ya debe prepararse:
  - `paymentProvider = WOMPI`
  - `externalTransactionId`
  - `externalReference`
  - `paymentStatus`
  - endpoint de webhook;
  - flujo de confirmacion.

### Integracion con juego

- boleta pagada totalmente:
  - queda elegible para juego;
- la participacion efectiva debe seguir respetando:
  - `rifa`
  - `premio`
  - control administrativo del modulo `JUEGO`.

### Integracion con caja y subcajas

- la venta web impactara `Caja general`;
- la subcaja por defecto sera:
  - `WOMPI WEB`
- ingresos web confirmados deben alimentar:
  - dashboard de caja;
  - informe de caja;
  - estado de recaudo por canal;
  - conciliacion posterior con Wompi.

### Entidades nuevas o ampliadas a contemplar

- `Usuario`
- `Sesion` o token de acceso
- `Cliente`
- `ReservaWeb` o `VentaWeb`
- `VentaWebBoleta`
- `PagoWeb`
- `BoletaQrToken`
- `ConfiguracionPaginaWeb`
- posible galeria multimedia para rifas y premios.

### Rutas publicas recomendadas

- `/`
  - home de la casa rifera;
- `/rifas`
  - listado de rifas activas;
- `/rifas/:slug`
  - detalle publico de rifa;
- `/rifas/:slug/boletas`
  - selector visual de boletas;
- `/checkout/:reservaId`
  - resumen y pago;
- `/verificar`
  - verificacion por telefono;
- `/boletas/:token`
  - ficha publica por QR de boleta.

### APIs nuevas recomendadas

- `GET /api/public/configuracion-web`
- `GET /api/public/rifas`
- `GET /api/public/rifas/:id`
- `GET /api/public/rifas/:id/boletas`
- `POST /api/public/reservas`
- `POST /api/public/reservas/:id/pago-intent`
- `POST /api/public/wompi/webhook`
- `GET /api/public/verificacion?telefono=...`
- `GET /api/public/boletas/:token`

### Fases de ejecucion recomendadas

#### Fase publica 0 - Base operativa

- crear vendedor especial `PAGINA WEB`;
- crear subcaja `WOMPI WEB`;
- definir estados operativos de reserva/venta web;
- definir reglas de stock web;
- definir reglas de paso a juego;
- definir token QR de boleta;
- crear modulo de usuarios/autenticacion base para cerrar admin.

#### Fase publica 1 - Branding y estructura

- layout publico;
- navbar;
- home de casa rifera;
- detalle de rifa;
- premios;
- loteria;
- reglamento;
- carrusel de imagenes;
- configuracion pagina web.

#### Fase publica 2 - Stock y seleccion de boletas

- cuadrilla visual por rangos;
- filtros y buscador;
- seleccion multiple;
- estados visuales;
- resumen flotante de seleccion;
- trabajar solo sobre boletas del vendedor `PAGINA WEB`.

#### Fase publica 3 - Cliente y reserva

- formulario de datos del comprador;
- creacion de cliente;
- reserva temporal de boletas;
- expiracion de reserva;
- confirmacion visual.

#### Fase publica 4 - Preparacion de pago Wompi

- flujo UI listo para Wompi;
- almacenamiento de referencia externa;
- subcaja `WOMPI WEB`;
- webhook preparado;
- cambio de estado a `PAGADA` al confirmar.

#### Fase publica 5 - Verificacion y QR

- verificacion por telefono;
- ficha publica de boleta por QR;
- consulta de estado de compra;
- mostrar si la boleta esta disponible, reservada, pagada o jugando.

### Orden de trabajo recomendado a partir de aqui

1. seguridad del panel administrativo:
   - usuarios;
   - autenticacion;
   - proteccion de rutas;
2. `Configuracion pagina web`;
3. `PAGINA WEB` como vendedor especial + `WOMPI WEB` como subcaja;
4. home publico y detalle publico de rifa;
5. seleccion de boletas;
6. reserva/cliente;
7. integracion Wompi;
8. verificacion y QR por boleta.

### Criterio de exito del proximo gran modulo

- el admin puede controlar totalmente la presencia publica desde configuracion;
- la rifa publica hereda estilo y colores del sistema;
- las boletas web salen de un canal controlado;
- el checkout queda listo para Wompi;
- el panel admin deja de ser publico;
- la verificacion publica genera confianza operativa y comercial.

## Avance 2026-03-31 - Punto 1 usuarios, auth y proteccion del panel

- backend:
  - se creo modulo `auth` con:
    - `POST /api/auth/login`
    - `GET /api/auth/me`
  - se creo modulo basico `usuarios` con:
    - `GET /api/usuarios`
    - `POST /api/usuarios`
    - `PATCH /api/usuarios/:id/activo`
  - se implemento autenticacion por token firmado con `crypto` nativo;
  - se implemento hash de contrasenas con `scrypt`;
  - se agrego middleware global de proteccion para todas las rutas administrativas;
  - quedaron publicas solo las rutas necesarias:
    - `GET /api/health`
    - `POST /api/auth/login`
    - `GET /api/configuracion`
    - `GET /api/recibos/codigo/:codigo`
  - si la base no tiene usuarios, el sistema crea automaticamente un admin inicial usando:
    - `BOOTSTRAP_ADMIN_NAME`
    - `BOOTSTRAP_ADMIN_EMAIL`
    - `BOOTSTRAP_ADMIN_PASSWORD`
    o valores por defecto de desarrollo.
- frontend:
  - se creo `AuthProvider` con persistencia de token en `localStorage`;
  - se creo pantalla `Login`;
  - se creo `ProtectedRoute` para cerrar todo el panel administrativo;
  - se integro envio automatico de `Authorization: Bearer ...` en `axios`;
  - al recibir `401`, el frontend limpia sesion y obliga reingreso;
  - se agrego pantalla `Usuarios` para administracion basica de accesos;
  - el menu lateral ahora muestra:
    - usuario actual;
    - rol;
    - boton `Cerrar sesion`;
    - opcion `Usuarios` solo para administradores.
- seguridad base lograda:
  - el panel administrativo ya no queda publico;
  - existe primer corte real de autenticacion y control de acceso;
  - la verificacion publica de recibos no se rompio.

## Ajuste 2026-03-31 - Roles operativos y trazabilidad por usuario

- se confirma criterio de acceso:
  - `ADMIN` entra a todo el panel;
  - `CAJERO` puede operar:
    - `Abonos`
    - `Asignaciones`
    - `Devoluciones`
    - `Juego`
    - edicion operativa de `Boletas`
  - `CAJERO` no debe ver:
    - `Dashboard`
    - `Gastos`
    - `Caja`
    - `Configuracion`
    - `Usuarios`
- el permiso de `registrar clientes` queda reservado para la futura fase de clientes/ventas, porque ese modulo aun no existe.
- toda operacion critica administrativa ahora registra el usuario autenticado que la realizo:
  - `AbonoVendedor`
  - `Gasto`
  - `AsignacionBoletas`
  - `DevolucionBoletas`
  - `JuegoRegistro`
- ese usuario responsable ya se expone en:
  - tablas de historial;
  - recibos;
  - filtros por trabajador en abonos, gastos, asignaciones y devoluciones.
- criterio de auditoria:
  - la operacion debe reflejar quien la ejecuto desde la sesion activa;
  - las anulaciones siguen siendo de control administrativo y no se eliminan del historial.

## Avance 2026-03-31 - Punto 2 configuracion pagina web

- se decide reutilizar el modulo `configuracion` existente como fuente unica de verdad para:
  - configuracion administrativa;
  - configuracion visual del panel;
  - configuracion del futuro panel publico.
- se crea una nueva pantalla administrativa separada:
  - `Configuracion pagina web`
- esta pantalla queda pensada para preparar el modulo publico sin depender aun de Wompi ni de las vistas finales.

### Datos nuevos agregados a configuracion

- portada publica:
  - `publicHeroTitle`
  - `publicHeroSubtitle`
  - `publicHeroImageDataUrl`
  - `publicPrimaryCtaText`
  - `publicSecondaryCtaText`
- contenido institucional:
  - `publicWhoWeAre`
  - `publicSupportText`
  - `publicTermsText`
- contacto publico:
  - `publicContactPhone`
  - `publicContactWhatsapp`
  - `publicContactEmail`
  - `publicAddress`
  - `publicCity`
  - `publicDepartment`
- redes:
  - `publicFacebookUrl`
  - `publicInstagramUrl`
  - `publicTiktokUrl`
- activos visuales:
  - `publicTicketBackgroundDataUrl`
  - `publicPrizeGallery[]`

### Alcance del nuevo modulo

- permite definir textos del home publico;
- permite preparar CTA principales de compra y verificacion;
- permite cargar imagen destacada para hero;
- permite cargar fondo de ficha publica de boleta por QR;
- permite construir galeria/carrusel de premios;
- permite preparar contacto y ubicacion publica;
- deja los textos legales y de soporte listos para el panel publico futuro.

### Integracion administrativa

- se agrega nuevo menu lateral:
  - `Configuracion pagina web`
- la ruta queda protegida solo para `ADMIN`.
- la persistencia sigue siendo:
  - `backend/storage/configuracion.json`

### Estado tecnico

- backend compila;
- frontend compila;
- el siguiente paso natural queda listo para comenzar:
  - `PAGINA WEB` como vendedor especial;
  - `WOMPI WEB` como subcaja;
  - home publico y detalle publico de rifa.

## Ajuste 2026-03-31 - Galerias publicas separadas por responsabilidad

- se corrige la distribucion del contenido visual del panel publico:
  - las fotos del carrusel del premio ya no deben vivir en `Configuracion pagina web`;
  - ahora deben vivir dentro del modulo `Premios` de cada rifa.
- `Premio` agrega:
  - `imagenesJson`
- cada imagen de premio puede guardar:
  - `nombre`
  - `descripcion`
  - `dataUrl`
- objetivo:
  - que cada rifa/premio tenga su propio carrusel visual real y no una galeria global reutilizada por error.
- `Configuracion pagina web` mantiene solo la galeria institucional de la casa rifera:
  - fotos de entrega de premios;
  - ubicacion;
  - confianza comercial;
  - soporte y presencia institucional.
- la galeria institucional tambien admite descripcion por foto.
- estado:
  - schema sincronizado;
  - backend compila;
  - frontend compila.

## Avance 2026-03-31 - Punto 3 base operativa del canal web

- se crea una preparacion idempotente por rifa para dejar listo el futuro canal publico.
- criterio operativo implementado:
  - vendedor especial:
    - `PAGINA WEB`
  - subcaja especial:
    - `WOMPI WEB`
- backend:
  - nuevo endpoint administrativo:
    - `POST /api/cajas/preparar-canal-web`
  - comportamiento:
    - valida que la rifa exista;
    - asegura `Caja principal`;
    - crea el vendedor `PAGINA WEB` si no existe;
    - crea la relacion `RifaVendedor` para esa rifa si no existe;
    - usa `comisionPct = 0`;
    - usa `precioCasa = precioBoleta` de la rifa;
    - crea la subcaja `WOMPI WEB` si no existe en la caja principal.
- `Caja resumen` ahora expone bloque `canalWeb` con:
  - estado del vendedor web;
  - estado de la subcaja web;
  - boletas actuales del canal;
  - total abonado del canal web.
- frontend:
  - `Caja` agrega bloque `Canal web de la rifa`;
  - desde ahi el admin puede preparar el canal web en un clic;
  - el bloque informa si ya existen:
    - vendedor `PAGINA WEB`;
    - subcaja `WOMPI WEB`;
    - boletas actuales asignadas al canal;
    - total abonado del canal.
- objetivo logrado:
  - dejar lista la base operativa del modulo publico sin vender aun boletas por web;
  - evitar creacion manual dispersa de vendedor y subcaja;
  - mantener trazabilidad y reutilizar la logica administrativa existente.

## Avance 2026-03-31 - Punto 4 home publico y detalle de rifa

- se crean rutas publicas iniciales sin romper el panel administrativo actual:
  - `/publico`
  - `/publico/rifas/:id`
- el panel publico reutiliza:
  - logo de `Configuracion`;
  - nombre de la casa rifera;
  - colores principales del panel administrativo;
  - `Configuracion pagina web` como fuente de textos y activos visuales.

### Home publico

- muestra:
  - hero principal;
  - rifa activa destacada;
  - navegacion simple:
    - `Rifas`
    - `Quienes somos`
    - `Reglamento`
    - `Contacto`
  - bloque institucional de confianza;
  - galeria institucional configurada desde `Configuracion pagina web`;
  - datos de contacto publico;
  - CTA principal hacia la rifa activa.

### Detalle publico de rifa

- muestra:
  - foto principal del premio;
  - carrusel de imagenes del premio;
  - datos de la rifa:
    - nombre;
    - loteria;
    - precio;
    - fecha de cierre;
    - numero de cifras;
  - cronograma de premios;
  - descripcion y fecha de cada premio;
  - valor solo si el premio tiene `mostrarValor = true`;
  - bloque de soporte y reglamento;
  - CTA visual preparado para el futuro selector de boletas.

### Backend ajustado para el punto publico

- `Rifa detail` ahora incluye en premios:
  - `imagenesJson`
  - `mostrarValor`
  - `valor`
- esto permite construir el carrusel publico usando directamente las fotos cargadas desde el modulo `Premios`.

### Estado actual del flujo publico

- ya existe:
  - home publico;
  - detalle publico de rifa;
  - identidad visual compartida con admin;
  - bloque legal y de confianza;
  - carrusel visual del premio.
- el siguiente punto natural ya es:
  - selector publico de boletas del canal `PAGINA WEB`.
