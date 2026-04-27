# Plan Base Para Sistema Administrativo De Almacen De Ropa

## Objetivo

Convertir la base heredada en un sistema administrativo cerrado, sin página web pública, enfocado en operación interna del almacén.

## Lo que ya se limpió

- Se retiró la lógica activa de rifas, boletas, premios, vendedores por rifa, cierres comerciales y canal público.
- Se redujo el frontend a una base administrativa mínima.
- Se redujo el backend a autenticación, salud y configuración base.
- Se dejó el proyecto listo para reconstruir el dominio correcto.

## Fase 1: Modelo de datos nuevo

Crear o rediseñar en Prisma estas entidades:

- `CategoriaProducto`
- `Producto`
- `CodigoBarrasProducto`
- `MovimientoInventario`
- `Cliente`
- `Venta`
- `VentaItem`
- `PagoVenta`
- `Gasto`
- `Caja`
- `MovimientoCaja`
- `CierreCaja`
- `RetiroCajaMayor`
- `Separado`
- `SeparadoAbono`
- `Credito`
- `CreditoPago`
- `SalidaProducto`
- `SalidaProductoItem`

## Fase 2: Inventario

Implementar:

- CRUD de categorías.
- CRUD de productos.
- Stock actual por producto.
- Kardex o historial de movimientos.
- Generación de código de barras por producto.
- Búsqueda por nombre, código y categoría.

## Fase 3: Ventas

Implementar:

- Crear venta.
- Agregar productos por búsqueda o lector de código de barras.
- Tirilla de venta.
- Descontar inventario al confirmar.
- Registrar método de pago.
- Calcular utilidad por ítem y por venta.

## Fase 4: Caja

Implementar:

- Caja diaria.
- Caja mayor.
- Movimientos de ingreso y egreso.
- Cierre de caja diario.
- Retiros a caja mayor o salida del negocio.

## Fase 5: Clientes

Campos mínimos:

- Nombre completo.
- Cédula.
- Teléfono celular.
- Correo electrónico opcional.

Funciones:

- Búsqueda dinámica por nombre o cédula.
- Historial de compras.
- Historial de separados.
- Historial de créditos.

## Fase 6: Separados

Implementar:

- Crear separado.
- Registrar abonos.
- Fecha límite.
- Entrega del producto solo cuando quede pagado.
- Cancelación o vencimiento.

## Fase 7: Créditos

Implementar:

- Crear crédito.
- Entrega inmediata del producto.
- Registro de cuotas.
- Saldo pendiente.
- Estado del crédito.

## Fase 8: Salidas no vendidas

Implementar:

- Salida por préstamo.
- Salida por intercambio.
- Salida por consignación a otra persona o almacén.
- Registro de responsable.
- Registro de devolución, venta final o trueque.

## Fase 9: Informes

Implementar:

- Ventas por fecha.
- Gastos por fecha.
- Utilidad por producto.
- Productos con bajo stock.
- Estado de caja.
- Separados pendientes.
- Créditos pendientes.
- Productos prestados o por devolver.

## Orden recomendado de ejecución

1. Prisma nuevo.
2. Inventario y categorías.
3. Ventas y tirilla.
4. Caja y gastos.
5. Clientes.
6. Separados.
7. Créditos.
8. Salidas no vendidas.
9. Informes.

## Criterio técnico

No seguir adaptando el dominio de rifas. La arquitectura base sí sirve, pero el negocio debe rehacerse con entidades propias del almacén.
