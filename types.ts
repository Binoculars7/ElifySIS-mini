
export type UserRole = 'ADMIN' | 'CASHIER' | 'MANAGER' | 'SALES';

export interface User {
  id: string;
  businessId: string;
  username: string;
  email: string;
  password?: string; // For mock auth
  role: UserRole;
  isActive: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
}

export interface ExpenseCategory {
  id: string;
  businessId: string;
  name: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  category: string;
  supplierId: string;
  lastUpdated: number;
}

export interface Customer {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  createdAt: number;
}

export interface Employee {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  jobRole: string;
  hiredDate: string;
  address: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address: string;
  createdAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number; // Unit sell price
  total: number;
}

export interface Sale {
  id: string;
  businessId: string;
  ticketId: string; // The auto-generated Customer/Order ID
  customerId?: string; // Optional real registered customer
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  date: number;
  paymentMethod?: 'Cash' | 'Card' | 'Transfer';
  status: 'Completed' | 'Pending';
}

export interface Expense {
  id: string;
  businessId: string;
  name: string;
  amount: number;
  date: number;
  category: string;
}

export interface StockLog {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  change: number;
  type: 'sale' | 'restock' | 'adjustment';
  date: number;
  balance: number;
}

export interface Settings {
  businessId: string;
  currency: string;
  currencySymbol: string; // Optional helper, mainly relying on Intl format
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: number;
}