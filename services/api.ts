
import { 
  Product, Customer, Employee, Supplier, Sale, Expense, User, UserRole, StockLog, Category, ExpenseCategory, Settings, Notification
} from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// CONFIGURATION
// ==========================================

const USE_SUPABASE = true;

// Project Credentials
const SUPABASE_URL = "https://ewjosphotbwvuqwklijm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3am9zcGhvdGJ3dnVxd2tsaWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NzE1ODMsImV4cCI6MjA4NTM0NzU4M30.gA_bM7q9N3Ka1Kovafos4WdcBxT84vwnweNl08EEMO0";

// ==========================================
// SUPABASE INITIALIZATION
// ==========================================

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper for generating UUIDs for manual record creation
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const handleSupabaseError = (error: any, silent: boolean = false) => {
    if (!error) return null;
    
    const message = error.message || "";
    const code = error.code || "";
    
    const isMissingTable = message.includes("Could not find the table") || 
                           (message.includes("relation") && message.includes("does not exist")) ||
                           message.includes("schema cache") ||
                           code === '42P01';

    if (isMissingTable) {
        if (!silent) {
            console.warn(`[Supabase Warning] Database table not initialized: ${message}. Visit Admin > Database Setup.`);
        }
        if (silent) return null; 
        return "Database tables are not initialized. Please go to Admin > Database Setup to run the SQL schema.";
    }

    if (!silent && code !== 'PGRST116') {
        console.error("Detailed Supabase Error:", error);
    }
    
    if (message.includes("Invalid login credentials") || message.includes("Email not found")) {
        return "Invalid email or password. Please check your credentials and try again.";
    }
    if (message.includes("Email address") && message.includes("invalid")) {
        return "The email address provided is invalid. Please enter a valid email format.";
    }
    if (message.includes("Email not confirmed")) {
        return "Your email has not been confirmed yet. Please check your inbox for a verification link.";
    }
    if (message.includes("User already registered")) {
        return "An account with this email already exists. Try logging in instead.";
    }

    return message || "A database error occurred. Ensure your Supabase project is correctly configured.";
};

// Standard UUID validation
const isUUID = (str: any): boolean => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Helper to remove invalid or empty IDs from payloads to avoid UUID syntax errors
const sanitize = (data: any) => {
    if (!data || typeof data !== 'object') return data;
    const { id, ...rest } = data;
    if (!id || id === "" || !isUUID(id)) return rest;
    return data;
};

// ==========================================
// SUPABASE SERVICE IMPLEMENTATION
// ==========================================

const SupabaseService = {
  login: async (email: string, password: string): Promise<User | null> => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      try {
          // 1. Attempt Standard Supabase Auth (Official Users)
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
              email: normalizedEmail, 
              password: trimmedPassword 
          });
          
          if (!authError && authData.user) {
              const uid = authData.user.id;
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', uid)
                .single();

              if (!userError && userData) {
                  if (!userData.isActive) throw new Error("This account has been deactivated.");
                  return userData as User;
              }
              
              return { 
                id: uid, 
                username: normalizedEmail.split('@')[0], 
                email: normalizedEmail, 
                role: 'ADMIN', 
                businessId: 'unknown', 
                isActive: true, 
                createdAt: Date.now() 
              };
          }

          // 2. Hybrid Fallback: Check 'users' table directly (Staff/Manual Users)
          const { data: staffUser, error: staffError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', normalizedEmail)
            .eq('password', trimmedPassword) 
            .maybeSingle();

          if (staffError) {
              // Log the specific error if the database check fails (e.g. RLS issues)
              console.error("Hybrid Login Table Check Error:", staffError);
          }

          if (staffUser) {
              if (!staffUser.isActive) throw new Error("This account has been deactivated.");
              return staffUser as User;
          }

          // If both fail, throw generic error
          throw new Error("Invalid email or password.");
      } catch (error: any) {
          throw new Error(handleSupabaseError(error));
      }
  },

  signup: async (username: string, email: string, password: string): Promise<User | null> => {
      const normalizedEmail = email.trim().toLowerCase();
      try {
          if (!normalizedEmail || !normalizedEmail.includes('@')) {
              throw new Error("Invalid email format");
          }

          const { data, error: authError } = await supabase.auth.signUp({
              email: normalizedEmail,
              password: password || 'password123',
          });
          
          if (authError) throw authError;

          const uid = data.user?.id;
          if (!uid) return null;

          const newBusinessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const newUser: User = { 
            id: uid,
            businessId: newBusinessId,
            username: username.trim(),
            email: normalizedEmail,
            password: password.trim(), 
            role: 'ADMIN',
            isActive: true,
            createdAt: Date.now()
          }; 

          const { error: insertError } = await supabase.from('users').upsert(newUser);
          if (insertError) {
              handleSupabaseError(insertError, false);
              throw insertError;
          }

          const { error: settingsError } = await supabase.from('settings').upsert({ 
              businessId: newUser.businessId, currency: 'USD', currencySymbol: '$' 
          });
          if (settingsError) {
              handleSupabaseError(settingsError, true);
          }

          return newUser;
      } catch (error: any) {
          throw new Error(handleSupabaseError(error));
      }
  },

  getUsers: async (businessId: string): Promise<User[]> => {
      try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('businessId', businessId);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as User[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveUser: async (user: User): Promise<void> => {
      try {
          const userData = { ...user };
          
          if (!userData.id) {
              userData.id = generateUUID();
          }

          // Normalize fields
          if (userData.email) userData.email = userData.email.trim().toLowerCase();
          if (userData.password) userData.password = userData.password.trim();

          const { error } = await supabase.from('users').upsert(userData);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteUser: async (id: string): Promise<void> => {
      try {
          const { error } = await supabase.from('users').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getProducts: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Product[]) || [];
      } catch (e) {
          return [];
      }
  },
  
  saveProduct: async (p: Product) => {
      try {
          const { error } = await supabase.from('products').upsert(sanitize(p));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteProduct: async (id: string) => {
      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  importProducts: async (products: Product[]) => {
      try {
          const sanitizedProducts = products.map(p => sanitize(p));
          const { error } = await supabase.from('products').insert(sanitizedProducts);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getCategories: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Category[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveCategory: async (c: Category) => {
      try {
          const { error } = await supabase.from('categories').upsert(sanitize(c));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteCategory: async (id: string) => {
      try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getExpenseCategories: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('expenseCategories')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as ExpenseCategory[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveExpenseCategory: async (c: ExpenseCategory) => {
      try {
          const { error } = await supabase.from('expenseCategories').upsert(sanitize(c));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteExpenseCategory: async (id: string) => {
      try {
          const { error } = await supabase.from('expenseCategories').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  adjustStock: async (productId: string, qty: number, type: 'restock' | 'adjustment') => {
      try {
          const { data: p, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          
          if (fetchError || !p) throw fetchError || new Error("Product not found");

          const newQty = (p.quantity || 0) + qty;
          const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQty, lastUpdated: Date.now() })
            .eq('id', productId);
          
          if (updateError) throw updateError;

          const log = {
              businessId: p.businessId, 
              productId, 
              productName: p.name,
              change: qty, 
              type, 
              date: Date.now(), 
              balance: newQty
          };
          await supabase.from('stockLogs').insert(sanitize(log));
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getStockLogs: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('stockLogs')
            .select('*')
            .eq('businessId', bid)
            .order('date', { ascending: false });
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as StockLog[]) || [];
      } catch (e) {
          return [];
      }
  },

  createPendingOrder: async (sale: Sale) => {
      try {
          const { error } = await supabase.from('sales').insert(sanitize(sale));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getPendingOrders: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('businessId', bid)
            .eq('status', 'Pending');
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Sale[]) || [];
      } catch (e) {
          return [];
      }
  },

  completeOrder: async (saleId: string, paymentMethod: 'Cash'|'Card'|'Transfer') => {
      try {
          const { data: sale, error: fetchError } = await supabase
            .from('sales')
            .select('*')
            .eq('id', saleId)
            .single();
          
          if (fetchError || !sale) throw fetchError || new Error("Sale not found");

          const { error: updateSaleError } = await supabase
            .from('sales')
            .update({ status: 'Completed', paymentMethod })
            .eq('id', saleId);
          if (updateSaleError) throw updateSaleError;

          for (const item of sale.items) {
             const { data: p } = await supabase.from('products').select('*').eq('id', item.productId).single();
             if (p) {
                 const currentQty = p.quantity || 0;
                 const newQty = currentQty - item.quantity;
                 await supabase.from('products').update({ quantity: newQty, lastUpdated: Date.now() }).eq('id', item.productId);
                 const log = {
                    businessId: sale.businessId, 
                    productId: item.productId, 
                    productName: item.productName,
                    change: -item.quantity, 
                    type: 'sale', 
                    date: Date.now(), 
                    balance: newQty
                 };
                 await supabase.from('stockLogs').insert(sanitize(log));
             }
          }
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getSales: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('businessId', bid)
            .eq('status', 'Completed');
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Sale[]) || [];
      } catch (e) {
          return [];
      }
  },

  getCustomers: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Customer[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveCustomer: async (c: Customer) => {
      try {
          const { error } = await supabase.from('customers').upsert(sanitize(c));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteCustomer: async (id: string) => {
      try {
          const { error } = await supabase.from('customers').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getEmployees: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Employee[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveEmployee: async (e: Employee) => {
      try {
          const { error } = await supabase.from('employees').upsert(sanitize(e));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteEmployee: async (id: string) => {
      try {
          const { error } = await supabase.from('employees').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getSuppliers: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Supplier[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveSupplier: async (s: Supplier) => {
      try {
          const { error } = await supabase.from('suppliers').upsert(sanitize(s));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteSupplier: async (id: string) => {
      try {
          const { error } = await supabase.from('suppliers').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getExpenses: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('businessId', bid);
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Expense[]) || [];
      } catch (e) {
          return [];
      }
  },

  addExpense: async (e: Expense) => {
      try {
          const { error } = await supabase.from('expenses').upsert(sanitize(e));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  deleteExpense: async (id: string) => {
      try {
          const { error } = await supabase.from('expenses').delete().eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getDashboardStats: async (bid: string) => {
      try {
          const p = await SupabaseService.getProducts(bid).catch(() => []);
          const c = await SupabaseService.getCustomers(bid).catch(() => []);
          const s = await SupabaseService.getSales(bid).catch(() => []);
          const e = await SupabaseService.getExpenses(bid).catch(() => []);

          let totalRevenue = 0;
          let grossProfit = 0;
          s.forEach((sale: Sale) => {
              totalRevenue += (sale.totalAmount || 0);
              (sale.items || []).forEach(item => {
                  const product = p.find(prod => prod.id === item.productId);
                  if (product) {
                      // Gross Profit = ∑ (Selling Price - Buy Price) * Qty
                      grossProfit += (item.cost - product.buyPrice) * item.quantity;
                  }
              });
          });

          let totalExpenses = 0;
          e.forEach((exp: Expense) => {
              totalExpenses += (exp.amount || 0);
          });
          
          const lowStockProducts = p.filter(prod => prod.quantity < 10);
          
          return {
              productCount: p.length, customerCount: c.length, saleCount: s.length,
              totalRevenue, totalExpenses, grossProfit, 
              netProfit: grossProfit - totalExpenses,
              lowStockCount: lowStockProducts.length,
              lowStockNames: lowStockProducts.map(prod => prod.name)
          };
      } catch (err) {
          return { productCount: 0, customerCount: 0, saleCount: 0, totalRevenue: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0, lowStockCount: 0, lowStockNames: [] };
      }
  },

  getSettings: async (bid: string): Promise<Settings> => {
      try {
          const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('businessId', bid)
            .maybeSingle();

          if (error) {
              const handled = handleSupabaseError(error, false);
              if (handled && handled.includes("initialized")) {
                  throw new Error(handled);
              }
              return { businessId: bid, currency: 'USD', currencySymbol: '$' };
          }
          
          if (!data) {
              return { businessId: bid, currency: 'USD', currencySymbol: '$' };
          }
          
          return data as Settings;
      } catch (e: any) {
          if (e.message && e.message.includes("initialized")) throw e;
          return { businessId: bid, currency: 'USD', currencySymbol: '$' };
      }
  },

  saveSettings: async (s: Settings) => {
      try {
          const { error } = await supabase.from('settings').upsert(sanitize(s));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  getNotifications: async (bid: string) => {
      try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('businessId', bid)
            .order('timestamp', { ascending: false });
          if (error) {
              handleSupabaseError(error, true);
              return [];
          }
          return (data as Notification[]) || [];
      } catch (e) {
          return [];
      }
  },

  saveNotification: async (n: Notification) => {
      try {
          const { error } = await supabase.from('notifications').upsert(sanitize(n));
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  },

  markNotificationRead: async (id: string) => {
      try {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
          if (error) throw error;
      } catch (e) {
          throw new Error(handleSupabaseError(e));
      }
  }
};

const MockService = {
  login: async () => null, 
  signup: async (username: string, email: string, password: string) => null, 
  getUsers: async () => [],
  saveUser: async () => {}, deleteUser: async () => {}, getProducts: async () => [],
  saveProduct: async () => {}, deleteProduct: async () => {}, importProducts: async () => {},
  getCategories: async () => [], saveCategory: async () => {}, deleteCategory: async () => {},
  getExpenseCategories: async () => [], saveExpenseCategory: async () => {}, deleteExpenseCategory: async () => {},
  adjustStock: async () => {}, getStockLogs: async () => [], createPendingOrder: async () => {},
  getPendingOrders: async () => [], completeOrder: async () => {}, getSales: async () => [],
  getCustomers: async () => [], saveCustomer: async () => {}, deleteCustomer: async () => {},
  getEmployees: async () => [], saveEmployee: async () => {}, deleteEmployee: async () => {},
  getSuppliers: async () => [], saveSupplier: async () => {}, deleteSupplier: async () => {},
  getExpenses: async () => [], addExpense: async () => {}, deleteExpense: async () => {},
  getDashboardStats: async () => ({ productCount: 0, customerCount: 0, saleCount: 0, totalRevenue: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0, lowStockCount: 0, lowStockNames: [] }),
  getSettings: async () => ({ businessId: '', currency: 'USD', currencySymbol: '$' }),
  saveSettings: async () => {}, getNotifications: async () => [], saveNotification: async () => {},
  markNotificationRead: async () => {}
};

export const Api = USE_SUPABASE ? SupabaseService : MockService;
