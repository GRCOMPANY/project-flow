

# Plan: Mejoras Completas en CatalogoPublico.tsx

Solo se modifica `src/pages/CatalogoPublico.tsx`. Ningun otro archivo.

## Cambios

### 1. Precio publico sin line-through
- Quitar `line-through` de la linea del precio publico
- Cambiar label a "Precio sugerido al cliente" en texto negro normal

### 2. Logo real
- Agregar constante `LOGO_URL = "https://i.imgur.com/placeholder.png"`
- Reemplazar el div placeholder por `<img src={LOGO_URL} alt="GRC" className="h-12 object-contain" />`

### 3. Ventas reales — LIMITACION
La vista `products_seller_view` no tiene campo de ventas. La tabla `sales` tiene RLS y no es accesible sin autenticacion. Hay dos opciones:
- **Opcion A**: Omitir ventas reales por ahora y mostrar el badge "Popular" como esta (sin numero)
- **Opcion B**: Crear una migracion adicional (nuevo archivo SQL) con una vista publica que agregue ventas por producto — pero esto toca otro archivo

**Recomendacion**: Ir con Opcion A por ahora (no tocar otros archivos como pides). El campo se puede agregar despues con una migracion.

### 4. Efectos wow — CSS puro en style tag dentro del componente

**Cards:**
- Animacion entrada: `opacity-0` inicial + IntersectionObserver o CSS `@keyframes` con `animation-delay` escalonado via `style={{ animationDelay: index * 0.1s }}`
- Hover: `hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(193,39,45,0.15)]` con `transition-all duration-300`
- Badge "Popular" con `animate-pulse`

**Header:**
- Badge verde ya tiene `animate-pulse` — mantener
- Boton "Hablar con George": shimmer via CSS `@keyframes shimmer` con pseudo-elemento `::after` gradiente que se desplaza

**Boton WhatsApp:**
- CSS `@keyframes bounce-subtle` cada 3s
- Click ripple: estado local + span absoluto con animacion scale desde el punto de click

Todas las animaciones se definen en un `<style>` JSX al inicio del return.

### 5. Modal de producto
- Nuevo estado: `selectedProduct: CatalogProduct | null`
- Al hacer clic en imagen o nombre: `setSelectedProduct(p)`
- Renderizar modal con `Dialog` de radix (ya existe en el proyecto) o un div manual con overlay
- Usare un div manual para evitar dependencias:
  - Overlay: `fixed inset-0 z-50 bg-black/60` con `onClick` para cerrar
  - Panel: `bg-white max-w-lg mx-auto` con scroll, en movil `inset-0` (fullscreen)
  - Contenido: imagen grande, nombre, descripcion completa, precios, ganancia, cantidad, boton WhatsApp
  - Boton X arriba derecha
- Animacion entrada: fade-in + scale-in

### 6. Banner urgencia mejorado
- Agregar subtitulo "📲 ¿Dudas? Escribenos ahora"
- Agregar boton blanco pequeno "Escribir →" que abre WhatsApp
- Animacion subtle pulse al fondo via CSS

## Estructura del archivo resultante

```text
Constantes (GRC_WHATSAPP, LOGO_URL, CATEGORIES)
Interface CatalogProduct
Component CatalogoPublico:
  States: search, category, quantities, selectedProduct
  Query: igual que ahora
  Helpers: formatPrice, profit, getQty, setQty, openWhatsApp
  Return:
    <style> (keyframes: shimmer, bounce-subtle, ripple, fade-slide-up)
    Header (con logo img + shimmer button)
    Trust bar
    Filters
    Product grid (con animaciones escalonadas + click para modal)
    Banner mejorado (con boton WA)
    Footer
    Modal overlay (condicional sobre selectedProduct)
```

