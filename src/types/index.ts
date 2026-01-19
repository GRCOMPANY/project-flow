export type Priority = 'alta' | 'media' | 'baja';
export type Status = 'pendiente' | 'en_progreso' | 'terminada';
export type Role = 'admin' | 'colaborador';
export type ProductStatus = 'activo' | 'pausado' | 'agotado';
export type SellerStatus = 'activo' | 'inactivo';
export type PaymentStatus = 'pendiente' | 'pagado';

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
  price: number;
  storeName?: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // New GRC fields
  supplierId?: string;
  supplier?: Supplier;
  supplierPrice: number;
  suggestedPrice: number;
  status: ProductStatus;
  isFeatured: boolean;
  category?: string;
  internalNotes?: string;
  sku?: string;
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

export interface Seller {
  id: string;
  name: string;
  contact?: string;
  commission: number;
  status: SellerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  productId?: string;
  product?: Product;
  sellerId?: string;
  seller?: Seller;
  clientName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  saleDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard KPIs
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingAmount: number;
  topProducts: { product: Product; totalSold: number; revenue: number }[];
  topSellers: { seller: Seller; totalSales: number; revenue: number }[];
  productsByMargin: { product: Product; margin: number }[];
}
