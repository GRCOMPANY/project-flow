export type Priority = 'alta' | 'media' | 'baja';
export type Status = 'pendiente' | 'en_progreso' | 'terminada';
export type Role = 'admin' | 'colaborador';
export type ProductStatus = 'activo' | 'pausado' | 'agotado';
export type SellerStatus = 'activo' | 'inactivo';
export type PaymentStatus = 'pendiente' | 'pagado';
export type OrderStatus = 'pendiente' | 'en_progreso' | 'entregado';

// Estados operativos de venta (ciclo post-venta)
export type OperationalStatus = 
  | 'nuevo'
  | 'contactado'
  | 'confirmado'
  | 'sin_respuesta'
  | 'en_ruta'
  | 'entregado'
  | 'riesgo_devolucion';
export type SalesChannel = 'marketplace' | 'whatsapp' | 'instagram' | 'tiktok' | 'otro';

// Product types
export type ProductChannel = 'whatsapp' | 'marketplace' | 'instagram' | 'tiktok' | 'otro';
export type DeliveryType = 'contra_entrega' | 'anticipado';
export type MarginLevel = 'alto' | 'medio' | 'bajo';

// Creative types
export type CreativeType = 'imagen' | 'video' | 'copy' | 'historia' | 'carrusel' | 'anuncio';
export type CreativeChannel = 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'web' | 'marketplace';
export type CreativeObjective = 'vender' | 'atraer' | 'probar';
export type CreativeStatus = 'pendiente' | 'generando' | 'generado' | 'publicado' | 'descartado';
export type CreativeResult = 'sin_evaluar' | 'funciono' | 'no_funciono';

// Automation Status for n8n
export type AutomationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  assignedTo?: string;
  assignedUser?: Profile;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: Role;
}

// Extended Product for GRC
export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  status: ProductStatus;
  
  // Precios
  costPrice: number;          // Solo admin (supplier_price en DB)
  wholesalePrice: number;     // Vendedores + admin
  retailPrice: number;        // Público (suggested_price en DB)
  
  // Márgenes (calculados)
  marginAmount?: number;      // retailPrice - costPrice
  marginPercent?: number;     // porcentaje de margen
  marginLevel?: MarginLevel;  // alto / medio / bajo
  
  // Automatización
  mainChannel?: ProductChannel;
  deliveryType?: DeliveryType;
  isFeatured: boolean;
  autoPromote: boolean;
  
  // Contenido
  imageUrl?: string;
  description?: string;
  internalNotes?: string;  // Solo admin
  
  // Relaciones
  supplierId?: string;
  supplier?: Supplier;
  
  // Legacy - mantener compatibilidad
  price: number;
  storeName?: string;
  supplierPrice: number;
  suggestedPrice: number;
  
  createdAt: string;
  updatedAt: string;
}

// Product con métricas calculadas (Smart Product)
export interface ProductWithMetrics extends Product {
  salesLast7Days: number;
  salesLast30Days: number;
  revenueGenerated: number;
  pendingToCollect: number;
  creativesCount: number;
  needsCreatives: boolean;
  lastCreativeDate?: string;
  priorityScore: Priority;
  recommendedAction?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  conditions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Reseller types (wholesale model)
export type ResellerType = 'revendedor' | 'mayorista' | 'interno';

export interface Seller {
  id: string;
  name: string;
  contact?: string;
  type?: ResellerType;        // revendedor, mayorista, interno
  status: SellerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // DEPRECATED: commission is no longer used in reseller model
  commission?: number;        // Legacy field - ignored
  
  // Computed stats (from sales aggregation)
  totalPurchased?: number;    // Sum of all sales to this reseller
  totalPaid?: number;         // Sum of paid sales
  pendingBalance?: number;    // totalPurchased - totalPaid
  lastSaleDate?: string;      // Most recent sale
  salesCount?: number;        // Number of transactions
}

export interface Sale {
  id: string;
  productId: string;
  product?: Product;
  sellerId?: string;
  seller?: Seller;
  clientName?: string;
  clientPhone?: string;
  salesChannel?: SalesChannel;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  saleDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Congelado Financiero (Fase 1)
  costAtSale?: number;           // Costo del producto al momento de la venta
  marginAtSale?: number;         // Margen calculado y congelado
  marginPercentAtSale?: number;  // Porcentaje de margen congelado
  relatedCreativeId?: string;    // Creativo que originó la venta
  
  // Seguimiento operativo (Fase 2)
  operationalStatus: OperationalStatus;
  statusUpdatedAt?: string;
}

// ====================================
// CREATIVE INTELLIGENCE SYSTEM
// ====================================

// Bloque A: Target Audience
export type TargetAudience = 
  | 'precio_bajo' 
  | 'precio_medio' 
  | 'regalo' 
  | 'uso_personal' 
  | 'reventa' 
  | 'otro';

// Bloque B: Hook Types
export type HookType = 
  | 'precio' 
  | 'problema' 
  | 'beneficio' 
  | 'urgencia' 
  | 'prueba_social' 
  | 'comparacion';

export type MessageApproach = 
  | 'emocional' 
  | 'racional' 
  | 'promocional' 
  | 'educativo';

// Bloque C: Metrics
export type KnownPeople = 'si' | 'no' | 'mixto';
export type EngagementLevel = 'bajo' | 'medio' | 'alto';

// Bloque D: Performance Result
export type CreativePerformance = 'frio' | 'interesante' | 'caliente';

// Bloque E: Comparison
export type ComparisonResult = 'mejor' | 'peor' | 'igual';

// Automation Intent for n8n
export type AutomationIntent = 
  | 'generate_new' 
  | 'repeat' 
  | 'new_audience' 
  | 'send_sellers' 
  | 'landing';

// Base Creative Interface
export interface Creative {
  id: string;
  productId?: string;
  product?: Product;
  type: CreativeType;
  channel: CreativeChannel;
  objective: CreativeObjective;
  status: CreativeStatus;
  result: CreativeResult;
  title?: string;
  copy?: string;
  imageUrl?: string;
  videoUrl?: string;
  script?: string;
  learning?: string;
  aiPrompt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Bloque A: Context Extended
  targetAudience?: TargetAudience;
  audienceNotes?: string;
  
  // Bloque B: Hook / Message
  hookType?: HookType;
  hookText?: string;
  variation?: string;
  messageApproach?: MessageApproach;
  
  // Bloque C: Performance Metrics - Organic
  metricLikes?: number;
  metricComments?: number;
  metricMessages?: number;
  metricKnownPeople?: KnownPeople;
  metricSales?: number;
  
  // Bloque C: Performance Metrics - Meta Ads
  metricImpressions?: number;
  metricClicks?: number;
  metricCost?: number;
  
  // Engagement
  engagementLevel?: EngagementLevel;
  
  // Bloque E: Comparison
  vsPrevious?: ComparisonResult;
  vsPreviousId?: string;
  whatChanged?: string;
  
  // Automation
  automationIntent?: AutomationIntent;
  automationStatus?: AutomationStatus;
}

// Automation Intent record for n8n
export interface AutomationIntentRecord {
  id: string;
  creativeId: string;
  productId?: string;
  intentType: AutomationIntent;
  status: AutomationStatus;
  metadata: Record<string, unknown>;
  triggeredBy?: string;
  triggeredAt: string;
  completedAt?: string;
  resultNotes?: string;
  createdAt: string;
}

// Extended Creative with calculated fields
export interface CreativeIntelligence extends Creative {
  // Calculated performance
  calculatedPerformance: CreativePerformance;
  
  // Previous creative reference
  previousCreative?: Creative;
  
  // Calculated metrics
  messagesDelta?: number;
  salesDelta?: number;
}

// ====================================
// OPERATIONAL TASK SYSTEM (Módulo Definitivo)
// ====================================

// Estados de tarea reales para operación
export type TaskStatus = 
  | 'pendiente' 
  | 'en_progreso' 
  | 'esperando_respuesta'
  | 'programada'
  | 'completada'
  | 'cancelada'
  | 'resuelta_automaticamente';

// Tipos por impacto operativo
export type TaskType = 
  | 'cobro' 
  | 'seguimiento_venta' 
  | 'creativo' 
  | 'operacion' 
  | 'estrategia';

// Impacto económico
export type TaskImpact = 'dinero' | 'crecimiento' | 'operacion';

// Origen de la tarea
export type TaskSource = 'manual' | 'automatic' | 'ai_suggested' | 'external';

// Tarea operativa completa del sistema
export interface OperationalTask {
  id: string;
  
  // Identificación
  name: string;
  description?: string;
  type: TaskType;
  
  // Estado y prioridad
  status: TaskStatus;
  priority: Priority;
  
  // Contexto operativo (CRÍTICO)
  triggerReason: string;    // "Existe porque..."
  consequence?: string;      // "Si no actúas..."
  impact: TaskImpact;
  
  // Acción
  actionLabel: string;
  actionPath?: string;
  
  // Relaciones
  relatedSaleId?: string;
  relatedSale?: Sale;
  relatedProductId?: string;
  relatedProduct?: Product;
  relatedCreativeId?: string;
  relatedCreative?: Creative;
  
  // Origen y deduplicación
  source: TaskSource;
  dedupKey?: string;
  
  // Resolución
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  // Programación
  dueDate?: string;
  assignedTo?: string;
  assignedUser?: Profile;
  
  // Metadata
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  
  // Outcome (si la tarea fue cerrada)
  outcome?: TaskOutcome;
}

// Input para crear tarea manual
export interface CreateTaskInput {
  name: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  impact: TaskImpact;
  triggerReason: string;
  consequence?: string;
  actionLabel: string;
  actionPath?: string;
  relatedSaleId?: string;
  relatedProductId?: string;
  relatedCreativeId?: string;
  dueDate?: string;
  assignedTo?: string;
}

// Legacy SmartTask (mantener compatibilidad temporal)
export interface SmartTask {
  id: string;
  type: 'cobro' | 'creativo' | 'promocion' | 'actualizacion' | 'seguimiento';
  title: string;
  description: string;
  impact: 'ventas' | 'cobro' | 'crecimiento';
  priority: Priority;
  relatedSaleId?: string;
  relatedProductId?: string;
  relatedCreativeId?: string;
  actionLabel: string;
  actionPath?: string;
}

// ====================================
// TASK OUTCOME SYSTEM (Cierre de Ciclo)
// ====================================

// Resultado del cierre de tarea
export type TaskOutcomeResult = 'exitoso' | 'fallido' | 'reprogramado' | 'cancelado';

// Registro de resultado de tarea
export interface TaskOutcome {
  id: string;
  taskId: string;
  result: TaskOutcomeResult;
  generatedIncome: boolean;
  incomeAmount: number;
  notes?: string;
  completedBy?: string;
  completedAt: string;
  createdAt: string;
}

// Input para crear outcome
export interface CreateTaskOutcomeInput {
  taskId: string;
  result: TaskOutcomeResult;
  generatedIncome: boolean;
  incomeAmount?: number;
  notes?: string;
}

// Dashboard KPIs
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingAmount: number;
  activeProducts: number;
  pendingCreatives: number;
  publishedCreatives: number;
}

// Business Summary
export interface BusinessSummary {
  salesThisMonth: number;
  revenueThisMonth: number;
  pendingCollections: number;
  pendingCollectionAmount: number;
  activeProducts: number;
  featuredProducts: number;
  creativesTotal: number;
  creativesPending: number;
  creativesPublished: number;
}

// Outcome Stats
export interface OutcomeStats {
  completedToday: number;
  withIncome: number;
  totalRecovered: number;
}
