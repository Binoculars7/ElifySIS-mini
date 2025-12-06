import { 
  Product, Customer, Employee, Supplier, Sale, Expense, User, UserRole, StockLog, Category, Settings, Notification
} from '../types';

// ==========================================
// MOCK SERVICE IMPLEMENTATION
// Replaces Firebase with LocalStorage for development stability
// ==========================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCollection = <T>(collectionName: string): T[] => {
  const data = localStorage.getItem(`elifysis_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(collectionName: string, data: T[]) => {
  localStorage.setItem(`elifysis_${collectionName}`, JSON.stringify(data));
};

// Seed initial data if empty
const seedData = () => {
    if (!localStorage.getItem('elifysis_users')) {
        const adminUser: User = {
            id: 'admin_1',
            businessId: 'biz_default',
            username: 'Admin User',
            email: 'admin@store.com',
            role: 'ADMIN',
            isActive: true,
            createdAt: Date.now()
        };
        saveCollection('users', [adminUser]);
        
        // Seed default settings
        saveCollection('settings', [{
            businessId: 'biz_default',
            currency: 'USD',
            currencySymbol: '$'
        }]);
    }
};

// Initialize seed data
try {
    if (typeof window !== 'undefined') {
        seedData();
    }
} catch (e) {
    console.warn("Storage not available");
}

const MockService = {
  // --- AUTHENTICATION ---
  login: async (email: string, password: string): Promise<User | null> => {
      await delay(800);
      const users = getCollection<User>('users');
      // Case-insensitive email match
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user && user.isActive) {
          // In mock mode, we accept any password for convenience, or specific ones
          // For security in a real app, this would verify the hash
          return user;
      }
      return null;
  },

  signup: async (user: User): Promise<boolean> => {
      await delay(800);
      const users = getCollection<User>('users');
      if (users.find(u => u.email === user.email)) return false;
      
      const newUser = { ...user, id: `user_${Date.now()}` };
      users.push(newUser);
      saveCollection('users', users);
      
      // Initialize Default Settings
      const settings = getCollection<Settings>('settings');
      settings.push({ businessId: newUser.businessId, currency: 'USD', currencySymbol: '$' });
      saveCollection('settings', settings);

      return true;
  },

  // --- USERS ---
  getUsers: async (businessId: string): Promise<User[]> => {
      await delay(500);
      return getCollection<User>('users').filter(u => u.businessId === businessId);
  },

  saveUser: async (user: User): Promise<void> => {
      await delay(500);
      const users = getCollection<User>('users');
      const idx = users.findIndex(u => u.id === user.id);
      
      const userData = { ...user };
      if (!userData.id) userData.id = `user_${Date.now()}`;

      if (idx >= 0) {
          users[idx] = { ...users[idx], ...userData };
      } else {
          users.push(userData);
      }
      saveCollection('users', users);
  },

  deleteUser: async (id: string): Promise<void> => {
      await delay(500);
      const users = getCollection<User>('users').filter(u => u.id !== id);
      saveCollection('users', users);
  },

  // --- PRODUCTS ---
  getProducts: async (bid: string) => {
      await delay(300);
      return getCollection<Product>('products').filter(p => p.businessId === bid);
  },
  saveProduct: async (p: Product) => {
      await delay(300);
      const list = getCollection<Product>('products');
      if (p.id) {
          const idx = list.findIndex(i => i.id === p.id);
          if (idx >= 0) list[idx] = p;
      } else {
          list.push({ ...p, id: `prod_${Date.now()}` });
      }
      saveCollection('products', list);
  },
  deleteProduct: async (id: string) => {
      await delay(300);
      saveCollection('products', getCollection<Product>('products').filter(p => p.id !== id));
  },
  importProducts: async (products: Product[]) => {
      await delay(1000);
      const list = getCollection<Product>('products');
      products.forEach(p => list.push({ ...p, id: `prod_${Math.random().toString(36).substr(2,9)}` }));
      saveCollection('products', list);
  },

  // --- CATEGORIES ---
  getCategories: async (bid: string) => {
      await delay(200);
      return getCollection<Category>('categories').filter(c => c.businessId === bid);
  },
  saveCategory: async (c: Category) => {
      await delay(200);
      const list = getCollection<Category>('categories');
      if (c.id) {
          const idx = list.findIndex(i => i.id === c.id);
          if (idx >= 0) list[idx] = c;
      } else {
          list.push({ ...c, id: `cat_${Date.now()}` });
      }
      saveCollection('categories', list);
  },
  deleteCategory: async (id: string) => {
       await delay(200);
       saveCollection('categories', getCollection<Category>('categories').filter(c => c.id !== id));
  },

  // --- STOCK LOGS ---
  adjustStock: async (productId: string, qty: number, type: 'restock' | 'adjustment') => {
      await delay(300);
      const products = getCollection<Product>('products');
      const pIdx = products.findIndex(p => p.id === productId);
      
      if (pIdx >= 0) {
          const p = products[pIdx];
          const newQty = (p.quantity || 0) + qty;
          products[pIdx] = { ...p, quantity: newQty };
          saveCollection('products', products);

          const logs = getCollection<StockLog>('stockLogs');
          logs.push({
              id: `log_${Date.now()}`,
              businessId: p.businessId,
              productId,
              productName: p.name,
              change: qty,
              type,
              date: Date.now(),
              balance: newQty
          });
          saveCollection('stockLogs', logs);
      }
  },
  getStockLogs: async (bid: string) => {
      await delay(300);
      return getCollection<StockLog>('stockLogs').filter(l => l.businessId === bid).sort((a,b) => b.date - a.date);
  },

  // --- SALES ---
  createPendingOrder: async (sale: Sale) => {
      await delay(300);
      const sales = getCollection<Sale>('sales');
      sales.push({ ...sale, id: `sale_${Date.now()}`, status: 'Pending' });
      saveCollection('sales', sales);
  },
  getPendingOrders: async (bid: string) => {
      await delay(300);
      return getCollection<Sale>('sales').filter(s => s.businessId === bid && s.status === 'Pending');
  },
  completeOrder: async (saleId: string, paymentMethod: 'Cash'|'Card'|'Transfer') => {
      await delay(500);
      const sales = getCollection<Sale>('sales');
      const sIdx = sales.findIndex(s => s.id === saleId);
      
      if (sIdx >= 0) {
          const sale = sales[sIdx];
          sale.status = 'Completed';
          sale.paymentMethod = paymentMethod;
          saveCollection('sales', sales);

          // Update Stock
          const products = getCollection<Product>('products');
          const logs = getCollection<StockLog>('stockLogs');

          sale.items.forEach(item => {
              const pIdx = products.findIndex(p => p.id === item.productId);
              if (pIdx >= 0) {
                  const p = products[pIdx];
                  const currentQty = p.quantity || 0;
                  const newQty = currentQty - item.quantity;
                  p.quantity = newQty;
                  
                  logs.push({
                    id: `log_${Date.now()}_${Math.random()}`,
                    businessId: sale.businessId,
                    productId: item.productId,
                    productName: item.productName,
                    change: -item.quantity,
                    type: 'sale',
                    date: Date.now(),
                    balance: newQty
                  });
              }
          });
          saveCollection('products', products);
          saveCollection('stockLogs', logs);
      }
  },
  getSales: async (bid: string) => {
      await delay(300);
      return getCollection<Sale>('sales').filter(s => s.businessId === bid && s.status === 'Completed');
  },

  // --- PEOPLE (Customers/Employees/Suppliers) ---
  getCustomers: async (bid: string) => {
      await delay(200);
      return getCollection<Customer>('customers').filter(c => c.businessId === bid);
  },
  saveCustomer: async (c: Customer) => {
      await delay(200);
      const list = getCollection<Customer>('customers');
      if (c.id) {
          const idx = list.findIndex(i => i.id === c.id);
          if (idx >= 0) list[idx] = c;
      } else {
          list.push({ ...c, id: `cust_${Date.now()}` });
      }
      saveCollection('customers', list);
  },
  deleteCustomer: async (id: string) => {
      await delay(200);
      saveCollection('customers', getCollection<Customer>('customers').filter(c => c.id !== id));
  },

  getEmployees: async (bid: string) => {
      await delay(200);
      return getCollection<Employee>('employees').filter(e => e.businessId === bid);
  },
  saveEmployee: async (e: Employee) => {
      await delay(200);
      const list = getCollection<Employee>('employees');
      if (e.id) {
          const idx = list.findIndex(i => i.id === e.id);
          if (idx >= 0) list[idx] = e;
      } else {
          list.push({ ...e, id: `emp_${Date.now()}` });
      }
      saveCollection('employees', list);
  },
  deleteEmployee: async (id: string) => {
      await delay(200);
      saveCollection('employees', getCollection<Employee>('employees').filter(e => e.id !== id));
  },

  getSuppliers: async (bid: string) => {
      await delay(200);
      return getCollection<Supplier>('suppliers').filter(s => s.businessId === bid);
  },
  saveSupplier: async (s: Supplier) => {
      await delay(200);
      const list = getCollection<Supplier>('suppliers');
      if (s.id) {
          const idx = list.findIndex(i => i.id === s.id);
          if (idx >= 0) list[idx] = s;
      } else {
          list.push({ ...s, id: `sup_${Date.now()}` });
      }
      saveCollection('suppliers', list);
  },
  deleteSupplier: async (id: string) => {
      await delay(200);
      saveCollection('suppliers', getCollection<Supplier>('suppliers').filter(s => s.id !== id));
  },

  // --- EXPENSES ---
  getExpenses: async (bid: string) => {
      await delay(200);
      return getCollection<Expense>('expenses').filter(e => e.businessId === bid);
  },
  addExpense: async (e: Expense) => {
      await delay(200);
      const list = getCollection<Expense>('expenses');
      list.push({ ...e, id: `exp_${Date.now()}` });
      saveCollection('expenses', list);
  },
  deleteExpense: async (id: string) => {
      await delay(200);
      saveCollection('expenses', getCollection<Expense>('expenses').filter(e => e.id !== id));
  },

  // --- DASHBOARD STATS ---
  getDashboardStats: async (bid: string) => {
      await delay(500);
      const products = getCollection<Product>('products').filter(p => p.businessId === bid);
      const customers = getCollection<Customer>('customers').filter(c => c.businessId === bid);
      const sales = getCollection<Sale>('sales').filter(s => s.businessId === bid && s.status === 'Completed');
      const expenses = getCollection<Expense>('expenses').filter(e => e.businessId === bid);

      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
          productCount: products.length,
          customerCount: customers.length,
          saleCount: sales.length,
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          lowStockCount: products.filter(p => p.quantity < 10).length
      };
  },

  // --- SETTINGS ---
  getSettings: async (bid: string): Promise<Settings> => {
      await delay(100);
      const settings = getCollection<Settings>('settings').find(s => s.businessId === bid);
      return settings || { businessId: bid, currency: 'USD', currencySymbol: '$' };
  },
  saveSettings: async (s: Settings) => {
      await delay(200);
      const list = getCollection<Settings>('settings');
      const idx = list.findIndex(item => item.businessId === s.businessId);
      if (idx >= 0) list[idx] = s;
      else list.push(s);
      saveCollection('settings', list);
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (bid: string) => {
      await delay(100);
      return getCollection<Notification>('notifications').filter(n => n.businessId === bid);
  },
  saveNotification: async (n: Notification) => {
      const list = getCollection<Notification>('notifications');
      list.push(n);
      saveCollection('notifications', list);
  },
  markNotificationRead: async (id: string) => {
      const list = getCollection<Notification>('notifications');
      const idx = list.findIndex(n => n.id === id);
      if (idx >= 0) {
          list[idx].read = true;
          saveCollection('notifications', list);
      }
  }
};

export const Api = MockService;