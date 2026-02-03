
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Button, Input } from '../components/UI';
import { Api } from '../services/api';
import { Product, SaleItem, Sale } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, CheckCircle, Printer, Search, Plus, Minus, CreditCard, Banknote, RefreshCcw, User, ArrowRight, FileText, Download, LayoutTemplate, Store, Eye, History, X } from 'lucide-react';

export const Sales = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const { formatCurrency } = useSettings();
  
  const role = user?.role || 'CASHIER';

  const canViewEntry = ['ADMIN', 'MANAGER', 'SALES'].includes(role);
  const canViewCashier = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const canViewReceipts = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  
  const getDefaultTab = () => {
      if (canViewEntry) return 'entry';
      if (canViewCashier) return 'cashier';
      return 'entry';
  };

  const [activeTab, setActiveTab] = useState<'entry' | 'cashier' | 'receipts'>(getDefaultTab());
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [generatedTicketId, setGeneratedTicketId] = useState<string | null>(null);
  
  const [pendingOrders, setPendingOrders] = useState<Sale[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [cashierSearch, setCashierSearch] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const [receiptQuery, setReceiptQuery] = useState('');
  const [searchedReceipt, setSearchedReceipt] = useState<Sale | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);

  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'cashier') {
      loadPendingOrders();
    }
    if (activeTab === 'receipts') {
      loadSalesHistory();
    }
  }, [activeTab]);

  const loadData = async () => {
    if(!user) return;
    setProducts(await Api.getProducts(user.businessId));
  };

  const loadPendingOrders = async () => {
    if(!user) return;
    setPendingOrders(await Api.getPendingOrders(user.businessId));
  };

  const loadSalesHistory = async () => {
    if(!user) return;
    const history = await Api.getSales(user.businessId);
    setSalesHistory(history.sort((a,b) => b.date - a.date));
  };

  // --- Sales Entry Logic ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const addToCart = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.quantity <= 0) {
      notify(`Insufficient stock for ${prod.name}. Product is out of stock.`, 'error', 'Out of Stock');
      return;
    }

    const existing = cart.find(item => item.productId === productId);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > prod.quantity) {
      notify(`Cannot add more ${prod.name}. Only ${prod.quantity} available in stock.`, 'error', 'Stock Limit Reached');
      return;
    }

    if (existing) {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.cost } : item));
    } else {
      setCart([...cart, { productId: prod.id, productName: prod.name, quantity: 1, cost: prod.sellPrice, total: prod.sellPrice }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const existing = cart.find(item => item.productId === productId);
    if (!existing) return;

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newQty = existing.quantity + delta;

    if (delta > 0 && newQty > prod.quantity) {
      notify(`Cannot exceed available stock of ${prod.quantity} for ${prod.name}.`, 'error', 'Stock Limit Reached');
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter(c => c.productId !== productId));
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQty, total: newQty * item.cost } : item));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const generateTicket = async () => {
    if (!user || cart.length === 0) return;
    const ticketId = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;

    const sale: Sale = {
      id: '',
      businessId: user.businessId,
      ticketId: ticketId,
      items: cart,
      totalAmount: cart.reduce((acc, curr) => acc + curr.total, 0),
      date: Date.now(),
      status: 'Pending'
    };

    await Api.createPendingOrder(sale);
    setGeneratedTicketId(ticketId);
    setCart([]);
    notify(`Order Generated: ${ticketId}`, 'info', 'New Ticket');
  };

  const resetEntry = () => {
      setGeneratedTicketId(null);
      setCart([]);
      setSearchTerm('');
  };

  // --- Cashier Logic ---
  const filteredPendingOrders = pendingOrders.filter(o => 
      o.ticketId.toLowerCase().includes(cashierSearch.toLowerCase())
  );

  const confirmPayment = async (method: 'Cash' | 'Card' | 'Transfer') => {
      if (!selectedOrder) return;
      await Api.completeOrder(selectedOrder.id, method);
      setReceipt({ ...selectedOrder, paymentMethod: method, status: 'Completed' });
      notify(`Payment Confirmed for ${selectedOrder.ticketId}`, 'success', 'Payment Successful');
      setSelectedOrder(null);
      loadPendingOrders();
  };

  // --- Receipt Logic ---
  const handleReceiptSearch = async () => {
      if (!receiptQuery || !user) return;
      setReceiptError('');
      setSearchedReceipt(null);
      
      const allSales = await Api.getSales(user.businessId);
      const found = allSales.find(s => s.ticketId.toLowerCase() === receiptQuery.toLowerCase());
      
      if (found) {
          setSearchedReceipt(found);
      } else {
          setReceiptError('No receipt found with this ID.');
      }
  };

  const printReceiptElement = (elementId: string) => {
      const content = document.getElementById(elementId);
      if (!content) return;
      
      const printWindow = window.open('', '', 'height=800,width=500');
      if (!printWindow) return;

      printWindow.document.write('<html><head><title>Print Receipt</title>');
      printWindow.document.write(`
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
          body { font-family: 'Courier Prime', 'Courier New', monospace; padding: 20px; background: #fff; color: #000; }
          .receipt-container { width: 100%; max-width: 320px; margin: 0 auto; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .text-sm { font-size: 12px; }
          .text-xs { font-size: 10px; }
          .text-xl { font-size: 20px; }
          .uppercase { text-transform: uppercase; }
          .border-b { border-bottom: 1px dashed #000; }
          .border-t { border-top: 1px dashed #000; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .my-2 { margin-top: 8px; margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 4px 0; vertical-align: top; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .barcode { height: 30px; width: 100%; background: repeating-linear-gradient(to right, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 6px); margin-top: 20px; }
        </style>
      `);
      printWindow.document.write('</head><body><div class="receipt-container">');
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</div></body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
  };

  // --- Render ---
  if (receipt) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 p-8 text-center space-y-4 shadow-xl border-t-8 border-success">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Confirmed</h2>
          {/* Force text-black and bg-white to ensure visibility in dark mode */}
          <div className="bg-white dark:bg-white p-6 rounded-lg text-left text-sm space-y-2 font-mono shadow-inner border border-gray-200 text-black dark:text-black" id="confirmation-receipt">
            <div className="text-center mb-6 border-b border-dashed border-gray-400 pb-4 text-black dark:text-black">
                <div className="flex justify-center mb-2"><Store size={24}/></div>
                <h3 className="font-bold text-xl uppercase tracking-wider text-black dark:text-black">ElifySIS Store</h3>
                <p className="text-xs text-gray-500">Official Receipt</p>
            </div>
            <p className="flex justify-between font-bold text-black dark:text-black"><span>TICKET ID:</span> <span>{receipt.ticketId}</span></p>
            <p className="flex justify-between text-xs text-gray-600"><span>Date:</span> <span>{new Date().toLocaleString()}</span></p>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <table className="w-full text-xs text-black dark:text-black">
                <thead><tr><th className="text-left pb-2 text-black dark:text-black">Item</th><th className="text-center pb-2 text-black dark:text-black">Qty</th><th className="text-right pb-2 text-black dark:text-black">Price</th></tr></thead>
                <tbody>{receipt.items.map((item, idx) => (<tr key={idx}><td className="py-1 text-black dark:text-black">{item.productName}</td><td className="text-center py-1 text-black dark:text-black">{item.quantity}</td><td className="text-right py-1 font-medium text-black dark:text-black">{formatCurrency(item.total)}</td></tr>))}</tbody>
            </table>
            <div className="border-t border-dashed border-gray-400 my-4 pt-4 text-black dark:text-black">
                <div className="flex justify-between text-xl font-bold"><span>TOTAL</span> <span>{formatCurrency(receipt.totalAmount)}</span></div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 uppercase"><span>Payment Mode</span> <span>{receipt.paymentMethod}</span></div>
            </div>
            <div className="text-center pt-6"><p className="text-xs text-gray-400">Thank you for shopping with us!</p><div className="h-8 w-full mt-2 bg-[repeating-linear-gradient(90deg,black,black_1px,transparent_1px,transparent_3px)] opacity-30"></div></div>
          </div>
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="secondary" onClick={() => printReceiptElement('confirmation-receipt')}><Printer size={16} className="mr-2"/> Print</Button>
            <Button onClick={() => setReceipt(null)}>Process Next</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 inline-flex flex-wrap gap-1.5 transition-colors">
         {canViewEntry && (
         <button onClick={() => setActiveTab('entry')} className={`px-5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'entry' ? 'bg-primary text-white shadow-md' : 'text-textSecondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><ShoppingCart size={16} /> Sales Entry</button>
         )}
         {canViewCashier && (
         <button onClick={() => setActiveTab('cashier')} className={`px-5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'cashier' ? 'bg-primary text-white shadow-md' : 'text-textSecondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Banknote size={16} /> Cashier Station</button>
         )}
         {canViewReceipts && (
         <button onClick={() => setActiveTab('receipts')} className={`px-5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'receipts' ? 'bg-primary text-white shadow-md' : 'text-textSecondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><FileText size={16} /> Receipts</button>
         )}
      </div>

      {activeTab === 'entry' && canViewEntry && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 lg:col-span-8 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input placeholder="Search products..." className="pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}/>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-[500px] content-start">
                    {displayedProducts.map(p => (
                        <div key={p.id} onClick={() => addToCart(p.id)} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:border-primary hover:shadow-md transition-all group flex flex-col justify-between">
                            <div>
                                <div className="h-16 bg-gray-50 dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center text-gray-300 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors">
                                    <ShoppingCart size={20}/>
                                </div>
                                <h4 className="font-bold text-xs line-clamp-2 mb-1 text-gray-900 dark:text-gray-100">{p.name}</h4>
                                <p className="text-[10px] text-textSecondary dark:text-gray-400 mb-2">{p.category}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-primary font-bold text-base">{formatCurrency(p.sellPrice)}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.quantity}</span>
                            </div>
                        </div>
                    ))}
                    {displayedProducts.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">No products found.</div>}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                        <span className="flex items-center px-4 text-sm font-medium bg-white dark:bg-slate-800 dark:text-white rounded-lg border border-gray-200 dark:border-slate-700">Page {currentPage} of {totalPages}</span>
                        <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                    </div>
                )}
            </div>

            <div className="md:col-span-5 lg:col-span-4 relative">
                <Card className="sticky top-4 h-auto max-h-[85vh] flex flex-col p-3 transition-all">
                    {!generatedTicketId ? (
                        <>
                            <div className="mb-2">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-textPrimary dark:text-white leading-tight"><ShoppingCart size={20}/> New Order</h3>
                                <p className="text-[10px] text-textSecondary dark:text-gray-400 mt-0.5">Add items and generate ticket.</p>
                            </div>
                            <div className="overflow-y-auto space-y-1.5 pr-1 custom-scrollbar max-h-[50vh]">
                                {cart.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 space-y-2 opacity-60">
                                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-full"><Plus size={24}/></div>
                                        <p className="text-sm">Select products to begin</p>
                                    </div>
                                )}
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-100 dark:border-slate-600 group">
                                        <div className="flex-1 min-w-0 pr-1">
                                            <p className="font-bold text-[11px] text-textPrimary dark:text-gray-100 truncate">{item.productName}</p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400">{formatCurrency(item.cost)}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 mr-1 shrink-0">
                                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-0.5 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-gray-600 dark:text-gray-300"><Minus size={12}/></button>
                                            <span className="font-bold text-[11px] w-3 text-center text-textPrimary dark:text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-0.5 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-gray-600 dark:text-gray-300"><Plus size={12}/></button>
                                            <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-600 rounded ml-1 transition-colors" title="Cancel Item"><X size={12}/></button>
                                        </div>
                                        <div className="min-w-[70px] text-right font-bold text-[11px] text-primary shrink-0">{formatCurrency(item.total)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t dark:border-slate-700 pt-2 mt-2 bg-white dark:bg-slate-800">
                                <div className="flex justify-between text-base font-black text-textPrimary dark:text-white mb-2">
                                    <span>Total</span> 
                                    <span>{formatCurrency(cart.reduce((a, c) => a + c.total, 0))}</span>
                                </div>
                                <Button onClick={generateTicket} disabled={cart.length === 0} className="w-full py-2.5 text-sm font-bold shadow-lg shadow-primary/20">Generate Ticket ID <ArrowRight className="ml-1" size={16}/></Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner"><User size={32} /></div>
                            <div>
                                <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">Customer Ticket ID</h3>
                                <h1 className="text-3xl font-black text-primary tracking-wider my-1">{generatedTicketId}</h1>
                                <p className="text-xs text-gray-400">Please direct the customer to the cashier.</p>
                            </div>
                            <Button onClick={resetEntry} variant="secondary" className="mt-4">Start New Order</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
      )}

      {activeTab === 'cashier' && canViewCashier && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 lg:col-span-8">
                 <Card className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-textPrimary dark:text-white"><RefreshCcw size={20}/> Pending Orders</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input type="text" placeholder="Scan or enter Ticket ID..." className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary outline-none" value={cashierSearch} onChange={e => setCashierSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-slate-600"><tr><th className="px-6 py-4">Ticket ID</th><th className="px-6 py-4">Time</th><th className="px-6 py-4">Items</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4"></th></tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-textPrimary dark:text-gray-300">
                                {filteredPendingOrders.length === 0 && (<tr><td colSpan={5} className="p-8 text-center text-gray-400">No pending orders found.</td></tr>)}
                                {filteredPendingOrders.map(order => (
                                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50 dark:bg-slate-700 ring-1 ring-inset ring-primary' : ''}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-primary">{order.ticketId}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-6 py-4">{order.items.length} items</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(order.totalAmount)}</td>
                                        <td className="px-6 py-4 text-right text-gray-400"><ArrowRight size={16}/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </Card>
              </div>
              <div className="md:col-span-5 lg:col-span-4">
                  <Card className="h-full sticky top-4 flex flex-col">
                      {selectedOrder ? (
                          <>
                            <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Review Payment</h3>
                                <p className="text-sm text-primary font-mono mt-1">{selectedOrder.ticketId}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar text-textPrimary dark:text-gray-200">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                                        <span className="text-gray-600 dark:text-gray-400">{item.quantity} x {item.productName}</span>
                                        <span className="font-medium">{formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-6 text-textPrimary dark:text-white">
                                <div className="flex justify-between text-lg font-bold"><span>Total Due</span> <span>{formatCurrency(selectedOrder.totalAmount)}</span></div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>
                                <Button onClick={() => confirmPayment('Cash')} className="w-full justify-between group" variant="secondary"><span className="flex items-center gap-2"><Banknote size={18}/> Cash</span><span className="hidden group-hover:inline opacity-50">Confirm</span></Button>
                                <Button onClick={() => confirmPayment('Card')} className="w-full justify-between group" variant="secondary"><span className="flex items-center gap-2"><CreditCard size={18}/> Card / POS</span><span className="hidden group-hover:inline opacity-50">Confirm</span></Button>
                                <Button onClick={() => confirmPayment('Transfer')} className="w-full justify-between group" variant="secondary"><span className="flex items-center gap-2"><RefreshCcw size={18}/> Bank Transfer</span><span className="hidden group-hover:inline opacity-50">Confirm</span></Button>
                            </div>
                          </>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4">
                              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-full"><CreditCard size={32}/></div>
                              <p className="text-center text-sm px-4">Select an order from the list to process payment.</p>
                          </div>
                      )}
                  </Card>
              </div>
          </div>
      )}

      {activeTab === 'receipts' && canViewReceipts && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2">
             <Card className="mb-6">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-textPrimary dark:text-white"><FileText /> Receipt Generator</h2>
                 <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <p className="text-textSecondary dark:text-gray-400">Search for a Ticket ID to find and print a specific receipt.</p>
                 </div>
                 <div className="flex gap-4 items-start mt-4">
                     <div className="flex-1">
                        <Input placeholder="Enter Ticket ID (e.g., CUST-12345)" value={receiptQuery} onChange={e => setReceiptQuery(e.target.value)} className="h-11"/>
                     </div>
                     <Button onClick={handleReceiptSearch} disabled={!receiptQuery} className="h-11"><Search size={18} className="mr-2"/> Search</Button>
                 </div>
                 {receiptError && <p className="text-danger mt-2 text-sm">{receiptError}</p>}
             </Card>

             {!searchedReceipt && (
                 <div className="mb-6">
                    <DataTable<Sale>
                        title="Recent Receipt History"
                        data={salesHistory}
                        columns={[
                            { header: 'Ticket ID', accessor: 'ticketId', className: 'font-mono font-bold text-primary' },
                            { header: 'Date', accessor: (s) => new Date(s.date).toLocaleDateString() },
                            { header: 'Time', accessor: (s) => new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
                            { header: 'Total', accessor: (s) => formatCurrency(s.totalAmount), className: 'font-bold' },
                            { header: 'Payment', accessor: (s) => <span className="uppercase text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">{s.paymentMethod}</span> }
                        ]}
                        actions={(item) => (
                            <div className="flex justify-end">
                                <Button size="sm" variant="secondary" onClick={() => setSearchedReceipt(item)}><Eye size={16} className="mr-1"/> View</Button>
                            </div>
                        )}
                    />
                 </div>
             )}

             {searchedReceipt && (
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
                     <div className="md:col-span-7 lg:col-span-8 bg-gray-100 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 p-8 flex justify-center items-start min-h-[600px] shadow-inner">
                         {/* Receipt Preview - Force Light Mode Look */}
                         <div id="receipt-preview" className="bg-white dark:bg-white w-80 shadow-2xl relative text-gray-900 dark:text-gray-900 font-mono text-sm leading-tight transform transition-transform hover:scale-[1.01] duration-300">
                             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-100 to-white opacity-50"></div>
                             <div className="p-6">
                                 <div className="text-center mb-6">
                                     <div className="flex justify-center mb-2 text-gray-800 dark:text-gray-800"><Store size={32} strokeWidth={1.5} /></div>
                                     <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-black dark:text-black">ElifySIS</h2>
                                     <p className="text-xs text-gray-500 font-sans uppercase">Premium Market System</p>
                                     <div className="my-2 text-[10px] text-gray-500"><p>123 Market Street, Suite 404</p><p>New York, NY 10012</p><p>(555) 019-2834</p></div>
                                 </div>
                                 <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                                 <div className="mb-4 text-xs space-y-1.5 font-sans text-black dark:text-black">
                                     <div className="flex justify-between"><span className="text-gray-500">ORDER #</span><span className="font-bold font-mono">{searchedReceipt.ticketId}</span></div>
                                     <div className="flex justify-between"><span className="text-gray-500">DATE</span><span className="font-bold">{new Date(searchedReceipt.date).toLocaleDateString()}</span></div>
                                     <div className="flex justify-between"><span className="text-gray-500">TIME</span><span className="font-bold">{new Date(searchedReceipt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                     <div className="flex justify-between"><span className="text-gray-500">CLIENT</span><span className="font-bold">{searchedReceipt.customerName || 'Walk-In Customer'}</span></div>
                                 </div>
                                 <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                                 <table className="w-full text-xs mb-4 text-black dark:text-black">
                                    <thead><tr className="uppercase text-gray-500 text-[10px] font-sans"><th className="text-left pb-2">Item</th><th className="text-center pb-2 w-8">Qty</th><th className="text-right pb-2 w-16">Price</th></tr></thead>
                                    <tbody className="font-mono text-black dark:text-black">{searchedReceipt.items.map((item, i) => (<tr key={i}><td className="py-1 pr-2"><div className="font-bold">{item.productName}</div><div className="text-[10px] text-gray-400">SKU: {item.productId.substring(0,6)}</div></td><td className="text-center py-1 align-top">{item.quantity}</td><td className="text-right py-1 align-top font-bold">{formatCurrency(item.total)}</td></tr>))}</tbody>
                                 </table>
                                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-black dark:text-black">
                                     <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(searchedReceipt.totalAmount)}</span></div>
                                     <div className="flex justify-between text-xs mb-2"><span className="text-gray-500">Tax (0%)</span><span>{formatCurrency(0)}</span></div>
                                     <div className="border-t border-gray-200 my-2"></div>
                                     <div className="flex justify-between items-end"><span className="font-bold text-sm">TOTAL</span><span className="font-black text-xl">{formatCurrency(searchedReceipt.totalAmount)}</span></div>
                                 </div>
                                 <div className="flex justify-center mb-6"><span className="border border-gray-800 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black dark:text-black">PAID VIA {searchedReceipt.paymentMethod}</span></div>
                                 <div className="text-center"><p className="text-[10px] text-gray-400 mb-4">Returns accepted within 30 days with receipt.</p><div className="barcode h-8 w-full opacity-40 mix-blend-multiply bg-[repeating-linear-gradient(90deg,black,black_1px,transparent_1px,transparent_3px)]"></div><p className="text-[8px] text-gray-400 mt-1 uppercase tracking-widest">{searchedReceipt.id}</p></div>
                             </div>
                             <div className="h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+')] bg-repeat-x bg-bottom w-full absolute -bottom-4 left-0"></div>
                         </div>
                     </div>
                     <div className="md:col-span-5 lg:col-span-4 space-y-6">
                         <Card className="sticky top-6">
                             <div className="mb-6"><h3 className="font-bold text-lg text-textPrimary dark:text-white mb-1">Receipt Actions</h3><p className="text-sm text-textSecondary dark:text-gray-400">Manage output for Ticket #{searchedReceipt.ticketId}</p></div>
                             <div className="space-y-4"><Button onClick={() => printReceiptElement('receipt-preview')} className="w-full h-12 text-lg"><Printer size={20} className="mr-2"/> Print Receipt</Button><Button onClick={() => printReceiptElement('receipt-preview')} variant="secondary" className="w-full h-12 text-lg"><Download size={20} className="mr-2"/> Download PDF</Button><Button onClick={() => setSearchedReceipt(null)} variant="ghost" className="w-full">Back to History</Button></div>
                             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700"><h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Quick Summary</h4><div className="space-y-3 text-sm text-gray-600 dark:text-gray-300"><div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(searchedReceipt.date).toLocaleDateString()}</span></div><div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{new Date(searchedReceipt.date).toLocaleTimeString()}</span></div><div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{searchedReceipt.customerName || 'Walk-in'}</span></div><div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{searchedReceipt.paymentMethod}</span></div></div></div>
                         </Card>
                     </div>
                 </div>
             )}
          </div>
      )}
    </div>
  );
};
