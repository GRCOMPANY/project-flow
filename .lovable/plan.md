
# Plan: Stabilize /creatives Page - Fix Runtime Errors

## Problem Identified

The `/creatives` page is crashing due to a **Radix UI Select validation error**:

```
Error: A <Select.Item /> must have a value prop that is not an empty string.
```

### Root Cause
In `src/components/creatives/CreativeForm.tsx` line 164:
```tsx
<SelectItem value="">Sin producto</SelectItem>
```

Radix UI Select does NOT allow empty string values for `SelectItem` because empty string is reserved for clearing the selection.

---

## Fix Strategy

Following the user's request for **STABLE UI FIRST**, I will:

1. **Fix the Select.Item error** - Use a placeholder value like `"none"` instead of empty string
2. **Disable complex components** - Remove CreativeComparison, CreativeActions, ProductCreativesTab temporarily  
3. **Simplify the page** - Render only a basic list of creatives grouped by product_id
4. **Keep core functionality** - Product-Creative relationship remains visible

---

## Changes Required

### File 1: `src/components/creatives/CreativeForm.tsx`

**Fix the empty value Select.Item error:**

| Line | Current | Fix |
|------|---------|-----|
| 164 | `<SelectItem value="">Sin producto</SelectItem>` | `<SelectItem value="none">Sin producto</SelectItem>` |
| 158 | `value={formData.productId}` | `value={formData.productId \|\| 'none'}` |
| 158 | `onValueChange={(v) => setFormData({ ...formData, productId: v })}` | `onValueChange={(v) => setFormData({ ...formData, productId: v === 'none' ? '' : v })}` |

### File 2: `src/pages/Creatives.tsx`

**Simplify to basic stable version:**

1. Remove imports for `CreativeComparison`, `CreativeActions`
2. Remove comparison and actions from Sheet detail view (lines 321-334)
3. Remove `handleRepeat` and `handleScale` functions
4. Simplify `CreativeCard` usage - remove repeat/scale callbacks
5. Keep ProductView but simplified (no complex stats)

### File 3: `src/components/creatives/CreativeCard.tsx`

**Disable automation buttons temporarily:**

1. Remove `onRepeat` and `onScale` button renders
2. Keep only "Ver" (View) action

---

## Simplified Creatives.tsx Structure

```text
/creatives page (simplified)
├── Header with title
├── View toggle (Global / Por Producto)
├── Insights panel (keep - no complex logic)
├── Filters sidebar (keep - uses Badges, not Selects)
└── Main content
    ├── Global view: Grid of CreativeCards (simplified)
    └── Product view: Products with their creatives
        └── Each product shows:
            ├── Product header (name, image)
            └── Grid of CreativeCards (simplified)

Sheet detail (simplified):
├── Basic info (title, product)
├── Copy text
├── Learning text
└── Edit/Delete buttons (admin only)

REMOVED:
- CreativeComparison
- CreativeActions
- Repeat/Scale buttons
- Automation intent logic
```

---

## What This Fixes

1. **Select.Item empty value error** - No more crashes from form
2. **Simpler rendering** - Less components = less potential errors
3. **Product-Creative relationship visible** - Both views work
4. **Core CRUD works** - Create, View, Edit, Delete still functional

---

## What Remains Disabled (for now)

| Feature | Status |
|---------|--------|
| CreativeComparison | Disabled |
| CreativeActions (n8n buttons) | Disabled |
| ProductCreativesTab in ProductDetail | Keep as-is (separate page) |
| Repeat/Scale quick actions | Disabled |
| Automation intent updates | Disabled |

---

## Implementation Order

```text
Step 1: Fix CreativeForm.tsx Select error
Step 2: Simplify CreativeCard.tsx (remove action buttons)
Step 3: Simplify Creatives.tsx main page
Step 4: Verify page loads without errors
```

---

## Technical Details

### Select.Item Fix Pattern

```tsx
// BEFORE (crashes)
<Select value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v})}>
  <SelectItem value="">Sin producto</SelectItem>
  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
</Select>

// AFTER (works)
<Select 
  value={formData.productId || 'none'} 
  onValueChange={(v) => setFormData({...formData, productId: v === 'none' ? '' : v})}
>
  <SelectItem value="none">Sin producto</SelectItem>
  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
</Select>
```

---

## Expected Result

After implementation:
- `/creatives` loads without errors
- User can view creatives in both Global and Product views
- User can create/edit/delete creatives
- Product-Creative relationship is clearly visible
- No automation or comparison features (will re-enable step by step)
