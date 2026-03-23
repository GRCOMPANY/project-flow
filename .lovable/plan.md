

# Plan: Crear TiendaPublica.tsx + Ruta /tienda

## Archivos a modificar
1. **Crear** `src/pages/TiendaPublica.tsx` — pagina completa
2. **Editar** `src/App.tsx` — agregar ruta publica `/tienda`

## App.tsx
Agregar import de TiendaPublica y ruta `<Route path="/tienda" element={<TiendaPublica />} />` junto a la ruta de `/catalogo` (publica, sin ProtectedRoute).

## TiendaPublica.tsx — Estructura

Mismo patron de datos que CatalogoPublico: query a `products_seller_view` con `status = 'activo'`. Misma interface `CatalogProduct`. Solo muestra `retail_price`, nunca wholesale_price.

### Estado
- `search`, `category`, `quantities` (max 10 en vez de 50), `selectedProduct`

### Secciones en orden

1. **Header sticky** — fondo #111111, flex between. Izquierda: logo img `/logo-grc.png` h-11 + "GRC Importaciones" + subtitulo gris. Derecha: badge verde pulse "Envios activos" + boton rojo "Comprar por WhatsApp →"

2. **Hero banner** — gradient #1a1a1a → #C1272D. Titulo grande, subtitulo semitransparente, 3 badges blancos (Envio rapido, Contra entrega, Garantia)

3. **Barra confianza** — fondo blanco, 4 columnas con emojis

4. **Busqueda + Pills categoria** — Todos, Hogar, Electronica, Cocina, Accesorios, Tecnologia. Activo en #C1272D

5. **Grid productos** — grid-cols-2 lg:grid-cols-3 gap-5
   - Imagen 280px con hover zoom scale(1.05) overflow-hidden
   - Badge categoria arriba izq (negro semitransparente)
   - Badge "Mas vendido" arriba der (#C1272D, pulse)
   - Nombre bold line-clamp-2
   - Solo retail_price en rojo grande
   - Texto urgencia rojo pequeno
   - Selector cantidad [-][n][+] min 1 max 10
   - Boton verde #25D366 ancho completo: "Comprar [X] por WhatsApp"
   - Mensaje: "Hola GRC! Quiero comprar [X] unidad(es) de [nombre]. ¿Esta disponible?"
   - Animacion entrada escalonada

6. **Banner intermedio** despues del 3er producto — col-span-full, fondo #C1272D, "Eres revendedor?" con link a /catalogo

7. **Seccion garantia** — 3 cards sobre fondo #F8F8F8

8. **Boton flotante WhatsApp** — fixed bottom-6 right-6, circulo verde 60px, bounce cada 4s, tooltip

9. **Footer** — fondo #111111, logo, datos, boton WA, copyright 2026

10. **Modal producto** — overlay negro 70%, panel blanco max-w-[480px], en movil fullscreen bottom sheet con slide-up. Imagen, nombre, precio retail, descripcion, checkmarks confianza, selector cantidad, boton WA verde

### Animaciones
`<style>` tag con keyframes: fadeSlideUp, bounceSubtle, shimmer. Todos con `@media (prefers-reduced-motion: reduce)` para desactivar.

### Diferencias clave vs CatalogoPublico
- Solo retail_price visible, sin wholesale ni ganancia
- Mensaje WA diferente (compra directa, no pedido mayorista)
- Hero banner con gradient (catalogo no lo tiene)
- Seccion garantia adicional
- Banner intermedio enlaza a /catalogo
- Max cantidad 10 (no 50)
- Categorias diferentes: incluye "Cocina"

