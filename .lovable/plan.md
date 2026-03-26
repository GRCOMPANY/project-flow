

# Plan: Landing Page de Producto + Ruta /producto/:id

## Resumen
Crear una pagina completa de detalle de producto publica (landing page de conversion) en `/producto/:id`, y modificar `/tienda` y `/catalogo` para que el click navegue a esa ruta en lugar de abrir drawer/modal.

## Archivos

| Archivo | Accion |
|---------|--------|
| `src/pages/ProductoDetalle.tsx` | **Crear** — Landing page completa con 7 secciones |
| `src/App.tsx` | **Editar** — Agregar ruta publica `/producto/:id` |
| `src/pages/TiendaPublica.tsx` | **Editar** — Click navega a `/producto/:id` en lugar de abrir drawer |
| `src/pages/CatalogoPublico.tsx` | **Editar** — Click navega a `/producto/:id` en lugar de abrir modal |

## Detalle

### 1. `src/App.tsx`
Agregar:
```tsx
import ProductoDetalle from "./pages/ProductoDetalle";
// En Routes, ruta publica:
<Route path="/producto/:id" element={<ProductoDetalle />} />
```

### 2. `src/pages/TiendaPublica.tsx`
- Agregar `import { useNavigate } from "react-router-dom"`
- `handleSelectProduct` cambia de abrir drawer a `navigate(\`/producto/${p.id}\`)`
- Eliminar el drawer completo (lineas 454-578) y el estado `activeDrawerImage`
- Mantener todo lo demas intacto (cards, grid, hero, footer, floating WA)

### 3. `src/pages/CatalogoPublico.tsx`
- Mismo cambio: click en producto navega a `/producto/${p.id}` en lugar de abrir modal
- Eliminar el modal y estado `activeModalImage`

### 4. `src/pages/ProductoDetalle.tsx` — Landing page completa

**Datos**: Query directa a `products_seller_view` por `id` (misma vista publica, sin login).

**Estructura de secciones**:

```text
[Top Bar roja - promo]
[Header sticky - logo + boton WA]

SECCION 1 — HERO
  Desktop: 2 columnas
  Izq: Galeria (imagen principal + miniaturas)
  Der: Badge "Mas vendido" + Nombre (text-4xl) + Precio (text-5xl, #C1272D)
       + Reviews (estaticas) + Beneficios checkmarks
       + Selector cantidad + CTA rojo "COMPRAR AHORA"
       + CTA verde "Comprar por WhatsApp"
       + Badges confianza (envio, garantia, pago)

SECCION 2 — EL PROBLEMA
  Titulo: "¿Buscas una solucion practica?"
  Texto generico emocional (aplicable a cualquier producto)

SECCION 3 — LA SOLUCION
  Titulo + 3 beneficios con iconos

SECCION 4 — COMPARACION
  Tabla 2 columnas: Metodo tradicional vs Producto GRC

SECCION 5 — GALERIA / DEMO
  Grid con imagenes del producto (reutiliza images[])
  Placeholders si no hay suficientes

SECCION 6 — TESTIMONIOS
  3 cards con resenas ficticias (nombres colombianos, estrellas)

SECCION 7 — CTA FINAL
  Fondo #C1272D, precio grande, urgencia, botones compra

[Footer]
[Floating WhatsApp]
[Sticky CTA mobile - bottom bar con boton comprar]
```

**Componentes inline** (dentro del mismo archivo para simplicidad):
- `ProductGallery` — imagen hero + miniaturas clickeables
- `BenefitsList` — checkmarks verdes
- `ComparisonTable` — tabla 2 columnas
- `TestimonialCard` — card con estrellas y texto
- `FinalCTA` — seccion roja final

**Responsive**:
- Mobile: secciones stacked, botones full-width, sticky CTA bottom bar
- Desktop: hero 2 columnas, grid galeria 2-3 cols

**Datos que se muestran**: solo `name`, `retail_price`, `image_url`, `images`, `description`, `category`, `is_featured`. Sin costos, sin margenes.

**WhatsApp**: reutiliza constante `GRC_WHATSAPP = "573226421110"` con mensaje prellenado incluyendo nombre y cantidad.

## Lo que NO cambia
- Queries de Supabase (misma vista `products_seller_view`)
- Logica de precios
- Pagina interna `ProductDetail.tsx` (admin)
- Diseno de cards en grid de tienda/catalogo (solo cambia el destino del click)
- Footer, floating WA, hero de tienda/catalogo

