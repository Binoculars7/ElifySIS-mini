import { 
  Product, Customer, Employee, Supplier, Sale, Expense, User, UserRole, StockLog, Category, Settings, Notification
} from '../types';

// ==========================================
// CONFIGURATION
// ==========================================

const USE_FIREBASE = false;

// ==========================================
// LOCAL STORAGE MOCK SERVICE
// ==========================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

const setStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Seed Data
const seedData = () => {
  if (USE_FIREBASE) return;
  const DEFAULT_BIZ = 'default_biz';
  
  if (!localStorage.getItem('products')) {
    const products: Product[] = [
      { id: 'p1', businessId: DEFAULT_BIZ, name: 'Fresh Milk 1L', description: 'Whole milk', quantity: 50, buyPrice: 1.50, sellPrice: 2.50, category: 'Dairy', supplierId: 's1', lastUpdated: Date.now() },
      { id: 'p2', businessId: DEFAULT_BIZ, name: 'Whole Wheat Bread', description: 'Sliced bread', quantity: 8, buyPrice: 1.00, sellPrice: 2.20, category: 'Bakery', supplierId: 's1', lastUpdated: Date.now() },
      { id: 'p3', businessId: DEFAULT_BIZ, name: 'Coca Cola 500ml', description: 'Soda', quantity: 100, buyPrice: 0.80, sellPrice: 1.50, category: 'Beverages', supplierId: 's2', lastUpdated: Date.now() },
      { id: 'p4', businessId: DEFAULT_BIZ, name: 'Apple Red Delicious', description: 'Fresh', quantity: 120, buyPrice: 0.50, sellPrice: 1.00, category: 'Produce', supplierId: 's1', lastUpdated: Date.now() },
      { id: 'p5', businessId: DEFAULT_BIZ, name: 'Orange Juice 1L', description: '100% Juice', quantity: 40, buyPrice: 2.00, sellPrice: 3.50, category: 'Beverages', supplierId: 's2', lastUpdated: Date.now() },
      ...Array.from({ length: 25 }).map((_, i) => ({
          id: `gen_${i}`,
          businessId: DEFAULT_BIZ,
          name: `Generic Product ${i + 1}`,
          description: 'General Item',
          quantity: 50,
          buyPrice: 5,
          sellPrice: 10,
          category: 'General',
          supplierId: 's1',
          lastUpdated: Date.now()
      }))
    ];
    setStorage('products', products);
  }
  if (!localStorage.getItem('users')) {
    setStorage('users', [
      { id: 'u1', businessId: DEFAULT_BIZ, username: 'admin', email: 'admin@store.com', password: 'password', role: 'ADMIN', isActive: true, createdAt: Date.now() }
    ]);
  }
  if (!localStorage.getItem('customers')) {
    setStorage('customers', [{ id: 'c1', businessId: DEFAULT_BIZ, firstName: 'John', lastName: 'Doe', phone: '555-9999', address: 'Main St', createdAt: Date.now() }]);
  }
  if (!localStorage.getItem('categories')) {
    setStorage('categories', [
        { id: 'cat1', businessId: DEFAULT_BIZ, name: 'Dairy' },
        { id: 'cat2', businessId: DEFAULT_BIZ, name: 'Bakery' },
        { id: 'cat3', businessId: DEFAULT_BIZ, name: 'Beverages' },
        { id: 'cat4', businessId: DEFAULT_BIZ, name: 'Produce' },
        { id: 'cat5', businessId: DEFAULT_BIZ, name: 'General' },
        { id: 'cat6', businessId: DEFAULT_BIZ, name: 'Snacks' },
        { id: 'cat7', businessId: DEFAULT_BIZ, name: 'Household' }
    ]);
  }
  if (!localStorage.getItem('suppliers')) {
    setStorage('suppliers', [
        { id: 's1', businessId: DEFAULT_BIZ, name: 'Global Foods Inc', phone: '123-456-7890', address: '123 Warehouse Dr', createdAt: Date.now() },
        { id: 's2', businessId: DEFAULT_BIZ, name: 'BevCo Ltd', phone: '987-654-3210', address: '456 Soda Ln', createdAt: Date.now() }
    ]);
  }
};

const MockService = {
  // Settings
  getSettings: async (businessId: string): Promise<Settings> => {
      const allSettings = getStorage<Settings>('settings');
      const found = allSettings.find(s => s.businessId === businessId);
      return found || { businessId, currency: 'USD', currencySymbol: '$' };
  },
  saveSettings: async (settings: Settings): Promise<void> => {
      const list = getStorage<Settings>('settings');
      const idx = list.findIndex(s => s.businessId === settings.businessId);
      if (idx >= 0) list[idx] = settings;
      else list.push(settings);
      setStorage('settings', list);
  },

  // Notifications
  getNotifications: async (businessId: string): Promise<Notification[]> => {
      return getStorage<Notification>('notifications').filter(n => n.businessId === businessId);
  },
  saveNotification: async (notif: Notification): Promise<void> => {
      const list = getStorage<Notification>('notifications');
      list.push(notif);
      setStorage('notifications', list);
  },
  markNotificationRead: async (id: string): Promise<void> => {
      const list = getStorage<Notification>('notifications');
      const idx = list.findIndex(n => n.id === id);
      if(idx >= 0) {
          list[idx].read = true;
          setStorage('notifications', list);
      }
  },

  // Products
  getProducts: async (businessId: string): Promise<Product[]> => { 
      await delay(200); 
      return getStorage<Product>('products').filter(p => p.businessId === businessId); 
  },
  saveProduct: async (item: Product): Promise<void> => {
    await delay(200);
    const list = getStorage<Product>('products');
    if (item.id) {
        const idx = list.findIndex(p => p.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
    } else {
        list.push({ ...item, id: Math.random().toString(36).substr(2, 9) });
    }
    setStorage('products', list);
  },
  importProducts: async (products: Product[]): Promise<void> => {
    await delay(500);
    const list = getStorage<Product>('products');
    products.forEach(p => {
        list.push({ ...p, id: Math.random().toString(36).substr(2, 9), lastUpdated: Date.now() });
    });
    setStorage('products', list);
  },
  deleteProduct: async (id: string): Promise<void> => {
    setStorage('products', getStorage<Product>('products').filter(p => p.id !== id));
  },

  // Categories
  getCategories: async (businessId: string): Promise<Category[]> => { 
      await delay(100); 
      return getStorage<Category>('categories').filter(c => c.businessId === businessId); 
  },
  saveCategory: async (cat: Category): Promise<void> => {
      const list = getStorage<Category>('categories');
      if(cat.id) {
          const idx = list.findIndex(c => c.id === cat.id);
          if(idx >= 0) list[idx] = cat;
          else list.push(cat);
      } else {
          list.push({ ...cat, id: Math.random().toString(36).substr(2,9) });
      }
      setStorage('categories', list);
  },
  deleteCategory: async (id: string): Promise<void> => {
      setStorage('categories', getStorage<Category>('categories').filter(c => c.id !== id));
  },

  // Stock
  adjustStock: async (productId: string, qty: number, type: 'restock' | 'adjustment'): Promise<void> => {
    const products = getStorage<Product>('products');
    const p = products.find(x => x.id === productId);
    if(p) {
        p.quantity += qty;
        p.lastUpdated = Date.now();
        setStorage('products', products);
        
        const logs = getStorage<StockLog>('stockLogs') || [];
        logs.push({
            id: Math.random().toString(36).substr(2,9),
            businessId: p.businessId,
            productId, productName: p.name, change: qty, type: type, date: Date.now(), balance: p.quantity
        });
        setStorage('stockLogs', logs);
    }
  },
  getStockLogs: async (businessId: string): Promise<StockLog[]> => {
      return (getStorage<StockLog>('stockLogs') || []).filter(l => l.businessId === businessId);
  },

  // Sales
  createPendingOrder: async (sale: Sale): Promise<void> => {
    await delay(200);
    const sales = getStorage<Sale>('sales') || [];
    sales.push({ ...sale, id: Math.random().toString(36).substr(2, 9), status: 'Pending' });
    setStorage('sales', sales);
  },

  getPendingOrders: async (businessId: string): Promise<Sale[]> => {
    await delay(200);
    const sales = getStorage<Sale>('sales') || [];
    return sales.filter(s => s.businessId === businessId && s.status === 'Pending').sort((a,b) => b.date - a.date);
  },

  completeOrder: async (saleId: string, paymentMethod: 'Cash' | 'Card' | 'Transfer'): Promise<void> => {
    await delay(300);
    const sales = getStorage<Sale>('sales');
    const saleIndex = sales.findIndex(s => s.id === saleId);
    
    if (saleIndex > -1) {
        const sale = sales[saleIndex];
        sale.status = 'Completed';
        sale.paymentMethod = paymentMethod;
        setStorage('sales', sales);

        const products = getStorage<Product>('products');
        const logs = getStorage<StockLog>('stockLogs') || [];
        
        sale.items.forEach(item => {
            const p = products.find(x => x.id === item.productId);
            if(p) {
                p.quantity -= item.quantity;
                logs.push({
                    id: Math.random().toString(36).substr(2,9),
                    businessId: sale.businessId,
                    productId: p.id, productName: p.name, change: -item.quantity, type: 'sale', date: Date.now(), balance: p.quantity
                });
            }
        });
        setStorage('products', products);
        setStorage('stockLogs', logs);
    }
  },

  getSales: async (businessId: string): Promise<Sale[]> => { 
      await delay(200); 
      return (getStorage<Sale>('sales') || []).filter(s => s.businessId === businessId && s.status === 'Completed'); 
  },

  // Users
  login: async (email: string, password: string): Promise<User | null> => {
    await delay(500);
    const users = getStorage<User>('users');
    const user = users.find(u => u.email === email && u.password === password);
    return user && user.isActive ? user : null;
  },

  signup: async (user: User): Promise<boolean> => {
    await delay(500);
    const users = getStorage<User>('users');
    if (users.find(u => u.email === user.email)) return false; 
    users.push(user);
    setStorage('users', users);
    return true;
  },

  getUsers: async (businessId: string): Promise<User[]> => { 
      await delay(200); 
      return getStorage<User>('users').filter(u => u.businessId === businessId); 
  },
  saveUser: async (user: User): Promise<void> => {
      const list = getStorage<User>('users');
      const existingUser = list.find(u => u.email === user.email);
      if (existingUser && existingUser.id !== user.id) {
          throw new Error("Email already exists in the system.");
      }

      if (user.id) {
          const idx = list.findIndex(u => u.id === user.id);
          if(idx >= 0) list[idx] = user;
          else list.push(user);
      } else {
          list.push({...user, id: Math.random().toString(36).substr(2,9), createdAt: Date.now()});
      }
      setStorage('users', list);
  },
  deleteUser: async (id: string): Promise<void> => {
      setStorage('users', getStorage<User>('users').filter(u => u.id !== id));
  },

  // People & Suppliers
  getCustomers: async (businessId: string): Promise<Customer[]> => getStorage<Customer>('customers').filter(c => c.businessId === businessId),
  saveCustomer: async (c: Customer) => { 
      const list = getStorage<Customer>('customers');
      if(c.id) {
          const idx = list.findIndex(x=>x.id===c.id);
          if(idx >= 0) list[idx] = c;
          else list.push(c);
      } else {
          list.push({...c, id: Math.random().toString(36).substr(2,9), createdAt: Date.now()});
      }
      setStorage('customers', list);
  },
  deleteCustomer: async (id: string): Promise<void> => {
      setStorage('customers', getStorage<Customer>('customers').filter(c => c.id !== id));
  },

  getEmployees: async (businessId: string): Promise<Employee[]> => getStorage<Employee>('employees').filter(e => e.businessId === businessId),
  saveEmployee: async (e: Employee) => {
      const list = getStorage<Employee>('employees');
      if(e.id) {
          const idx = list.findIndex(x=>x.id===e.id);
          if(idx >= 0) list[idx] = e;
          else list.push(e);
      } else {
          list.push({...e, id: Math.random().toString(36).substr(2,9), createdAt: Date.now()});
      }
      setStorage('employees', list);
  },
  deleteEmployee: async (id: string): Promise<void> => {
      setStorage('employees', getStorage<Employee>('employees').filter(e => e.id !== id));
  },

  getSuppliers: async (businessId: string): Promise<Supplier[]> => getStorage<Supplier>('suppliers').filter(s => s.businessId === businessId),
  saveSupplier: async (s: Supplier) => {
      const list = getStorage<Supplier>('suppliers');
      if(s.id) {
          const idx = list.findIndex(x=>x.id===s.id);
          if(idx >= 0) list[idx] = s;
          else list.push(s);
      } else {
          list.push({...s, id: Math.random().toString(36).substr(2,9), createdAt: Date.now()});
      }
      setStorage('suppliers', list);
  },
  deleteSupplier: async (id: string): Promise<void> => {
    setStorage('suppliers', getStorage<Supplier>('suppliers').filter(s => s.id !== id));
  },

  getExpenses: async (businessId: string): Promise<Expense[]> => getStorage<Expense>('expenses').filter(e => e.businessId === businessId),
  addExpense: async (e: Expense) => {
      const list = getStorage<Expense>('expenses');
      list.push({...e, id: Math.random().toString(36).substr(2,9)});
      setStorage('expenses', list);
  },
  deleteExpense: async (id: string): Promise<void> => {
      setStorage('expenses', getStorage<Expense>('expenses').filter(e => e.id !== id));
  },

  getDashboardStats: async (businessId: string) => {
      const p = getStorage<Product>('products').filter(x => x.businessId === businessId);
      const c = getStorage<Customer>('customers').filter(x => x.businessId === businessId);
      const s = getStorage<Sale>('sales').filter(x => x.businessId === businessId && x.status === 'Completed');
      const e = getStorage<Expense>('expenses').filter(x => x.businessId === businessId);
      
      const lowStockCount = p.filter(prod => prod.quantity < 10).length;
      
      const totalRevenue = s.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const totalExpenses = e.reduce((acc, curr) => acc + curr.amount, 0);
      return { 
          customerCount: c.length, 
          productCount: p.length, 
          saleCount: s.length, 
          totalRevenue, 
          totalExpenses, 
          netProfit: totalRevenue - totalExpenses,
          lowStockCount
      };
  }
};

const FirebaseService = {
  getProducts: async (bid: string) => [] as Product[],
  saveProduct: async (item: Product) => {},
  importProducts: async (products: Product[]) => {},
  deleteProduct: async (id: string) => {},
  getCategories: async (bid: string) => [] as Category[],
  saveCategory: async (cat: Category) => {},
  deleteCategory: async (id: string) => {},
  adjustStock: async (productId: string, qty: number, type: string) => {},
  getStockLogs: async (bid: string) => [] as StockLog[],
  createPendingOrder: async (sale: Sale) => {},
  getPendingOrders: async (bid: string) => [] as Sale[],
  completeOrder: async (saleId: string, paymentMethod: string) => {},
  getSales: async (bid: string) => [] as Sale[],
  login: async (e: string, p: string) => null, 
  signup: async (user: User) => false, 
  getUsers: async (bid: string) => [] as User[],
  saveUser: async (user: User) => {},
  deleteUser: async (id: string) => {},
  getCustomers: async (bid: string) => [] as Customer[],
  saveCustomer: async (c: Customer) => {},
  deleteCustomer: async (id: string) => {},
  getEmployees: async (bid: string) => [] as Employee[],
  saveEmployee: async (e: Employee) => {},
  deleteEmployee: async (id: string) => {},
  getSuppliers: async (bid: string) => [] as Supplier[],
  saveSupplier: async (s: Supplier) => {},
  deleteSupplier: async (id: string) => {},
  getExpenses: async (bid: string) => [] as Expense[],
  addExpense: async (e: Expense) => {},
  deleteExpense: async (id: string) => {},
  getDashboardStats: async (bid: string) => ({ customerCount: 0, productCount: 0, saleCount: 0, totalRevenue: 0, totalExpenses: 0, netProfit: 0, lowStockCount: 0 }),
  getSettings: async (bid: string) => ({ businessId: bid, currency: 'USD', currencySymbol: '$' }),
  saveSettings: async (s: Settings) => {},
  getNotifications: async (bid: string) => [] as Notification[],
  saveNotification: async (n: Notification) => {},
  markNotificationRead: async (id: string) => {}
};

seedData();

export const Api = (USE_FIREBASE ? FirebaseService : MockService) as typeof MockService;
