

# Plan: Corregir Dashboard Vacio - Empresa Activa

## Problema Raiz

El dashboard aparece vacio porque las politicas RLS de `company_users` y `companies` tienen una dependencia circular:

- `company_users` SELECT usa `user_belongs_to_company(company_id)` que consulta `company_users` - referencia circular
- `companies` SELECT usa `EXISTS (SELECT 1 FROM company_users ...)` - correcto, pero depende de que `company_users` sea accesible

Cuando `CompanyContext` ejecuta:
```
supabase.from('company_users').select('*, company:companies(*)')
```
La politica RLS de `company_users` llama a `user_belongs_to_company()` que vuelve a consultar `company_users`, creando un ciclo que retorna vacio.

## Solucion

### Paso 1: Corregir la politica RLS de company_users

La politica SELECT de `company_users` debe usar una comparacion directa en lugar de la funcion recursiva:

```sql
-- Eliminar la politica circular actual
DROP POLICY "Users see members of their companies" ON company_users;

-- Nueva politica: un usuario ve los registros de company_users
-- de las empresas donde el mismo es miembro (comparacion directa)
CREATE POLICY "Users see members of their companies" 
ON company_users FOR SELECT
USING (
  company_id IN (
    SELECT cu.company_id FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);
```

Esto permite que un usuario vea todos los miembros de sus empresas sin recursion.

### Paso 2: Corregir la politica RLS de companies

Misma logica - evitar la dependencia en funciones que consulten tablas con RLS circular:

```sql
-- Eliminar la politica actual
DROP POLICY "Users see their companies" ON companies;

-- Nueva politica directa
CREATE POLICY "Users see their companies" 
ON companies FOR SELECT
USING (
  id IN (
    SELECT cu.company_id FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);
```

### Paso 3: Actualizar CompanyContext para mayor robustez

Agregar manejo de errores con logging y reintentos. Ocultar el `CompanySwitcher` cuando hay una sola empresa.

Cambios en `CompanyContext.tsx`:
- Agregar `console.error` cuando `cuError` ocurra para facilitar debugging futuro
- Mantener `loading=true` hasta que realmente se resuelva la empresa

Cambios en `CompanySwitcher.tsx`:
- Ya maneja el caso de 1 empresa (muestra solo texto, sin dropdown) - esto esta correcto

### Paso 4: Asegurar que los hooks no queden en estado "loading" infinito

Los hooks ya tienen `if (!currentCompany) return;` pero no cambian `loading` a `false` en ese caso. Corregir para que si no hay empresa, se establezca `loading = false` y se muestre un estado vacio apropiado en lugar de spinners infinitos.

Hooks afectados: `useProducts`, `useSales`, `useCreatives`, `useSellers`, `useSuppliers`, `useTasks`, `useProjects`.

Patron de correccion:
```typescript
const fetchProducts = async () => {
  if (!currentCompany) {
    setLoading(false);  // <-- agregar esto
    return;
  }
  // ...resto igual
};
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Corregir RLS de company_users y companies |
| src/contexts/CompanyContext.tsx | Agregar logging de errores |
| src/hooks/useProducts.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useSales.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useCreatives.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useSellers.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useSuppliers.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useTasks.ts | setLoading(false) cuando no hay empresa |
| src/hooks/useProjects.ts | setLoading(false) cuando no hay empresa |

## Orden de Implementacion

1. Migracion SQL (corregir RLS circular)
2. Actualizar CompanyContext con logging
3. Corregir todos los hooks para evitar loading infinito

## Resultado Esperado

- Al iniciar sesion, CompanyContext obtiene las empresas del usuario correctamente
- La empresa GRC se auto-selecciona (unica empresa del admin)
- El dashboard carga los datos filtrados por la empresa activa
- No hay spinners infinitos si algo falla

