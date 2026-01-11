
import { 
  Product, Customer, Employee, Supplier, Sale, Expense, User, UserRole, StockLog, Category, ExpenseCategory, Settings, Notification
} from '../types';
import { initializeApp, getApp, getApps, FirebaseApp, deleteApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch, orderBy 
} from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================

const USE_FIREBASE = true;

// IMPORTANT: Update this object with the config from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBjIWvN9F8I8uzy8h_EPCxlNTDbwfPk-1g",
  authDomain: "elifysis.firebaseapp.com",
  projectId: "elifysis",
  storageBucket: "elifysis.firebasestorage.app",
  messagingSenderId: "526762118474",
  appId: "1:526762118474:web:c55efccd11d584959005b3"
};

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================

let app: FirebaseApp;
let auth: any;
let db: any;

if (USE_FIREBASE) {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("Firebase initialized for project:", firebaseConfig.projectId);
        } else {
            app = getApp();
        }
        
        if (app) {
            auth = getAuth(app);
            db = getFirestore(app);
        }
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

const handleFirebaseError = (error: any) => {
    console.error("Detailed Firebase Error:", error);
    const code = error.code || "";
    const message = error.message || "";

    if (code === 'auth/operation-not-allowed' || message.includes('configuration-not-found')) {
        return "Setup Required: Please enable 'Email/Password' in your Firebase Console > Authentication > Sign-in method.";
    }
    if (code === 'permission-denied' || message.includes('Missing or insufficient permissions')) {
        return "Setup Required: Please enable 'Cloud Firestore' in your Firebase Console and set Rules to 'Test Mode'.";
    }
    if (code === 'auth/network-request-failed' || message.includes('offline')) {
        return "Connection Error: Check your internet or ensure the Firebase project ID is correct.";
    }
    if (code === 'auth/email-already-in-use') {
        return "This email is already registered.";
    }
    if (code === 'auth/invalid-credential') {
        return "Invalid login credentials. Please check your email and password.";
    }
    
    return message || "A database error occurred. Ensure your Firebase project is correctly configured.";
};

// Helper: Create a user without logging out the current admin
const createSecondaryUser = async (email: string, password: string) => {
    let secondaryApp: FirebaseApp | null = null;
    try {
        const appName = `Secondary-${Date.now()}`;
        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await signOut(secondaryAuth);
        return userCred.user;
    } catch (e: any) {
        throw new Error(handleFirebaseError(e));
    } finally {
        if (secondaryApp) {
            try {
                await deleteApp(secondaryApp);
            } catch (e) {
                console.warn("Could not cleanup secondary app:", e);
            }
        }
    }
};

// ==========================================
// FIREBASE SERVICE IMPLEMENTATION
// ==========================================

const FirebaseService = {
  login: async (email: string, password: string): Promise<User | null> => {
      if (!auth) throw new Error("Firebase not initialized. Check your config.");
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;
          
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              return { ...userData, id: uid };
          } else {
              return { 
                id: uid, 
                username: email.split('@')[0], 
                email, 
                role: 'ADMIN', 
                businessId: 'unknown', 
                isActive: true, 
                createdAt: Date.now() 
              };
          }
      } catch (error: any) {
          throw new Error(handleFirebaseError(error));
      }
  },

  signup: async (user: User): Promise<boolean> => {
      if (!auth) throw new Error("Firebase not initialized. Check your config.");
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password || 'password123');
          const uid = userCredential.user.uid;
          const { password, ...userData } = user;
          const newUser = { ...userData, id: uid }; 
          await setDoc(doc(db, 'users', uid), newUser);
          await setDoc(doc(db, 'settings', newUser.businessId), { 
              businessId: newUser.businessId, currency: 'USD', currencySymbol: '$' 
          });
          return true;
      } catch (error: any) {
          throw new Error(handleFirebaseError(error));
      }
  },

  getUsers: async (businessId: string): Promise<User[]> => {
      try {
          const q = query(collection(db, 'users'), where('businessId', '==', businessId));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  saveUser: async (user: User): Promise<void> => {
      try {
          if (!user.id) {
              const authUser = await createSecondaryUser(user.email, user.password || 'password123');
              user.id = authUser.uid;
          }
          const { password, ...userData } = user;
          await setDoc(doc(db, 'users', user.id), userData, { merge: true });
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  deleteUser: async (id: string): Promise<void> => {
      try {
          await deleteDoc(doc(db, 'users', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getProducts: async (bid: string) => {
      try {
          const q = query(collection(db, 'products'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Product));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveProduct: async (p: Product) => {
      try {
          if (p.id) await setDoc(doc(db, 'products', p.id), p, { merge: true });
          else await addDoc(collection(db, 'products'), p);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteProduct: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'products', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  importProducts: async (products: Product[]) => {
      try {
          const batch = writeBatch(db);
          products.forEach(p => {
              const ref = doc(collection(db, 'products'));
              batch.set(ref, { ...p, id: ref.id });
          });
          await batch.commit();
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getCategories: async (bid: string) => {
      try {
          const q = query(collection(db, 'categories'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveCategory: async (c: Category) => {
      try {
          if (c.id) await setDoc(doc(db, 'categories', c.id), c, { merge: true });
          else await addDoc(collection(db, 'categories'), c);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteCategory: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'categories', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getExpenseCategories: async (bid: string) => {
      try {
          const q = query(collection(db, 'expenseCategories'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as ExpenseCategory));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveExpenseCategory: async (c: ExpenseCategory) => {
      try {
          if (c.id) await setDoc(doc(db, 'expenseCategories', c.id), c, { merge: true });
          else await addDoc(collection(db, 'expenseCategories'), c);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteExpenseCategory: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'expenseCategories', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  adjustStock: async (productId: string, qty: number, type: 'restock' | 'adjustment') => {
      try {
          const pRef = doc(db, 'products', productId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
              const p = pSnap.data() as Product;
              const newQty = (p.quantity || 0) + qty;
              await updateDoc(pRef, { quantity: newQty });
              const log: StockLog = {
                  id: '', businessId: p.businessId, productId, productName: p.name,
                  change: qty, type, date: Date.now(), balance: newQty
              };
              await addDoc(collection(db, 'stockLogs'), log);
          }
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  getStockLogs: async (bid: string) => {
      try {
          const q = query(collection(db, 'stockLogs'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as StockLog));
          return logs.sort((a, b) => b.date - a.date);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  createPendingOrder: async (sale: Sale) => {
      try {
          await addDoc(collection(db, 'sales'), { ...sale, status: 'Pending' });
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  getPendingOrders: async (bid: string) => {
      try {
          const q = query(collection(db, 'sales'), where('businessId', '==', bid), where('status', '==', 'Pending'));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Sale));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  completeOrder: async (saleId: string, paymentMethod: 'Cash'|'Card'|'Transfer') => {
      try {
          const sRef = doc(db, 'sales', saleId);
          const saleDoc = await getDoc(sRef);
          if (saleDoc.exists()) {
              const sale = saleDoc.data() as Sale;
              const batch = writeBatch(db);
              batch.update(sRef, { status: 'Completed', paymentMethod });
              for (const item of sale.items) {
                 const pRef = doc(db, 'products', item.productId);
                 const pSnap = await getDoc(pRef);
                 if(pSnap.exists()) {
                     const currentQty = pSnap.data().quantity || 0;
                     batch.update(pRef, { quantity: currentQty - item.quantity });
                     const logRef = doc(collection(db, 'stockLogs'));
                     batch.set(logRef, {
                        businessId: sale.businessId, productId: item.productId, productName: item.productName,
                        change: -item.quantity, type: 'sale', date: Date.now(), balance: currentQty - item.quantity
                     });
                 }
              }
              await batch.commit();
          }
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  getSales: async (bid: string) => {
      try {
          const q = query(collection(db, 'sales'), where('businessId', '==', bid), where('status', '==', 'Completed'));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Sale));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getCustomers: async (bid: string) => {
      try {
          const q = query(collection(db, 'customers'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveCustomer: async (c: Customer) => {
      try {
          if (c.id) await setDoc(doc(db, 'customers', c.id), c, { merge: true });
          else await addDoc(collection(db, 'customers'), c);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteCustomer: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'customers', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getEmployees: async (bid: string) => {
      try {
          const q = query(collection(db, 'employees'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Employee));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveEmployee: async (e: Employee) => {
      try {
          if (e.id) await setDoc(doc(db, 'employees', e.id), e, { merge: true });
          else await addDoc(collection(db, 'employees'), e);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteEmployee: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'employees', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getSuppliers: async (bid: string) => {
      try {
          const q = query(collection(db, 'suppliers'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveSupplier: async (s: Supplier) => {
      try {
          if (s.id) await setDoc(doc(db, 'suppliers', s.id), s, { merge: true });
          else await addDoc(collection(db, 'suppliers'), s);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteSupplier: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'suppliers', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getExpenses: async (bid: string) => {
      try {
          const q = query(collection(db, 'expenses'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  addExpense: async (e: Expense) => {
      try {
          if (e.id) await setDoc(doc(db, 'expenses', e.id), e, { merge: true });
          else await addDoc(collection(db, 'expenses'), e);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  deleteExpense: async (id: string) => {
      try {
          await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getDashboardStats: async (bid: string) => {
      try {
          const products = await FirebaseService.getProducts(bid);
          const customers = await FirebaseService.getCustomers(bid);
          const sales = await FirebaseService.getSales(bid);
          const expenses = await FirebaseService.getExpenses(bid);
          const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
          const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
          return {
              productCount: products.length, customerCount: customers.length, saleCount: sales.length,
              totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses,
              lowStockCount: products.filter(p => p.quantity < 10).length
          };
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getSettings: async (bid: string): Promise<Settings> => {
      try {
          const docRef = doc(db, 'settings', bid);
          const snap = await getDoc(docRef);
          if (snap.exists()) return snap.data() as Settings;
          return { businessId: bid, currency: 'USD', currencySymbol: '$' };
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveSettings: async (s: Settings) => {
      try {
          await setDoc(doc(db, 'settings', s.businessId), s, { merge: true });
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },

  getNotifications: async (bid: string) => {
      try {
          const q = query(collection(db, 'notifications'), where('businessId', '==', bid));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  saveNotification: async (n: Notification) => {
      try {
          await setDoc(doc(db, 'notifications', n.id), n);
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  },
  markNotificationRead: async (id: string) => {
      try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (e) {
          throw new Error(handleFirebaseError(e));
      }
  }
};

const MockService = {
  login: async () => null, signup: async () => false, getUsers: async () => [],
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
  getDashboardStats: async () => ({ productCount: 0, customerCount: 0, saleCount: 0, totalRevenue: 0, totalExpenses: 0, netProfit: 0, lowStockCount: 0 }),
  getSettings: async () => ({ businessId: '', currency: 'USD', currencySymbol: '$' }),
  saveSettings: async () => {}, getNotifications: async () => [], saveNotification: async () => {},
  markNotificationRead: async () => {}
};

export const Api = USE_FIREBASE ? FirebaseService : MockService;
