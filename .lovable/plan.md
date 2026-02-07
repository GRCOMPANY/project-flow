
# Plan: GRC AI OS - Sistema Completo de Creativos, Ventas y Revendedores

## Resumen Ejecutivo

Este plan corrige y mejora los tres módulos principales del sistema para reflejar correctamente la lógica del negocio de e-commerce con modelo de reventa. Se enfoca en:

1. **Creativos como experimentos comerciales** con campos obligatorios y flujo de evaluación
2. **Ventas diferenciadas** entre directas y a revendedores (ya implementado, requiere ajustes)
3. **Revendedores como clientes B2B** sin comisiones (ya implementado correctamente)
4. **Dashboard integrado** que suma ambos tipos de venta

---

## Estado Actual del Sistema

### Ya Implementado Correctamente
| Módulo | Estado |
|--------|--------|
| sale_type obligatorio | Implementado |
| Separación directa vs revendedor | Implementado |
| Revendedores sin comisión | Implementado |
| Dashboard con métricas separadas | Implementado |
| Cálculos de márgenes automáticos | Implementado |
| Financial Freeze (costos congelados) | Implementado |

### Requiere Mejoras
| Módulo | Problema | Prioridad |
|--------|----------|-----------|
| Creativos | Producto no es obligatorio | ALTA |
| Creativos | Falta campo de referencia de publicación | MEDIA |
| Creativos | Estados no reflejan el ciclo real | ALTA |
| Creativos | Aprendizaje no es obligatorio al cerrar | ALTA |
| Creativos | Falta campo CTA | MEDIA |
| Tipo de creativo | Faltan story/reel en UI | BAJA |

---

## Fase 1: Mejoras al Módulo de Creativos

### 1.1 Hacer Producto Obligatorio

**Problema:** Actualmente el producto es opcional ("Sin producto" es una opción válida)

**Solución:**
```typescript
// src/components/creatives/CreativeForm.tsx
// Eliminar opción "Sin producto" del selector
// Agregar validación obligatoria
```

**Cambios en UI:**
- Quitar `<SelectItem value="none">Sin producto</SelectItem>`
- Agregar asterisco rojo (*) al label
- Bloquear submit si no hay producto seleccionado

### 1.2 Actualizar Estados del Creativo

**Problema:** Los estados actuales son confusos:
- `pendiente`, `generando`, `generado`, `publicado`, `descartado`

**Solución:** Cambiar a estados que reflejan el ciclo real:
```typescript
export type CreativeStatus = 
  | 'borrador'      // En preparación
  | 'publicado'     // En circulación activa
  | 'pausado'       // Detenido temporalmente
  | 'cerrado';      // Experimento terminado (requiere learning)
```

**Migración de datos:**
```sql
-- Mapear estados existentes
UPDATE creatives SET status = 
  CASE status
    WHEN 'pendiente' THEN 'borrador'
    WHEN 'generando' THEN 'borrador'
    WHEN 'generado' THEN 'borrador'
    WHEN 'publicado' THEN 'publicado'
    WHEN 'descartado' THEN 'cerrado'
  END;
```

### 1.3 Agregar Campos Faltantes

**Base de datos - Nueva migración:**
```sql
-- Campo para referencia de publicación
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS 
  publication_reference text;

-- Campo para CTA
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS 
  cta_text text;
```

**TypeScript:**
```typescript
interface Creative {
  // ... campos existentes ...
  publicationReference?: string;  // "Historia IG 06/02"
  ctaText?: string;               // "Escríbeme ahora"
}
```

### 1.4 Forzar Aprendizaje al Cerrar

**Lógica:**
- Al cambiar estado a `cerrado`, el campo `learning` se vuelve obligatorio
- Mostrar modal de confirmación con textarea obligatoria
- No permitir cerrar sin documentar aprendizaje

**UI - Nuevo modal:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  🧠 CIERRE DE EXPERIMENTO                                       │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  Antes de cerrar este creativo, documenta lo aprendido:         │
│                                                                  │
│  ¿Qué funcionó? *                                               │
│  [________________________________________________]             │
│                                                                  │
│  ¿Qué no funcionó? *                                            │
│  [________________________________________________]             │
│                                                                  │
│  ¿Qué repetirías? *                                             │
│  [________________________________________________]             │
│                                                                  │
│  [Cancelar]                        [Cerrar experimento]          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Reorganizar Formulario de Creativo

**Estructura propuesta:**

```text
PESTAÑA A: CONTEXTO (ya existe)
├── Producto * (obligatorio)
├── Tipo (imagen/video/story/reel/carrusel/copy)
├── Canal (Instagram/Facebook/TikTok/WhatsApp/Web)
├── Objetivo (vender/atraer/probar)
├── Público objetivo
└── Notas sobre público

PESTAÑA B: MENSAJE (ya existe, agregar CTA)
├── Tipo de hook
├── Texto del hook
├── Enfoque del mensaje
├── Título interno
├── Copy completo
└── CTA (NUEVO) *

PESTAÑA C: MEDIA (NUEVA PESTAÑA)
├── Subir imagen (Supabase Storage)
├── Subir/enlazar video
├── Referencia de publicación (NUEVO)
│   └── "Historia IG 06/02" / "Post FB 07/02"
└── Estado del creativo

PESTAÑA D: MÉTRICAS (ya existe)
├── Likes
├── Comentarios
├── Mensajes recibidos
├── Ventas generadas
├── Personas conocidas
└── Engagement percibido

PESTAÑA E: APRENDIZAJE (ya existe)
└── Campo de texto obligatorio al cerrar
```

---

## Fase 2: Ajustes Menores al Módulo de Ventas

### 2.1 Estado Actual - Ya Correcto
El módulo de ventas ya tiene implementado:
- Campo `sale_type` obligatorio (directa/revendedor)
- Formulario condicional según tipo
- Cálculos automáticos de márgenes
- Dashboard con métricas separadas

### 2.2 Mejoras Menores Sugeridas

**Validaciones adicionales:**
```typescript
// Venta directa: precio final REQUERIDO
if (saleType === 'directa' && !finalPrice) {
  toast({ 
    title: 'Error', 
    description: 'El precio final es obligatorio en ventas directas',
    variant: 'destructive' 
  });
  return;
}

// Venta a revendedor: revendedor REQUERIDO
if (saleType === 'revendedor' && !resellerId) {
  toast({ 
    title: 'Error', 
    description: 'Debes seleccionar un revendedor',
    variant: 'destructive' 
  });
  return;
}
```

**UI - Marcar campos obligatorios visualmente:**
- Precio final: obligatorio en venta directa
- Revendedor: obligatorio en venta a revendedor
- Precio revendedor: obligatorio en venta a revendedor

---

## Fase 3: El Módulo de Revendedores Ya Está Correcto

### Estado Actual - Sin Cambios Necesarios
- Sin comisiones (campo legacy ignorado)
- Tipo: revendedor/mayorista/interno
- Stats agregados: total comprado, pendiente, última venta
- Vista de detalle con historial de compras

---

## Fase 4: Dashboard Integrado

### 4.1 Métricas Existentes (Ya Implementadas)
El dashboard de ventas ya muestra:
- Total vendido (global)
- Ventas directas (separadas)
- Ventas a revendedores (separadas)
- Pendiente por cobrar
- Cobrado
- Ganancia neta
- Margen promedio

### 4.2 Mejora Propuesta - Sección de Creativos en Dashboard

Agregar al Command Center:
```text
┌─────────────────────────────────────────────────────────────────┐
│  🎨 CREATIVOS                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ 12         │ │ 4          │ │ 33%        │                   │
│  │ Total      │ │ Calientes  │ │ Efectividad│                   │
│  │ creativos  │ │ 🔥         │ │            │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
│                                                                  │
│  Hook más efectivo: 💰 Precio                                    │
│  Canal top: 📸 Instagram                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

### Base de Datos
| Archivo | Cambios |
|---------|---------|
| Nueva migración | Agregar `publication_reference`, `cta_text`, actualizar enum `creative_status` |

### Tipos
| Archivo | Cambios |
|---------|---------|
| `src/types/index.ts` | Actualizar `CreativeStatus`, agregar `publicationReference`, `ctaText` |

### Componentes de Creativos
| Archivo | Cambios |
|---------|---------|
| `src/components/creatives/CreativeForm.tsx` | Hacer producto obligatorio, agregar pestaña Media, agregar campo CTA |
| `src/components/creatives/CreativeCard.tsx` | Mostrar estado con colores apropiados |
| `src/hooks/useCreatives.ts` | Mapear nuevos campos |
| `src/pages/Creatives.tsx` | Agregar modal de cierre con aprendizaje obligatorio |

### Componentes de Ventas
| Archivo | Cambios |
|---------|---------|
| `src/pages/Sales.tsx` | Agregar validaciones visuales más claras |

---

## Orden de Implementación

```text
Paso 1: Migración de base de datos
        ├── Agregar campos publication_reference, cta_text
        └── Considerar actualización de status enum (opcional)

Paso 2: Actualizar tipos TypeScript
        ├── Agregar nuevos campos a Creative
        └── Mantener compatibilidad con estados existentes

Paso 3: Actualizar formulario de creativos
        ├── Hacer producto obligatorio
        ├── Agregar pestaña/sección Media
        ├── Agregar campo CTA
        └── Agregar campo referencia de publicación

Paso 4: Agregar modal de cierre de experimento
        ├── Detectar cambio a estado "cerrado"
        └── Forzar documentación de aprendizaje

Paso 5: Mejorar validaciones en ventas
        ├── Marcar campos obligatorios visualmente
        └── Agregar mensajes de error específicos

Paso 6: (Opcional) Agregar sección creativos al Command Center
```

---

## Resumen de Cambios por Prioridad

### PRIORIDAD ALTA
1. Hacer producto obligatorio en creativos
2. Agregar campo CTA al formulario de creativos
3. Forzar aprendizaje al cerrar experimento
4. Agregar referencia de publicación

### PRIORIDAD MEDIA
5. Agregar pestaña/sección Media para subir archivos
6. Mejorar validaciones visuales en ventas
7. Agregar sección creativos al Command Center

### YA IMPLEMENTADO (No requiere cambios)
- sale_type obligatorio
- Separación directa vs revendedor
- Revendedores sin comisión
- Dashboard con métricas separadas
- Cálculos de márgenes automáticos

---

## Sección Técnica

### Migración SQL

```sql
-- Agregar campos faltantes a creatives
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS publication_reference text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS cta_text text;

-- Comentarios descriptivos
COMMENT ON COLUMN creatives.publication_reference IS 
  'Referencia de publicación: ej. "Historia IG 06/02", "Post FB"';
COMMENT ON COLUMN creatives.cta_text IS 
  'Call to Action principal del creativo';
```

### Nuevo Storage Bucket (si se implementa subida de media)

```sql
-- Crear bucket para creativos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('creatives', 'creatives', true);

-- Política de acceso
CREATE POLICY "Allow authenticated uploads to creatives" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'creatives');
```

### Validación de Cierre de Experimento

```typescript
const handleStatusChange = async (newStatus: CreativeStatus) => {
  if (newStatus === 'cerrado') {
    // Verificar que el campo learning tenga contenido
    if (!creative.learning || creative.learning.trim().length < 20) {
      setShowClosureModal(true);
      return;
    }
  }
  await updateCreative(creative.id, { status: newStatus });
};
```

---

## Resultado Esperado

1. **Creativos como experimentos**: Cada creativo documenta un experimento comercial completo con producto, mensaje, métricas y aprendizaje
2. **Ventas claras**: Separación total entre venta directa y venta a revendedor con validaciones apropiadas
3. **Revendedores operativos**: Tracking de compras, deudas y relación comercial sin modelo de comisión
4. **Dashboard útil**: Visibilidad completa del estado financiero separado por canal de venta
5. **Memoria del negocio**: Cada creativo cerrado deja aprendizaje documentado para futuras decisiones

El sistema quedará:
- Manual pero estructurado
- Preparado para automatización futura (n8n)
- Listo para análisis de rentabilidad por canal
- Con data limpia para futura IA
