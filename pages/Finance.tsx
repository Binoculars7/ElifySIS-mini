/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, DataTable, Button, Input, Modal, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Expense, ExpenseCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign, Trash2, Calendar, Search, Tag, Settings2, Plus, LayoutGrid, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Finance = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<any>({ income: 0, expense: 0, profit: 0 });
  
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
    try {
        const [e, s, c] = await Promise.all([
            Api.getExpenses(user.businessId),
            Api.getDashboardStats(user.businessId),
            Api.getExpenseCategories(user.businessId)
        ]);
        setExpenses(e);
        setStats({ income: s.totalRevenue, expense: s.totalExpenses, profit: s.netProfit });
        setCategories(c);
    } catch (err) {
        console.error("Finance Load Failed:", err);
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

  const chartData = [
    { name: 'Income (Total)', value: stats.income, color: '#1A73E8' },
    { name: 'Expenses (Filtered)', value: filteredExpenseTotal, color: '#EF4444' },
    { name: 'Net Balance', value: Math.max(0, stats.income - filteredExpenseTotal), color: '#22C55E' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-green-500 bg-white dark:bg-slate-800 min-w-0">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 truncate"><TrendingUp size={14}/> Gross Income</p>
           <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">{formatCurrency(stats.income)}</h3>
        </Card>
        <Card className="border-l-4 border-red-500 bg-white dark:bg-slate-800 min-w-0">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 truncate"><TrendingDown size={14}/> Expenditure</p>
           <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">{formatCurrency(stats.expense)}</h3>
        </Card>
        <Card className="border-l-4 border-blue-500 bg-white dark:bg-slate-800 min-w-0">
           <p className="text-slate-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 truncate"><DollarSign size={14}/> Net Profit</p>
           <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">{formatCurrency(stats.profit)}</h3>
        </Card>
      </div>

      <Card className="border border-gray-200 dark:border-slate-700 shadow-none overflow-visible no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Audit Period</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full h-11 bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4 overflow-hidden">
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
                    <div className="relative w-full h-11 bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4 overflow-hidden">
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
                      className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
              </div>

              <div className="lg:col-span-3 flex gap-2">
                  <Button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 h-11 gap-2 font-black uppercase text-xs truncate">
                    <Plus size={16}/> Record Expense
                  </Button>
                  <Button onClick={() => setIsCatModalOpen(true)} variant="secondary" className="h-11 px-3 border-gray-200 dark:border-slate-600" title="Manage Categories">
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
                        <div className="truncate max-w-[150px] sm:max-w-[250px] font-black text-slate-800 dark:text-white" title={e.name}>
                          {e.name}
                        </div>
                    ) },
                    { header: 'Category', accessor: (e) => (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase truncate max-w-[80px]" title={e.category}>
                            <Tag size={10} className="flex-shrink-0"/> {e.category}
                        </span>
                    ) },
                    { header: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString(), className: 'font-mono text-slate-400 whitespace-nowrap text-xs' },
                    { header: 'Amount', accessor: (e) => <span className="truncate">{formatCurrency(e.amount)}</span>, className: 'text-red-600 dark:text-red-400 font-black text-right' }
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
            <Card className="min-h-[420px] flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-3xl overflow-hidden p-6">
                <div className="mb-6">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate text-lg">Budget Allocation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Revenue vs Periodic Spend</p>
                </div>
                
                <div className="flex-1 w-full min-h-0 flex flex-col items-center">
                    <div className="w-full h-48 md:h-52 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie 
                                  data={chartData} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={50} 
                                  outerRadius={70} 
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
                                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 pb-2">
                        {chartData.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate max-w-[100px]" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Filtered Expenditure</p>
                        <p className="text-xl font-black text-red-500 tracking-tighter truncate leading-none">{formatCurrency(filteredExpenseTotal)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0 shadow-sm border border-red-100 dark:border-red-900/30">
                        <TrendingDown size={20}/>
                    </div>
                </div>
            </Card>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete}
        title="Delete Record"
        message="This will remove the transaction from the ledger forever. Are you absolutely certain?"
      />

      <Modal title="Record Store Expense" isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
         <div className="space-y-4">
            <Input label="Description" value={newExpense.name || ''} onChange={e => setNewExpense({...newExpense, name: e.target.value})} placeholder="e.g., Monthly Electric Bill" />
            <Input label="Amount (Value)" type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} placeholder="0.00" />
            
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-500 dark:text-gray-400">Category Selection</label>
                <div className="flex gap-2">
                    <select 
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-0"
                        value={newExpense.category || ''} 
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                        {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <button onClick={() => { setIsExpenseModalOpen(false); setIsCatModalOpen(true); }} className="p-2.5 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-gray-300 hover:text-primary transition-colors flex-shrink-0" title="Manage categories">
                        <Settings2 size={20}/>
                    </button>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
                 <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)} className="w-full">Cancel</Button>
                 <Button onClick={handleAddExpense} className="w-full">Authorize Record</Button>
            </div>
         </div>
      </Modal>

      <Modal title="Expense Categories" isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)}>
          <div className="space-y-8 py-2">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                          <Plus size={18} />
                      </div>
                      <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Add Custom Category</p>
                  </div>
                  <div className="flex gap-2">
                      <input 
                        className="flex-1 px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder-slate-300 dark:placeholder-slate-500 min-w-0"
                        placeholder="e.g., Marketing, Logistics..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button 
                        onClick={handleAddCategory} 
                        className="bg-primary hover:bg-primary/90 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform active:scale-95"
                      >
                        <Plus size={24} strokeWidth={3}/>
                      </button>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <LayoutGrid size={14} /> Current Registry
                      </p>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{categories.length} Items</span>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2.5">
                    {categories.map(cat => (
                        <div key={cat.id} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 min-w-0 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Tag size={16} />
                                </div>
                                <span className="font-black text-slate-700 dark:text-white text-sm truncate uppercase tracking-tight">{cat.name}</span>
                            </div>
                            <button 
                                onClick={() => handleDeleteCategory(cat.id)} 
                                className="text-slate-200 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Remove category"
                            >
                                <X size={18} strokeWidth={3}/>
                            </button>
                        </div>
                    ))}
                    
                    {categories.length === 0 && (
                        <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-900/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                <Tag size={24} />
                            </div>
                            <p className="text-slate-400 text-sm font-bold">No categories defined</p>
                            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Start by adding one above</p>
                        </div>
                    )}
                  </div>
              </div>

              <div className="pt-2">
                  <button 
                    onClick={() => setIsCatModalOpen(false)} 
                    className="w-full h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black dark:hover:bg-white transition-all shadow-xl active:scale-95"
                  >
                    Done
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};