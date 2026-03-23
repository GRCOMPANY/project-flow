

# Plan: Rediseno Completo CatalogoPublico.tsx para Conversion Mayorista

Reescritura completa del archivo `src/pages/CatalogoPublico.tsx` manteniendo la misma query de datos y sin tocar otros archivos.

## Cambios en un solo archivo: `src/pages/CatalogoPublico.tsx`

### Estado nuevo
- `search` (string) — busqueda por nombre
- `category` (string) — filtro por categoria, default "Todos"
- `quantities` (Record<string, number>) — cantidad por producto, default 1

### Estructura de la pagina

**1. Header** — fondo `#111111`, sticky
- Logo placeholder: cuadrado rojo con "GRC" en blanco
- Titulo: "Catalogo Mayorista GRC" en blanco, bold
- Subtitulo: "Gana dinero vendiendo productos que la gente ya quiere comprar"
- Badge verde animado (pulse): "● Disponible ahora"
- Boton rojo `#C1272D`: "Hablar con George →" enlaza a wa.me/573226421110

**2. Barra de confianza** — fondo blanco, 3 columnas centradas
- "📦 Sin inventario · solo bajo pedido"
- "🚚 Entrega en Bogota mismo dia"
- "💰 Ganancias desde $15.000 por unidad"

**3. Busqueda + Filtros de categoria**
- Input de busqueda con icono
- Pills horizontales scrollables: Todos, Electronica, Hogar, Accesorios, Tecnologia, Otro
- Pill activa en `#C1272D` con texto blanco

**4. Grid de productos** — `grid-cols-2 lg:grid-cols-3`, gap-4
- Imagen: `h-[260px] object-cover`
- Badge categoria arriba izquierda (gris oscuro)
- Badge "🔥 Popular" arriba derecha (rojo)
- Nombre bold, `line-clamp-2`
- "Tu precio" grande rojo `#C1272D`
- Precio publico tachado gris (`line-through`)
- Box verde oscuro `bg-green-900 text-green-100`: "💰 Ganas $X por unidad"
- Texto gris pequeno: "📦 Disponible bajo pedido"
- "✅ Te enviamos creativos listos para vender"
- Selector cantidad: botones [-] [n] [+], min 1, max 50
- Boton verde WhatsApp full width: "Pedir [X] unidades por WhatsApp"
  - Mensaje: "Hola GRC, quiero pedir [X] unidades de [nombre]. Mi precio total: $[X * wholesale_price]"

**5. Banner intermedio** — insertado despues del 3er producto en el grid
- Fondo `#C1272D`, texto blanco, centrado
- "⚡ Trabajamos bajo pedido — tu vendes primero, nosotros conseguimos"
- Ocupa las columnas completas del grid (`col-span-full`)

**6. Footer** — fondo `#111111`
- "GRC Importaciones · Bogota, Colombia"
- "📲 +57 322 642 1110"
- "Somos tu proveedor, tu eres el vendedor"
- Boton WhatsApp verde

### Lo que NO cambia
- Query a `products_seller_view` con filtro `status = 'activo'`
- Interface `CatalogProduct`
- Constante `GRC_WHATSAPP`
- Ningun otro archivo del proyecto

### Detalle tecnico
- Filtrado por categoria: compara `p.category?.toLowerCase()` contra la pill seleccionada
- Cantidades: objeto `{ [productId]: number }`, incremento/decremento con Math.min/max
- Banner intermedio: al renderizar el array filtrado, insertar el banner JSX cuando el indice es 3
- Animacion del badge verde: clase `animate-pulse` de Tailwind

