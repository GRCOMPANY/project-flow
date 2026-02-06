
# Plan: Reseller/Wholesale Business Model Redesign

## Executive Summary

This plan transforms the system from a commission-based seller model to a **reseller/wholesale model** where:
- You import products and sell them to resellers at a wholesale price
- Resellers buy from you and sell to end customers
- Your profit comes from the sale TO the reseller, not from commissions

---

## Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Seller concept | Employee with commission | Reseller/wholesaler who buys from you |
| Sale meaning | Your sale to end customer | Your sale TO the reseller |
| Profit calculation | Margin on retail sale | Margin on wholesale sale |
| Seller earnings | Commission % | Their own retail margin (informational) |
| Payment tracking | Customer payment | Reseller payment to you |

---

## Phase 1: Database Schema Changes

### 1.1 Modify `sellers` Table

```sql
-- Remove commission (deprecated but keep for migration safety)
-- Add type field for categorization

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS type text DEFAULT 'revendedor';
-- Valid values: 'revendedor', 'mayorista', 'interno'

COMMENT ON COLUMN sellers.commission IS 'DEPRECATED - Reseller model does not use commission';
```

### 1.2 Modify `sales` Table

Add new pricing columns for the reseller model:

```sql
-- Reseller-specific pricing
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reseller_price numeric DEFAULT 0;
-- Price you sell to the reseller

ALTER TABLE sales ADD COLUMN IF NOT EXISTS final_price numeric DEFAULT 0;
-- Optional: Price reseller sells to end customer (informational)

ALTER TABLE sales ADD COLUMN IF NOT EXISTS reseller_profit numeric DEFAULT 0;
-- Calculated: final_price - reseller_price (informational)

-- Rename/clarify existing columns conceptually:
-- cost_at_sale = Your product cost (China + import)
-- unit_price = Price sold to reseller (same as reseller_price)
-- margin_at_sale = Your profit per unit (reseller_price - cost)
```

---

## Phase 2: TypeScript Type Updates

### 2.1 Update Seller Interface

```typescript
// src/types/index.ts

export type ResellerType = 'revendedor' | 'mayorista' | 'interno';

export interface Seller {
  id: string;
  name: string;
  contact?: string;
  type?: ResellerType;        // NEW
  status: SellerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // REMOVED: commission (deprecated)
  
  // Computed fields (from sales aggregation)
  totalPurchased?: number;     // Sum of all sales to this reseller
  totalPaid?: number;          // Sum of paid sales
  pendingBalance?: number;     // totalPurchased - totalPaid
  lastSaleDate?: string;       // Most recent sale
  salesCount?: number;         // Number of transactions
}
```

### 2.2 Update Sale Interface

```typescript
export interface Sale {
  id: string;
  productId: string;
  product?: Product;
  
  // Reseller info
  resellerId?: string;         // Renamed from sellerId conceptually
  reseller?: Seller;
  
  // Pricing (CRITICAL for reseller model)
  productCost: number;         // Your cost (costAtSale)
  resellerPrice: number;       // Price you sell to reseller
  finalPrice?: number;         // Optional: reseller's retail price
  
  // Calculated margins
  myProfit: number;            // resellerPrice - productCost
  myMarginPercent: number;     // ((resellerPrice - productCost) / productCost) * 100
  resellerProfit?: number;     // finalPrice - resellerPrice (informational)
  
  // Quantity and totals
  quantity: number;
  totalAmount: number;         // resellerPrice * quantity (your revenue)
  
  // Optional end customer (informational)
  endCustomerName?: string;
  endCustomerPhone?: string;
  
  // States
  paymentStatus: PaymentStatus;   // Did reseller pay YOU?
  orderStatus: OrderStatus;       // Delivery to reseller
  operationalStatus: OperationalStatus;
  
  // ... other existing fields
}
```

---

## Phase 3: Hook Updates

### 3.1 Update useSellers.ts

```text
Changes:
- Remove commission from CRUD operations
- Add type field handling
- Add computed stats fetcher (aggregates from sales)
- New function: getResellerStats(resellerId) 
  - Returns: totalPurchased, totalPaid, pendingBalance, salesCount
```

### 3.2 Update useSales.ts

```text
Changes:
- Update addSale to capture reseller pricing:
  - productCost (from product.costPrice at sale time)
  - resellerPrice (from product.wholesalePrice or manual)
  - finalPrice (optional, from product.retailPrice or manual)
- Calculate myProfit = resellerPrice - productCost
- Store frozen values for audit trail
- Update stats calculation to reflect reseller model
```

---

## Phase 4: UI Redesign

### 4.1 Sellers Page (Revendedores)

**Header:**
```
REVENDEDORES
Gestiona tus canales de reventa
```

**List View - Each Card Shows:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  👤 [Name]                                    [Activo/Inactivo] │
│  📱 [Contact]                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ $25,000      │ │ $8,500       │ │ 15 ventas    │            │
│  │ Total        │ │ Pendiente    │ │ Totales      │            │
│  │ comprado     │ │ por pagar    │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  Ultima venta: hace 3 dias                                       │
│                                                                  │
│  [Ver detalle]                              [Edit] [Delete]     │
└─────────────────────────────────────────────────────────────────┘
```

**Detail View (Sheet/Dialog):**
```text
┌─────────────────────────────────────────────────────────────────┐
│  DETALLE DE REVENDEDOR                                          │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  RESUMEN FINANCIERO                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ $25,000      │ │ $16,500      │ │ $8,500       │            │
│  │ Total        │ │ Pagado       │ │ Pendiente    │            │
│  │ comprado     │ │              │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  HISTORIAL DE COMPRAS                                            │
│  ─────────────────────────────────────────────────────────────  │
│  │ Fecha       │ Producto        │ Precio rev. │ Estado      │ │
│  │ 05 Feb 2026 │ iPhone Case     │ $450        │ 🟢 Pagado   │ │
│  │ 02 Feb 2026 │ AirPods Pro     │ $1,800      │ 🟡 Pendiente│ │
│  │ ...                                                         │ │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  NOTAS                                                           │
│  [Strategic notes about this reseller]                           │
└─────────────────────────────────────────────────────────────────┘
```

**Form - Remove Commission Field:**
- Name (required)
- Contact (phone/WhatsApp/email)
- Type: Revendedor | Mayorista | Interno
- Status: Activo | Inactivo
- Notes

### 4.2 Sales Page - New Form Flow

**"Nueva Venta" Form - Redesigned:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  NUEVA VENTA A REVENDEDOR                                       │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  📦 PRODUCTO                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  [Select: Producto *]                                            │
│                                                                  │
│  Al seleccionar, se autocompletara:                              │
│  • Costo real: $XXX (solo admin)                                 │
│  • Precio revendedor sugerido: $XXX                              │
│  • Precio final sugerido: $XXX                                   │
│                                                                  │
│  👤 REVENDEDOR                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  [Select: Revendedor *]                                          │
│                                                                  │
│  💰 PRECIOS                                                      │
│  ─────────────────────────────────────────────────────────────  │
│  Cantidad:        [1]                                            │
│  Precio revendedor: [$XXX] (editable si hubo ajuste)             │
│  Precio final:    [$XXX] (opcional, informativo)                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CALCULO EN TIEMPO REAL                                      ││
│  │ ───────────────────────────────────────────────────────     ││
│  │ Tu costo:           $300                                    ││
│  │ Precio revendedor:  $450                                    ││
│  │ ─────────────────────────────────────                       ││
│  │ TU GANANCIA NETA:   +$150  (50%)  ✅                        ││
│  │                                                             ││
│  │ Ganancia revendedor: $150 (info)                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  📞 CLIENTE FINAL (opcional)                                     │
│  ─────────────────────────────────────────────────────────────  │
│  Nombre: [____________]                                          │
│  Telefono: [____________]                                        │
│                                                                  │
│  📋 ESTADO                                                       │
│  ─────────────────────────────────────────────────────────────  │
│  Estado de pago: [Pendiente / Pagado]                            │
│  Estado pedido:  [Pendiente / En proceso / Entregado]            │
│                                                                  │
│  [Cancelar]                          [Registrar venta]           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Sales Dashboard - Reflects YOUR Business

```text
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD DE VENTAS                                             │
│  Tu flujo de dinero real                                         │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  INGRESOS (lo que recibes de revendedores)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ $45,000    │ │ $12,000    │ │ $33,000    │                   │
│  │ Total      │ │ Pendiente  │ │ Cobrado    │                   │
│  │ vendido    │ │ por cobrar │ │            │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
│                                                                  │
│  RENTABILIDAD (tu negocio real)                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ $28,000    │ │ $17,000    │ │ 60.7%      │                   │
│  │ Costo      │ │ Ganancia   │ │ Margen     │                   │
│  │ total      │ │ neta       │ │ promedio   │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
│                                                                  │
│  SEGUIMIENTO                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ 5          │ │ 2          │ │ 8          │                   │
│  │ Sin        │ │ En riesgo  │ │ Pendiente  │                   │
│  │ confirmar  │ │            │ │ accion     │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Data Relationships

```text
PRODUCT (1) ──────────< SALE (many)
                            │
RESELLER (1) ──────────< SALE (many)
                            │
                      [Each sale captures:]
                      - product_cost (frozen)
                      - reseller_price (frozen)
                      - my_profit (calculated)
                      - payment_status (reseller paid you?)
```

---

## Files to Modify

### Database
| File | Changes |
|------|---------|
| New migration | Add `type` to sellers, add `reseller_price`/`final_price`/`reseller_profit` to sales |

### Types
| File | Changes |
|------|---------|
| `src/types/index.ts` | Update `Seller` (remove commission, add type, add computed stats), Update `Sale` (add reseller pricing fields) |

### Hooks
| File | Changes |
|------|---------|
| `src/hooks/useSellers.ts` | Remove commission handling, add type, add stats aggregation |
| `src/hooks/useSales.ts` | Update to capture reseller pricing, update stats calculation |

### UI Pages
| File | Changes |
|------|---------|
| `src/pages/Sellers.tsx` | Complete redesign - remove commission, show purchase stats, add detail view |
| `src/pages/Sales.tsx` | Update form to focus on reseller sale, show reseller in card, real-time margin calculation |

### Components (if needed)
| File | Changes |
|------|---------|
| New: `ResellerCard.tsx` | Card with stats for reseller list |
| New: `ResellerDetailSheet.tsx` | Detail view with purchase history |

---

## Implementation Order

```text
Step 1: Database migration (add columns)
        ├── Add type to sellers
        ├── Add reseller_price, final_price, reseller_profit to sales
        └── Update Supabase types

Step 2: Update TypeScript types
        ├── Seller interface (remove commission, add type, computed fields)
        └── Sale interface (add reseller pricing)

Step 3: Update hooks
        ├── useSellers.ts (remove commission, add stats)
        └── useSales.ts (reseller pricing logic)

Step 4: Update Sellers page
        ├── Remove commission from form
        ├── Add purchase stats to cards
        └── Add detail view with history

Step 5: Update Sales page
        ├── Update form for reseller model
        ├── Real-time margin calculation
        └── Dashboard reflects your business
```

---

## What This Achieves

1. **Correct Business Model**: System reflects that you sell TO resellers, not through them
2. **Real Profit Tracking**: Your profit = resellerPrice - productCost (not commission)
3. **Reseller Control**: Track who owes you money, not who you owe
4. **Scalable**: Ready for n8n automation (detect pending payments, active resellers)
5. **Clean Data**: Each sale freezes costs/prices at transaction time
6. **Future Ready**: Can later add reseller portals, bulk orders, tiered pricing

---

## What NOT Implemented (n8n Ready)

Structure prepared but no automation yet:
- Detecting pending payments automatically
- Alerting on inactive resellers
- Calculating commissions (deprecated)
- Payment integrations
- Connecting to creatives (already in place)
