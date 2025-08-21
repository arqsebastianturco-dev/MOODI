export enum UserRole {
  Admin = 'admin',
  Ventas = 'ventas',
  Taller = 'taller'
}

export enum QuoteStatus {
  Pendiente = 'Pendiente',
  Aprobado = 'Aprobado',
  Rechazado = 'Rechazado'
}

export enum ReceiptStatus {
  Active = 'Active',
  Annulled = 'Annulled',
}

export interface User {
  username: string;
  password?: string;
  role: UserRole;
}

export interface Material {
  id: string;
  code: string;
  description: string;
  type: string;
  unit: string; // e.g., m², ml, u
  price: number; // Price per unit, calculated
  lastUpdated: string;
  commercialUnit: string; // e.g., placa, rollo, caja
  commercialPrice: number; // Price per commercial unit
  unitsPerCommercialUnit: number; // e.g., 5.03 m² per placa
  imageUrl: string | null;
  brochureUrl: string | null;
  brochureFilename: string | null;
}

export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  code: string;
  type: string;
  cost: number;
  laborPercent: number;
  imageUrl: string | null;
  planPdfUrl: string | null;
  planPdfFilename: string | null;
  showInCatalogue: boolean;
  materials: ProductMaterial[];
}

export interface QuoteItem {
  productId: string;
  name: string;
  quantity: number;
  originalPrice: number;
  discountPercent: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quote {
  id: number;
  date: string;
  client: string;
  clientPhone?: string;
  clientEmail?: string;
  validity: string;
  items: QuoteItem[];
  subtotal: number;
  commissionPercent: number;
  ivaPercent: number;
  total: number;
  status: QuoteStatus;
  estimatedDeliveryDate: string | null;
  approvalDate: string | null;
  notes?: string;
}

export interface Settings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
}

export interface CurrentQuote {
  items: QuoteItem[];
  ivaPercent: number;
}

export interface Voucher {
  id: string;
  quoteId: number;
  description: string;
  amount: number;
  fileUrl: string; // Data URL
  fileName: string;
  date: string;
}

export interface Receipt {
  id: string;
  quoteId: number;
  receiptNumber: number;
  date: string;
  amount: number;
  status: ReceiptStatus;
  annulmentDate?: string;
  annulmentReason?: string;
}