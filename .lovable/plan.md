

# Plan: Catalogo Mayorista Publico

## Concepto
Pagina publica sin autenticacion en `/catalogo` que muestra productos activos con precios de mayoreo, precio sugerido y ganancia estimada. Usa la vista `products_seller_view` que ya existe sin RLS.

## Archivos a crear/modificar

### 1. Crear `src/pages/CatalogoPublico.tsx`
- Pagina standalone sin nav del sistema interno
- Header con logo/nombre "GRC Importaciones" y estilo de marca (#C1272D)
- Consulta directa a `products_seller_view` filtrando `status = 'activo'`
- Grid responsive de cards de producto mostrando:
  - Imagen (o placeholder Package icon)
  - Nombre
  - "Tu precio": `wholesale_price`
  - "Precio publico": `retail_price`
  - "Ganancia estimada": `retail_price - wholesale_price`
  - Boton "Quiero este producto" que abre `https://wa.me/NUMERO?text=Hola GRC, quiero pedir: [nombre]`
- Barra de busqueda simple por nombre
- NO muestra: costo real, margenes %, ventas, nada interno

### 2. Modificar `src/App.tsx`
- Agregar ruta publica (sin ProtectedRoute): `<Route path="/catalogo" element={<CatalogoPublico />} />`

## Datos
- Usa `products_seller_view` (vista sin RLS, accesible con anon key)
- Solo filtra `status = 'activo'`
- No requiere autenticacion

## Numero de WhatsApp
- Hardcodear numero de GRC o usar un prop/constante configurable en el componente

## Sin cambios en
- Sistema interno, dashboard, rutas protegidas, logica de productos existente

