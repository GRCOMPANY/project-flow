
# Plan: Sistema de Archivos para Creativos

## Problema Actual

El módulo de Creativos solo tiene campos de URL de texto (`imageUrl`, `videoUrl`). No existe funcionalidad para:
- Subir archivos reales (imágenes/videos)
- Clasificar tipo de archivo
- Trackear historial de uploads
- Mostrar advertencias cuando un creativo no tiene material visual

---

## Estado Actual vs Estado Objetivo

| Aspecto | Actual | Objetivo |
|---------|--------|----------|
| Subida de archivos | Solo URLs de texto | Subida directa a Storage |
| Tipo de archivo | No existe | Principal / Variación / Referencia |
| Estado del archivo | No existe | Borrador / Publicado / Descartado |
| Historial | No existe | Fecha, usuario, notas |
| Validación visual | No existe | Advertencia "Sin material visual" |
| Preview | Solo si hay URL | Preview con thumbnails |

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────┐
│  NUEVO: Tabla creative_files                                     │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  id             UUID PRIMARY KEY                                 │
│  creative_id    UUID REFERENCES creatives(id) ON DELETE CASCADE  │
│  ─────────────────────────────────────────────────────────────  │
│  file_url       TEXT (URL de Supabase Storage)                   │
│  file_name      TEXT (nombre original)                           │
│  file_type      ENUM (imagen, video)                             │
│  file_role      ENUM (principal, variacion, referencia)          │
│  status         ENUM (borrador, publicado, descartado)           │
│  ─────────────────────────────────────────────────────────────  │
│  channel_used   TEXT (ej: "Historia IG", "Facebook Ads")         │
│  notes          TEXT (notas opcionales)                          │
│  ─────────────────────────────────────────────────────────────  │
│  uploaded_by    UUID (usuario)                                   │
│  uploaded_at    TIMESTAMP                                        │
│  created_at     TIMESTAMP                                        │
│  updated_at     TIMESTAMP                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Base de Datos

### 1.1 Crear Tipos ENUM

```sql
CREATE TYPE creative_file_type AS ENUM ('imagen', 'video');
CREATE TYPE creative_file_role AS ENUM ('principal', 'variacion', 'referencia');
CREATE TYPE creative_file_status AS ENUM ('borrador', 'publicado', 'descartado');
```

### 1.2 Crear Tabla creative_files

```sql
CREATE TABLE creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES creatives(id) ON DELETE CASCADE NOT NULL,
  
  -- File info
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type creative_file_type NOT NULL,
  file_role creative_file_role NOT NULL DEFAULT 'principal',
  status creative_file_status NOT NULL DEFAULT 'borrador',
  
  -- Usage tracking
  channel_used TEXT,
  notes TEXT,
  
  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para consultas frecuentes
CREATE INDEX idx_creative_files_creative_id ON creative_files(creative_id);
```

### 1.3 Políticas RLS

```sql
-- Lectura: todos los autenticados
CREATE POLICY "Authenticated can view creative files" ON creative_files
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Escritura: solo admins
CREATE POLICY "Admins can manage creative files" ON creative_files
FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## Fase 2: Tipos TypeScript

### 2.1 Nuevos tipos en `src/types/index.ts`

```typescript
// Tipos para archivos de creativos
export type CreativeFileType = 'imagen' | 'video';
export type CreativeFileRole = 'principal' | 'variacion' | 'referencia';
export type CreativeFileStatus = 'borrador' | 'publicado' | 'descartado';

export interface CreativeFile {
  id: string;
  creativeId: string;
  
  // File info
  fileUrl: string;
  fileName: string;
  fileType: CreativeFileType;
  fileRole: CreativeFileRole;
  status: CreativeFileStatus;
  
  // Usage
  channelUsed?: string;
  notes?: string;
  
  // Audit
  uploadedBy?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 Extender interfaz Creative

```typescript
export interface Creative {
  // ... campos existentes ...
  
  // Archivos asociados
  files?: CreativeFile[];
  
  // Computed: tiene material visual?
  hasMedia?: boolean;
}
```

---

## Fase 3: Hook useCreativeFiles

### 3.1 Nuevo hook `src/hooks/useCreativeFiles.ts`

```typescript
// Funcionalidades:
// - uploadFile(creativeId, file, role, status)
// - updateFile(fileId, updates)
// - deleteFile(fileId)
// - getFilesByCreative(creativeId)
```

---

## Fase 4: Componente de Upload

### 4.1 Nuevo componente `CreativeFileUploader.tsx`

```text
┌─────────────────────────────────────────────────────────────────┐
│  🖼️ ARCHIVOS DEL CREATIVO                                       │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │    📁 Arrastra archivos aquí o haz clic para subir        │  │
│  │                                                           │  │
│  │    Formatos: JPG, PNG, WEBP, MP4, MOV                     │  │
│  │    Máximo: 50MB por archivo                               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Subir imagen]  [Subir video]                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  📎 ARCHIVOS CARGADOS (2)                                        │
│                                                                  │
│  ┌─────────┬───────────────────────────────────────────────┐    │
│  │ [img]   │ promo-enero.jpg                    🟢 Principal │    │
│  │ preview │ Tipo: Imagen • Estado: Publicado              │    │
│  │         │ Canal: Historia IG                            │    │
│  │         │ [Editar] [Eliminar]                           │    │
│  └─────────┴───────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────┬───────────────────────────────────────────────┐    │
│  │ [video] │ video-demo.mp4                     🔵 Variación │    │
│  │ preview │ Tipo: Video • Estado: Borrador                │    │
│  │         │ Notas: Para probar en TikTok                  │    │
│  │         │ [Editar] [Eliminar]                           │    │
│  └─────────┴───────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Funcionalidades del componente

- Drag and drop
- Preview de imágenes/videos
- Selector de rol (Principal/Variación/Referencia)
- Selector de estado (Borrador/Publicado/Descartado)
- Campo de canal usado
- Campo de notas
- Barra de progreso durante upload

---

## Fase 5: Integración en Formulario

### 5.1 Actualizar CreativeForm.tsx - Tab Media

```text
PESTAÑA MEDIA (Actualizada)
├── SECCIÓN: Subida de archivos
│   └── CreativeFileUploader component
├── SECCIÓN: URLs alternativas (opcional)
│   ├── URL de imagen externa
│   └── URL de video externa
└── SECCIÓN: Referencia de publicación
    └── Campo existente (publicationReference)
```

---

## Fase 6: Advertencias Visuales

### 6.1 En CreativeCard

```typescript
// Mostrar advertencia si no hay archivos ni URLs
{!creative.hasMedia && (
  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
    <span className="text-amber-600 font-medium text-sm">
      ⚠️ Sin material visual
    </span>
  </div>
)}
```

### 6.2 En ProductCreativesTab

```typescript
// Badge de advertencia en timeline
{!creative.hasMedia && (
  <Badge variant="outline" className="text-amber-600 border-amber-500">
    ⚠️ Sin visual
  </Badge>
)}
```

---

## Fase 7: Vista de Producto Mejorada

### 7.1 Galería de creativos en ProductCreativesTab

```text
┌─────────────────────────────────────────────────────────────────┐
│  📸 GALERÍA DE CREATIVOS                                         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  FILTROS: [Todos] [Activos] [Descartados]                        │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │ [img]   │ │ [img]   │ │ [video] │ │ [⚠️]    │                │
│  │ 🔥      │ │ ❄️      │ │ ⚡      │ │ Sin     │                │
│  │ Caliente│ │ Frío    │ │Interes. │ │ visual  │                │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar/Crear

### Nuevos Archivos
| Archivo | Descripción |
|---------|-------------|
| Nueva migración SQL | Crear tabla creative_files con ENUMs y RLS |
| `src/types/index.ts` | Agregar tipos CreativeFile |
| `src/hooks/useCreativeFiles.ts` | Hook para gestión de archivos |
| `src/components/creatives/CreativeFileUploader.tsx` | Componente de upload |

### Archivos a Modificar
| Archivo | Cambios |
|---------|---------|
| `src/hooks/useCreatives.ts` | Incluir files en fetch, agregar hasMedia |
| `src/components/creatives/CreativeForm.tsx` | Integrar FileUploader en tab Media |
| `src/components/creatives/CreativeCard.tsx` | Advertencia sin media |
| `src/components/products/ProductCreativesTab.tsx` | Galería mejorada |
| `src/pages/Creatives.tsx` | Mostrar media en detalle sheet |

---

## Orden de Implementación

```text
Paso 1: Migración de base de datos
        ├── Crear ENUMs
        ├── Crear tabla creative_files
        └── Crear políticas RLS

Paso 2: Actualizar tipos TypeScript
        ├── Agregar CreativeFile interface
        └── Extender Creative con files y hasMedia

Paso 3: Crear hook useCreativeFiles
        ├── uploadFile
        ├── updateFile
        ├── deleteFile
        └── Integración con useCreatives

Paso 4: Crear componente CreativeFileUploader
        ├── Drag and drop zone
        ├── File preview
        ├── Role/Status selectors
        └── Progress bar

Paso 5: Integrar en CreativeForm
        └── Reemplazar tab Media con nuevo uploader

Paso 6: Actualizar UI con advertencias
        ├── CreativeCard: badge sin media
        ├── ProductCreativesTab: galería
        └── Creatives.tsx: detalle sheet
```

---

## Validaciones del Sistema

| Validación | Comportamiento |
|------------|----------------|
| Archivo sin creativo | No permitir (creative_id requerido) |
| Creativo sin archivos | Mostrar advertencia visual |
| Formatos permitidos | JPG, PNG, WEBP, GIF, MP4, MOV, WEBM |
| Tamaño máximo | 50MB por archivo |
| Al menos 1 principal | Recomendado pero no obligatorio |

---

## Sección Técnica

### Migración SQL Completa

```sql
-- Crear tipos ENUM para archivos de creativos
CREATE TYPE creative_file_type AS ENUM ('imagen', 'video');
CREATE TYPE creative_file_role AS ENUM ('principal', 'variacion', 'referencia');
CREATE TYPE creative_file_status AS ENUM ('borrador', 'publicado', 'descartado');

-- Crear tabla de archivos
CREATE TABLE creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type creative_file_type NOT NULL,
  file_role creative_file_role NOT NULL DEFAULT 'principal',
  status creative_file_status NOT NULL DEFAULT 'borrador',
  
  channel_used TEXT,
  notes TEXT,
  
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE creative_files ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Authenticated can view creative files" 
ON creative_files FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert creative files" 
ON creative_files FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update creative files" 
ON creative_files FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete creative files" 
ON creative_files FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_creative_files_updated_at
  BEFORE UPDATE ON creative_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índice para consultas
CREATE INDEX idx_creative_files_creative_id ON creative_files(creative_id);
```

### Función de Upload

```typescript
const uploadCreativeFile = async (
  creativeId: string,
  file: File,
  role: CreativeFileRole = 'principal',
  status: CreativeFileStatus = 'borrador'
): Promise<CreativeFile | null> => {
  // 1. Subir a Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${creativeId}/${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(fileName, file);
  
  if (uploadError) {
    toast({ title: 'Error', description: 'No se pudo subir el archivo' });
    return null;
  }
  
  // 2. Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('creatives')
    .getPublicUrl(fileName);
  
  // 3. Crear registro en DB
  const { data, error } = await supabase
    .from('creative_files')
    .insert({
      creative_id: creativeId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type.startsWith('video/') ? 'video' : 'imagen',
      file_role: role,
      status: status,
      uploaded_by: userId,
    })
    .select()
    .single();
  
  if (error) {
    toast({ title: 'Error', description: 'No se pudo registrar el archivo' });
    return null;
  }
  
  return mapCreativeFile(data);
};
```

---

## Resultado Esperado

1. **Subida real de archivos**: Drag & drop funcional con Supabase Storage
2. **Clasificación de archivos**: Rol (principal/variación/referencia) y estado (borrador/publicado/descartado)
3. **Historial completo**: Quién subió, cuándo, en qué canal se usó
4. **Advertencias visuales**: "Creativo sin material visual" claramente visible
5. **Galería por producto**: Vista de todos los creativos con thumbnails
6. **Prevención de repetición**: Ver qué creativos existen antes de crear nuevos
7. **Preparado para automatización**: Estructura lista para n8n/IA

