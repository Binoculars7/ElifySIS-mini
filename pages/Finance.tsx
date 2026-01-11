/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, DataTable, Button, Input, Modal, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Expense, ExpenseCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign, Trash2, Calendar, Search, Tag, Settings2, Plus, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Finance = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<any>({ income: 0, expense: 0, profit: 0 });
  
  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filtering state
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
          id: '',
          businessId: user.businessId,
          name: newCategoryName.trim()
      });
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

  // Filter Logic
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

  // Recalculate pie chart and mini-stats based on filtered data
  const filteredExpenseTotal = useMemo(() => {
      return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const chartData = [
    { name: 'Income (Total)', value: stats.income, color: '#1A73E8' },
    { name: 'Expenses (Filtered)', value: filteredExpenseTotal, color: '#EF4444' },
    { name: 'Net Balance', value: Math.max(0, stats.income - filteredExpenseTotal), color: '#22C55E' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-green-500 bg-white dark:bg-slate-800">
           <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp size={16}/> Gross Income</p>
           <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.income)}</h3>
        </Card>
        <Card className="border-l-4 border-red-500 bg-white dark:bg-slate-800">
           <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingDown size={16}/> Total Expenditure</p>
           <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.expense)}</h3>
        </Card>
        <Card className="border-l-4 border-blue-500 bg-white dark:bg-slate-800">
           <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign size={16}/> Business Net Profit</p>
           <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.profit)}</h3>
        </Card>
      </div>

      {/* Global Controls */}
      <Card className="border border-gray-200 dark:border-slate-700 shadow-none overflow-visible no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              {/* Date Filter */}
              <div className="lg:col-span-5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Audit Period</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full h-11 bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-slate-700 dark:text-white pointer-events-none">
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
                    <div className="relative w-full h-11 bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-slate-700 dark:text-white pointer-events-none">
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

              {/* Search Bar */}
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

              {/* Action Buttons */}
              <div className="lg:col-span-3 flex gap-2">
                  <Button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 h-11 gap-2 font-black uppercase text-xs">
                    <Plus size={16}/> Record Expense
                  </Button>
                  <Button onClick={() => setIsCatModalOpen(true)} variant="secondary" className="h-11 px-3 border-gray-200 dark:border-slate-600" title="Manage Categories">
                    <Settings2 size={18}/>
                  </Button>
              </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenditure Log */}
        <div className="lg:col-span-2">
            <DataTable<Expense> 
                title="Historical Ledger"
                data={filteredExpenses}
                columns={[
                    { header: 'Description', accessor: 'name', className: 'font-black text-slate-800 dark:text-white' },
                    { header: 'Category', accessor: (e) => (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">
                            <Tag size={10}/> {e.category}
                        </span>
                    ) },
                    { header: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString(), className: 'font-mono text-slate-400' },
                    { header: 'Amount', accessor: (e) => formatCurrency(e.amount), className: 'text-red-600 dark:text-red-400 font-black text-right' }
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

        {/* Analytics Card */}
        <div className="space-y-6">
            <Card className="h-96 flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-3xl">
                <div className="mb-4">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Budget Allocation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue vs Periodic Spend</p>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={90} 
                                paddingAngle={8} 
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: any) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-end">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Period Spend</p>
                        <p className="text-xl font-black text-red-500 tracking-tighter">{formatCurrency(filteredExpenseTotal)}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <TrendingDown size={18}/>
                    </div>
                </div>
            </Card>

            <Card className="bg-slate-900 border border-slate-700 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-slate-800/20 transform -rotate-12"><DollarSign size={120} /></div>
                <h4 className="text-white font-black text-sm uppercase mb-4 tracking-widest flex items-center gap-2"><Info size={14}/> Financial Tip</h4>
                <p className="text-slate-400 text-xs leading-relaxed italic relative z-10">
                    "Regularly auditing your 'Historical Ledger' against your income helps identify unnecessary operational leaks. Keeping your filtered expense total below 40% of gross revenue is a standard benchmark for high-growth businesses."
                </p>
            </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete}
        title="Delete Record"
        message="This will remove the transaction from the ledger forever. Are you absolutely certain?"
      />

      {/* Expense Management Modal */}
      <Modal title="Record Store Expense" isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
         <div className="space-y-4">
            <Input label="Description" value={newExpense.name || ''} onChange={e => setNewExpense({...newExpense, name: e.target.value})} placeholder="e.g., Monthly Electric Bill" />
            <Input label="Amount (Value)" type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} placeholder="0.00" />
            
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-500 dark:text-gray-400">Category Selection</label>
                <div className="flex gap-2">
                    <select 
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        value={newExpense.category || ''} 
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                        {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <button onClick={() => { setIsExpenseModalOpen(false); setIsCatModalOpen(true); }} className="p-2.5 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-gray-300 hover:text-primary transition-colors" title="Manage categories">
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

      {/* Category Management Modal */}
      <Modal title="Expense Categories" isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)}>
          <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Add Custom Category</p>
                  <div className="flex gap-2">
                      <input 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g., Maintenance, Marketing..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                      />
                      <Button onClick={handleAddCategory} className="px-5"><Plus size={20}/></Button>
                  </div>
              </div>

              <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Current Categories</p>
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 group">
                            <span className="font-bold text-slate-700 dark:text-white text-sm">{cat.name}</span>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && <p className="text-center py-6 text-slate-400 text-sm italic">No custom categories defined.</p>}
                  </div>
              </div>

              <div className="pt-4">
                  <Button variant="secondary" onClick={() => setIsCatModalOpen(false)} className="w-full font-black text-xs uppercase tracking-widest">Done</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};