

# Plan: Múltiples Imágenes por Producto

## Resumen
Agregar campo `images TEXT[]` a la tabla `products`, actualizar la vista `products_seller_view`, y crear galerías de imágenes en el admin, tienda pública y catálogo mayorista.

---

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| Nueva migración SQL | Crear — agrega columna `images` + actualiza vista |
| `src/types/index.ts` | Editar — agregar `images?: string[]` al tipo `Product` |
| `src/hooks/useProducts.ts` | Editar — mapear `images` en fetch, insert, update |
| `src/components/products/ProductForm.tsx` | Editar — sección "Imágenes adicionales" |
| `src/pages/TiendaPublica.tsx` | Editar — galería en drawer + interface |
| `src/pages/CatalogoPublico.tsx` | Editar — galería en modal + interface |
| `src/pages/ProductDetail.tsx` | Editar — mostrar galería en detalle admin |

---

## Detalle técnico

### 1. Migración SQL

```sql
-- Agregar columna images al tabla products
ALTER TABLE public.products
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Recrear vista para incluir images
DROP VIEW IF EXISTS public.products_seller_view;
CREATE VIEW public.products_seller_view 
WITH (security_invoker = true) AS
SELECT 
  id, name, sku, category, status, 
  wholesale_price, suggested_price as retail_price,
  image_url, images,
  description, is_featured,
  main_channel, delivery_type,
  created_at, updated_at
FROM public.products
WHERE status = 'activo';
```

### 2. Tipo Product (`types/index.ts`)

Agregar `images?: string[]` después de `imageUrl` en la interface `Product`.

### 3. Hook useProducts.ts

- **fetch**: mapear `p.images` → `product.images`
- **insert**: incluir `images: product.images || []`
- **update**: si `updates.images !== undefined`, mapear a `updateData.images`

### 4. ProductForm.tsx — Sección "Imágenes adicionales"

Después del upload de imagen principal actual (línea ~272):

- Nuevo estado: `const [additionalImages, setAdditionalImages] = useState<string[]>([])`
- Inicializar desde `initialData?.images || []`
- UI: grid de miniaturas con botón ❌ cada una
- Botón "Agregar imagen" que permite:
  - Subir archivo (reutiliza `onUploadImage`)
  - O pegar URL manual
- Validaciones: max 6 imágenes, sin duplicados, sin duplicar `imageUrl`
- Al submit: incluir `images: additionalImages` en el objeto

### 5. TiendaPublica.tsx — Galería en drawer

- Agregar `images` a la interface `CatalogProduct` y al select de la query
- En el drawer, reemplazar la imagen única por:
  - Imagen hero (estado `activeImage`, inicia con `image_url`)
  - Fila de miniaturas debajo (solo si hay más de 1 imagen total)
  - Click en miniatura cambia `activeImage` con transición fade
  - Miniatura activa: border rojo `#C1272D`

### 6. CatalogoPublico.tsx — Galería en modal

- Mismo patrón exacto que TiendaPublica:
  - Agregar `images` a interface y query
  - Estado `activeImage` local al modal
  - Imagen principal + miniaturas clickeables
  - Indicador visual de imagen activa

### 7. ProductDetail.tsx

- Mostrar galería de miniaturas debajo de la imagen principal existente

---

## Flujo de datos

```text
Admin crea producto:
  ProductForm → images[] → useProducts.addProduct → Supabase (TEXT[])

Tienda/Catálogo lee producto:
  products_seller_view (incluye images) → query → galería UI

Prioridad de imágenes:
  1. image_url (hero principal)
  2. images[] (adicionales, en orden del array)
```

## Edge cases

- Producto sin `image_url` ni `images`: placeholder
- Producto con `image_url` pero sin `images`: solo imagen principal, sin miniaturas
- Producto con `images` pero sin `image_url`: primera de `images` como hero
- Array vacío `[]` en DB: equivale a sin imágenes adicionales
- Productos existentes: `images` default `'{}'` (array vacío), sin impacto

## Sin cambios en

- Lógica de precios, ventas, márgenes
- Estructura de pedidos, transacciones
- Diseño general existente (solo se agrega galería)

