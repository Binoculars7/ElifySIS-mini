
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, DataTable, Button, Input, Modal, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Expense, ExpenseCategory, Sale, Product } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign, Trash2, Calendar, Search, Tag, Settings2, Plus, LayoutGrid, X, ReceiptText, ChevronRight, Hash, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Finance = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const [e, s, p, c] = await Promise.all([
            Api.getExpenses(user.businessId),
            Api.getSales(user.businessId),
            Api.getProducts(user.businessId),
            Api.getExpenseCategories(user.businessId)
        ]);
        setExpenses(e);
        setSales(s);
        setProducts(p);
        setCategories(c);
    } catch (err) {
        console.error("Finance Load Failed:", err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleAddExpense = async () => {
    if(!newExpense.amount || !newExpense.name || !user) return;
    await Api.addExpense({ 
        ...newExpense, 
        date: Date.now(), 
        businessId: user.businessId,
        category: newExpense.category || (categories[0]?.name || 'Uncategorized')
    } as Expense);
    setIsExpenseModalOpen(false);
    setNewExpense({});
    loadData();
  };

  const handleAddCategory = async () => {
      if (!newCategoryName.trim() || !user) return;
      await Api.saveExpenseCategory({
          businessId: user.businessId,
          name: newCategoryName.trim()
      } as ExpenseCategory);
      setNewCategoryName('');
      loadData();
  };

  const handleDeleteCategory = async (id: string) => {
      await Api.deleteExpenseCategory(id);
      loadData();
  };

  const confirmDelete = async () => {
      if (deleteId) {
          await Api.deleteExpense(deleteId);
          loadData();
          setDeleteId(null);
      }
  };

  const formatDisplayDate = (d: string) => {
      if (!d) return 'Select Date';
      return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredExpenses = useMemo(() => {
      const start = new Date(startDate).setHours(0,0,0,0);
      const end = new Date(endDate).setHours(23,59,59,999);
      
      return expenses.filter(e => {
          const inRange = e.date >= start && e.date <= end;
          const matchesSearch = 
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            e.category.toLowerCase().includes(searchQuery.toLowerCase());
          return inRange && matchesSearch;
      }).sort((a,b) => b.date - a.date);
  }, [expenses, startDate, endDate, searchQuery]);

  const filteredExpenseTotal = useMemo(() => {
      return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  /**
   * GROSS INCOME CALCULATION
   * Gross Income = ∑ (Selling Price - Actual Price) * Qty Sold
   */
  const filteredGrossIncome = useMemo(() => {
      const start = new Date(startDate).setHours(0,0,0,0);
      const end = new Date(endDate).setHours(23,59,59,999);
      
      const rangeSales = sales.filter(s => s.date >= start && s.date <= end);
      let totalMargin = 0;

      rangeSales.forEach(sale => {
          sale.items.forEach(item => {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                  // Margin = (Unit Sell Price - Unit Buy Price) * Qty
                  totalMargin += (item.cost - product.buyPrice) * item.quantity;
              }
          });
      });

      return totalMargin;
  }, [sales, products, startDate, endDate]);

  const netProfit = useMemo(() => {
      return filteredGrossIncome - filteredExpenseTotal;
  }, [filteredGrossIncome, filteredExpenseTotal]);

  const chartData = [
    { name: 'Gross Income', value: filteredGrossIncome, color: '#1A73E8' },
    { name: 'Expenditure', value: filteredExpenseTotal, color: '#EF4444' },
    { name: 'Net Profit', value: Math.max(0, netProfit), color: '#22C55E' },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm font-bold text-textSecondary uppercase tracking-widest">Loading Finance Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-blue-500 bg-white dark:bg-slate-800 min-w-0 shadow-none">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 truncate">Gross Income</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(filteredGrossIncome)}</h3>
           <p className="text-[10px] text-gray-400 mt-1">Total Margin for Period</p>
        </Card>
        <Card className="border-l-4 border-red-500 bg-white dark:bg-slate-800 min-w-0 shadow-none">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 truncate">Expenditure</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(filteredExpenseTotal)}</h3>
           <p className="text-[10px] text-gray-400 mt-1">Sum of Logged Expenses</p>
        </Card>
        <Card className="border-l-4 border-green-500 bg-white dark:bg-slate-800 min-w-0 shadow-none">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 truncate">Net Profit</p>
           <h3 className={`text-2xl font-black truncate ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {formatCurrency(netProfit)}
           </h3>
           <p className="text-[10px] text-gray-400 mt-1">Income - Expenditure</p>
        </Card>
      </div>

      <Card className="border border-gray-200 dark:border-slate-700 shadow-none overflow-visible no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Audit Period</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full h-11 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg group hover:border-primary transition-colors flex items-center px-4 overflow-hidden shadow-sm">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-slate-700 dark:text-white pointer-events-none truncate">
                            {formatDisplayDate(startDate)}
                        </span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[10]" 
                        />
                    </div>
                    <span className="text-gray-400 font-bold hidden sm:inline text-sm">to</span>
                    <div className="relative w-full h-11 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg group hover:border-primary transition-colors flex items-center px-4 overflow-hidden shadow-sm">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-slate-700 dark:text-white pointer-events-none truncate">
                            {formatDisplayDate(endDate)}
                        </span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[10]" 
                        />
                    </div>
                  </div>
              </div>

              <div className="lg:col-span-4">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Search Ledger</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Name or category..."
                      className="w-full pl-10 h-11 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
              </div>

              <div className="lg:col-span-3 flex gap-2">
                  <Button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 h-11 gap-2 font-bold uppercase text-xs truncate bg-black hover:bg-slate-800 text-white border-none rounded-lg shadow-sm">
                    <Plus size={16}/> Record Expense
                  </Button>
                  <Button onClick={() => setIsCatModalOpen(true)} variant="secondary" className="h-11 px-3 border-gray-200 dark:border-slate-600 rounded-lg shadow-sm" title="Categories">
                    <Settings2 size={18}/>
                  </Button>
              </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0">
            <DataTable<Expense> 
                title="Historical Ledger"
                data={filteredExpenses}
                columns={[
                    { header: 'Description', accessor: (e) => (
                        <div className="truncate max-w-[150px] sm:max-w-[250px] font-bold text-slate-800 dark:text-white" title={e.name}>
                          {e.name}
                        </div>
                    ) },
                    { header: 'Category', accessor: (e) => (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">
                            {e.category}
                        </span>
                    ) },
                    { header: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString(), className: 'text-slate-400 whitespace-nowrap text-xs' },
                    { header: 'Amount', accessor: (e) => <span className="truncate">{formatCurrency(e.amount)}</span>, className: 'text-red-600 font-bold text-right' }
                ]}
                actions={(item) => (
                    <div className="flex justify-end">
                        <button className="text-slate-300 hover:text-red-500 p-2 transition-colors" onClick={() => setDeleteId(item.id)}>
                            <Trash2 size={18}/>
                        </button>
                    </div>
                )}
            />
        </div>

        <div className="space-y-6 min-w-0">
            <Card className="min-h-[340px] flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-none rounded-2xl p-6">
                <div className="mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight truncate text-lg">Allocation</h3>
                </div>
                
                <div className="flex-1 w-full min-h-[200px] flex flex-col items-center relative">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <PieChart>
                            <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: any) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 mt-2">
                        {chartData.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">
                              {item.name}
                            </span>
                          </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Remove Entry" 
        message="This will permanently delete this record from the ledger."
      />

      <Modal title="Add New Expense" isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
         <div className="space-y-5 py-2">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <input 
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                       placeholder="e.g., Office Supplies"
                       value={newExpense.name || ''}
                       onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                    <input 
                       type="number"
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                       placeholder="0.00"
                       value={newExpense.amount || ''}
                       onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                            value={newExpense.category || ''} 
                            onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                        >
                            {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <button 
                            onClick={() => { setIsExpenseModalOpen(false); setIsCatModalOpen(true); }} 
                            className="w-12 h-12 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-black dark:hover:text-white transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                            <Plus size={20}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 flex gap-3">
                 <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest transition-colors">Cancel</button>
                 <button onClick={handleAddExpense} className="flex-1 h-12 rounded-xl font-bold uppercase text-xs tracking-widest bg-black text-white hover:bg-slate-800 shadow-lg shadow-black/10 transition-all active:scale-95">Add Expense</button>
            </div>
         </div>
      </Modal>

      <Modal title="Manage Categories" isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)}>
          <div className="space-y-6 py-2">
              <div className="flex gap-2">
                  <input 
                    className="flex-1 px-4 h-12 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button 
                    onClick={handleAddCategory} 
                    className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-800 transition-all active:scale-90 flex-shrink-0"
                  >
                    <Plus size={24} strokeWidth={2.5}/>
                  </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {categories.map(cat => (
                    <div key={cat.id} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-gray-200 transition-all duration-200">
                        <span className="font-bold text-slate-700 dark:text-white text-sm uppercase tracking-tight">{cat.name}</span>
                        <button 
                            onClick={() => handleDeleteCategory(cat.id)} 
                            className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"
                        >
                            <X size={18} strokeWidth={2.5}/>
                        </button>
                    </div>
                ))}
                
                {categories.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No Categories</p>
                    </div>
                )}
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {categories.length} Total Labels
                  </p>
                  <button 
                    onClick={() => setIsCatModalOpen(false)} 
                    className="w-full h-12 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-md active:scale-95"
                  >
                    Done
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
