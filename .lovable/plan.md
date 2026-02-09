
# Plan: Transformacion Multi-Tenant (Multi-Empresa)

## Nota sobre el Error de Build

El error `commit not found in any remote` es un problema temporal de infraestructura git, no de codigo. Se resuelve reintentando el publish. No esta relacionado con los cambios de codigo.

---

## Alcance del Cambio

Esta es una transformacion arquitectonica completa. Cada tabla de datos del sistema necesita aislamiento por empresa. El plan se divide en fases incrementales para minimizar riesgos.

---

## Arquitectura de 3 Niveles

```text
NIVEL 1: USUARIO
   Un usuario = una persona con login
   Puede pertenecer a 1+ empresas

NIVEL 2: EMPRESA
   Espacio aislado con sus propios:
   - Productos locales
   - Ventas
   - Creativos
   - Vendedores
   - Proveedores
   - Tareas

NIVEL 3: CATALOGO MAESTRO GRC
   Productos creados por GRC (empresa madre)
   Disponibles para empresas que activen linked_to_grc
   Sin datos operativos compartidos
```

---

## Fase 1: Nuevas Tablas Base

### 1.1 Tabla `companies`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID PK | Identificador |
| name | TEXT NOT NULL | Nombre de la empresa |
| owner_user_id | UUID NOT NULL | Usuario creador/dueno |
| plan | TEXT DEFAULT 'free' | free / pro / reseller / enterprise |
| linked_to_grc | BOOLEAN DEFAULT false | Puede ver catalogo GRC |
| is_grc | BOOLEAN DEFAULT false | Es la empresa madre GRC |
| created_at | TIMESTAMPTZ | Fecha creacion |
| updated_at | TIMESTAMPTZ | Fecha actualizacion |

### 1.2 Tabla `company_users`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID PK | Identificador |
| user_id | UUID NOT NULL | Ref a profiles |
| company_id | UUID NOT NULL | Ref a companies |
| role | company_role ENUM | owner / admin / collaborator / seller |
| status | TEXT DEFAULT 'active' | active / inactive / invited |
| created_at | TIMESTAMPTZ | Fecha creacion |

ENUM `company_role`: owner, admin, collaborator, seller

UNIQUE constraint en (user_id, company_id)

### 1.3 Tabla `company_products` (Productos GRC en empresas cliente)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID PK | Identificador |
| company_id | UUID NOT NULL | Empresa que usa el producto |
| source_product_id | UUID NOT NULL | Producto original GRC |
| cost_price | NUMERIC | Precio costo para esta empresa |
| wholesale_price | NUMERIC | Precio mayoreo |
| retail_price | NUMERIC | Precio publico |
| status | product_status | activo / pausado / agotado |
| created_at | TIMESTAMPTZ | Fecha |

---

## Fase 2: Agregar company_id a Tablas Existentes

Todas las tablas operativas necesitan `company_id`:

| Tabla | Cambio |
|-------|--------|
| products | ADD company_id UUID REFERENCES companies(id) |
| sales | ADD company_id UUID REFERENCES companies(id) |
| creatives | ADD company_id UUID REFERENCES companies(id) |
| creative_files | (hereda via creative) |
| sellers | ADD company_id UUID REFERENCES companies(id) |
| suppliers | ADD company_id UUID REFERENCES companies(id) |
| tasks | ADD company_id UUID REFERENCES companies(id) |
| task_outcomes | (hereda via task) |
| projects | ADD company_id UUID REFERENCES companies(id) |
| creative_automation_intents | ADD company_id UUID REFERENCES companies(id) |

### Migracion de datos existentes

Los datos existentes se asignaran a una empresa GRC creada automaticamente:

```sql
-- 1. Crear empresa GRC
INSERT INTO companies (id, name, owner_user_id, plan, is_grc, linked_to_grc)
VALUES (gen_random_uuid(), 'GRC', <admin_user_id>, 'enterprise', true, true);

-- 2. Asignar datos existentes a GRC
UPDATE products SET company_id = <grc_company_id>;
UPDATE sales SET company_id = <grc_company_id>;
-- ... etc para cada tabla
```

---

## Fase 3: Funciones de Seguridad

### 3.1 Funcion para obtener company_id del usuario actual

```sql
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM company_users 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1
$$;
```

### 3.2 Funcion para verificar pertenencia a empresa

```sql
CREATE OR REPLACE FUNCTION user_belongs_to_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = auth.uid()
      AND company_id = _company_id
      AND status = 'active'
  )
$$;
```

### 3.3 Funcion para verificar rol en empresa

```sql
CREATE OR REPLACE FUNCTION has_company_role(_company_id UUID, _role company_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = auth.uid()
      AND company_id = _company_id
      AND role = _role
      AND status = 'active'
  )
$$;
```

---

## Fase 4: Reescribir TODAS las Politicas RLS

Cada tabla operativa cambia de:
- "admin puede todo" 
a:
- "usuario puede operar solo datos de su empresa"

### Ejemplo para `products`:

```sql
-- DROP todas las politicas existentes de products

-- SELECT: usuario ve productos de su empresa
CREATE POLICY "Users see own company products"
ON products FOR SELECT
USING (user_belongs_to_company(company_id));

-- INSERT: admin/owner de la empresa puede crear
CREATE POLICY "Company admins can insert products"
ON products FOR INSERT
WITH CHECK (
  user_belongs_to_company(company_id)
  AND (
    has_company_role(company_id, 'owner')
    OR has_company_role(company_id, 'admin')
  )
);

-- UPDATE: admin/owner de la empresa puede editar
CREATE POLICY "Company admins can update products"
ON products FOR UPDATE
USING (
  user_belongs_to_company(company_id)
  AND (
    has_company_role(company_id, 'owner')
    OR has_company_role(company_id, 'admin')
  )
);

-- DELETE: solo owner
CREATE POLICY "Company owners can delete products"
ON products FOR DELETE
USING (
  has_company_role(company_id, 'owner')
);
```

El mismo patron se aplica a: sales, creatives, sellers, suppliers, tasks, projects.

### Politica especial para productos GRC (catalogo maestro)

```sql
-- Empresas linked_to_grc pueden VER productos de GRC
CREATE POLICY "Linked companies can view GRC products"
ON products FOR SELECT
USING (
  -- Es de mi empresa
  user_belongs_to_company(company_id)
  OR
  -- Es producto GRC y mi empresa esta linked
  (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = products.company_id AND is_grc = true
    )
    AND EXISTS (
      SELECT 1 FROM company_users cu
      JOIN companies c ON c.id = cu.company_id
      WHERE cu.user_id = auth.uid()
        AND c.linked_to_grc = true
        AND cu.status = 'active'
    )
  )
);
```

---

## Fase 5: Flujo de Registro Actualizado

### 5.1 Trigger `handle_new_user` actualizado

Cuando un usuario se registra:

1. Se crea su perfil en `profiles`
2. Se crea su rol en `user_roles` (mantener para compatibilidad)
3. Se crea una nueva empresa con su nombre
4. Se le asigna como `owner` en `company_users`

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- 1. Crear perfil
  INSERT INTO profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'), new.email);

  -- 2. Crear rol legacy
  INSERT INTO user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::app_role, 'colaborador'));

  -- 3. Crear empresa
  INSERT INTO companies (name, owner_user_id, plan)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'company_name', 
             new.raw_user_meta_data->>'full_name' || '''s Company'),
    new.id,
    'free'
  )
  RETURNING id INTO new_company_id;

  -- 4. Asignar como owner
  INSERT INTO company_users (user_id, company_id, role, status)
  VALUES (new.id, new_company_id, 'owner', 'active');

  RETURN new;
END;
$$;
```

### 5.2 Formulario de registro actualizado

Agregar campo "Nombre de tu empresa" al formulario de registro.

---

## Fase 6: Contexto de Empresa (Frontend)

### 6.1 Nuevo `CompanyContext`

```typescript
interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];           // Empresas del usuario
  companyRole: CompanyRole | null; // Rol en empresa actual
  isOwner: boolean;
  isCompanyAdmin: boolean;
  switchCompany: (companyId: string) => void;
  loading: boolean;
}
```

### 6.2 Hook `useCompany`

- Se carga al iniciar sesion
- Selecciona la primera empresa del usuario por defecto
- Almacena empresa activa en localStorage
- Todos los hooks de datos reciben `companyId` del contexto

---

## Fase 7: Actualizar TODOS los Hooks de Datos

Cada hook necesita filtrar por `company_id`:

### Patron comun:

```typescript
// ANTES
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

// DESPUES
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('company_id', currentCompanyId)  // NUEVO
  .order('created_at', { ascending: false });
```

### Hooks afectados:

| Hook | Cambios |
|------|---------|
| useProducts | Filtrar por company_id, incluir en insert |
| useSales | Filtrar por company_id, incluir en insert |
| useCreatives | Filtrar por company_id, incluir en insert |
| useCreativeFiles | Hereda via creativo |
| useSellers | Filtrar por company_id, incluir en insert |
| useSuppliers | Filtrar por company_id, incluir en insert |
| useTasks | Filtrar por company_id, incluir en insert |
| useProjects | Filtrar por company_id, incluir en insert |
| useSmartCatalog | Sin cambios (recibe datos ya filtrados) |
| useBusinessSummary | Sin cambios (recibe datos ya filtrados) |

---

## Fase 8: UI - Selector de Empresa

### 8.1 Company Switcher en la navegacion

Agregar al `CommandCenterNav`:
- Nombre de empresa actual al lado del logo
- Dropdown para cambiar de empresa (si tiene multiples)
- Indicador visual de empresa activa

### 8.2 Pagina de Configuracion de Empresa

Nueva ruta `/settings`:
- Nombre de empresa
- Plan actual
- Vincular/desvincular de catalogo GRC
- Invitar usuarios
- Gestionar roles de miembros

---

## Fase 9: Catalogo Maestro GRC

### 9.1 Flujo de uso

1. GRC crea productos en su empresa (is_grc = true)
2. Empresas con linked_to_grc = true ven estos productos como "Catalogo GRC"
3. Al activar un producto GRC, se crea un registro en `company_products` con precios personalizados
4. Las ventas de la empresa usan el company_product, no el producto GRC directamente

### 9.2 Vista de Catalogo GRC (nueva seccion en Productos)

```text
Tab: [Mis Productos] [Catalogo GRC]

Catalogo GRC:
- Lista de productos disponibles de GRC
- Boton "Activar en mi empresa"
- Al activar: formulario de precios personalizados
- Los productos activados aparecen en "Mis Productos"
```

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| Migracion SQL | companies, company_users, company_products, company_id en tablas, RLS |
| src/contexts/CompanyContext.tsx | Contexto de empresa activa |
| src/hooks/useCompany.ts | Hook para gestionar empresas |
| src/components/CompanySwitcher.tsx | Selector de empresa |
| src/pages/CompanySettings.tsx | Configuracion de empresa |
| src/components/products/GRCCatalog.tsx | Vista de catalogo GRC |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| src/contexts/AuthContext.tsx | Integrar con CompanyContext |
| src/hooks/useProducts.ts | Filtrar por company_id |
| src/hooks/useSales.ts | Filtrar por company_id |
| src/hooks/useCreatives.ts | Filtrar por company_id |
| src/hooks/useSellers.ts | Filtrar por company_id |
| src/hooks/useSuppliers.ts | Filtrar por company_id |
| src/hooks/useTasks.ts | Filtrar por company_id |
| src/hooks/useProjects.ts | Filtrar por company_id |
| src/components/command-center/CommandCenterNav.tsx | Company switcher |
| src/pages/Auth.tsx | Campo nombre de empresa |
| src/pages/CommandCenter.tsx | Datos filtrados por empresa |
| src/App.tsx | Nuevas rutas, CompanyProvider |
| src/types/index.ts | Tipos Company, CompanyUser, CompanyRole |

---

## Orden de Implementacion

```text
Paso 1: Migracion de base de datos (mas grande)
   1a. Crear ENUMs y tablas nuevas
   1b. Agregar company_id a tablas existentes (nullable primero)
   1c. Crear empresa GRC y asignar datos existentes
   1d. Hacer company_id NOT NULL
   1e. Crear funciones de seguridad
   1f. Reescribir TODAS las politicas RLS
   1g. Actualizar trigger handle_new_user

Paso 2: Tipos TypeScript
   - Company, CompanyUser, CompanyRole

Paso 3: CompanyContext + useCompany hook

Paso 4: Actualizar AuthContext para integrar con CompanyContext

Paso 5: Actualizar TODOS los hooks de datos (8 hooks)

Paso 6: Actualizar UI
   - Formulario de registro (campo empresa)
   - Company switcher en nav
   - Pagina de configuracion

Paso 7: Catalogo GRC
   - Vista de catalogo
   - Activacion de productos
   - company_products CRUD

Paso 8: Testing end-to-end
```

---

## Riesgos y Consideraciones

| Riesgo | Mitigacion |
|--------|-----------|
| Datos existentes quedan sin company_id | Migrar todo a empresa GRC primero |
| RLS recursion | Usar funciones SECURITY DEFINER |
| Multiples empresas por usuario | localStorage para empresa activa |
| Performance con funciones RLS | Indices en company_id y company_users |
| Compatibilidad con user_roles | Mantener tabla legacy, usar company_users para nuevo sistema |

---

## Seccion Tecnica: Migracion SQL Completa

La migracion SQL es la pieza mas critica. Incluye:

1. ~3 nuevos ENUMs
2. ~3 tablas nuevas con RLS
3. ~10 columnas nuevas en tablas existentes
4. ~30 politicas RLS reescritas
5. ~3 funciones de seguridad nuevas
6. ~1 trigger actualizado
7. Migracion de datos existentes a empresa GRC

Total estimado: ~200 lineas de SQL

La migracion se ejecutara en un solo paso para mantener consistencia. Si falla, se puede revertir completamente.

---

## Resultado Final

1. Cada usuario nuevo crea su propia empresa al registrarse
2. Datos completamente aislados entre empresas
3. GRC funciona como empresa madre con catalogo compartido
4. Empresas cliente pueden usar productos GRC con precios propios
5. Dashboard muestra solo datos de la empresa activa
6. Sistema listo para vender como SaaS
7. Escalable a multiples empresas sin cambios adicionales
