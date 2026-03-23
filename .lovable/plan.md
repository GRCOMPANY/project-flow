

# Plan: Rediseno Visual Premium de TiendaPublica.tsx

Solo se modifica `src/pages/TiendaPublica.tsx`. Ninguna logica de datos, queries, hooks ni variables cambia.

## Cambios

### 1. Top Bar (nueva)
Barra fina sticky encima del header, 32px altura, fondo #C1272D, texto blanco centrado:
"🚚 Envio gratis a todo Colombia — Pago contra entrega disponible"
El header pasa a `top: 32px` sticky.

### 2. Product Cards — rediseno completo
- Imagen: 300px altura (antes 280px)
- Sombra: `shadow-md hover:shadow-lg`
- Hover: `hover:scale-[1.02]` en toda la card (mas sutil que antes)
- Descripcion: primeros 60 chars del campo `description`, texto gris pequeno debajo del nombre
- Stock: texto verde `"✓ Disponible · Entrega hoy en Bogota"` (antes era rojo)
- Dos botones:
  - Primario rojo #C1272D "Comprar ahora" → abre drawer
  - Secundario verde #16a34a "Comprar por WhatsApp" → abre wa.me
- Badges sin cambios funcionales, solo ajustes de estilo

### 3. Drawer lateral (reemplaza modal)
- Slide-in desde la derecha (nuevo keyframe `slideInRight`)
- Desktop: 480px ancho, fixed derecha
- Mobile: fullscreen
- Overlay oscuro, click afuera cierra
- Contenido igual al modal actual pero reorganizado:
  - Imagen ancho completo
  - Nombre bold, precio rojo grande
  - Descripcion completa
  - Checkmarks de beneficios
  - Selector cantidad
  - Boton verde grande "Comprar por WhatsApp"
  - Texto "Te responderemos en menos de 1 hora"

### 4. Hero mejorado
- Titulo: `text-3xl sm:text-5xl` (antes text-2xl/4xl)
- Subtexto adicional: "Mas de 100 clientes satisfechos en Colombia"
- Badges como pills mas visibles con fondo blanco/20 y padding mayor
- Dos botones: primario rojo solido + secundario outline blanco

### 5. CSS Keyframes
- Agregar `slideInRight` para drawer
- Agregar `slideOutRight` para cierre
- Mantener fadeSlideUp, bounceSubtle, shimmer existentes
- `prefers-reduced-motion` para todos

### 6. Grid responsive
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (antes 2/3)

## Lo que NO cambia
- Query a supabase, interface, estados, helpers (formatPrice, getQty, setQty, openWhatsApp, openGenericWA)
- Logica de gridItems con banner
- Footer, floating WhatsApp, guarantee section (solo ajustes minimos de estilo)

