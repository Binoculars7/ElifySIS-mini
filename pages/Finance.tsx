

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Button, Input, Modal, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Expense } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Finance = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<any>({ income: 0, expense: 0, profit: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const e = await Api.getExpenses(user.businessId);
    const s = await Api.getDashboardStats(user.businessId);
    setExpenses(e);
    setStats({ income: s.totalRevenue, expense: s.totalExpenses, profit: s.netProfit });
  };

  useEffect(() => { loadData(); }, [user]);

  const handleAddExpense = async () => {
    if(!newExpense.amount || !newExpense.name || !user) return;
    await Api.addExpense({ ...newExpense, date: Date.now(), businessId: user.businessId } as Expense);
    setIsModalOpen(false);
    loadData();
  };

  const confirmDelete = async () => {
      if (deleteId) {
          await Api.deleteExpense(deleteId);
          loadData();
          setDeleteId(null);
      }
  };

  const chartData = [
    { name: 'Income', value: stats.income, color: '#1A73E8' },
    { name: 'Expenses', value: stats.expense, color: '#EF4444' },
    { name: 'Profit', value: stats.profit, color: '#22C55E' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-green-500">
           <p className="text-textSecondary mb-1 flex items-center gap-2"><TrendingUp size={16}/> Gross Income</p>
           <h3 className="text-2xl font-bold">{formatCurrency(stats.income)}</h3>
        </Card>
        <Card className="border-l-4 border-red-500">
           <p className="text-textSecondary mb-1 flex items-center gap-2"><TrendingDown size={16}/> Total Expenditure</p>
           <h3 className="text-2xl font-bold">{formatCurrency(stats.expense)}</h3>
        </Card>
        <Card className="border-l-4 border-blue-500">
           <p className="text-textSecondary mb-1 flex items-center gap-2"><DollarSign size={16}/> Net Profit</p>
           <h3 className="text-2xl font-bold">{formatCurrency(stats.profit)}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Expenditure Log</h3>
                <Button onClick={() => setIsModalOpen(true)}>Add Expense</Button>
            </div>
            <DataTable<Expense> 
                data={expenses}
                columns={[
                    { header: 'Description', accessor: 'name' },
                    { header: 'Category', accessor: 'category' },
                    { header: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString() },
                    { header: 'Amount', accessor: (e) => formatCurrency(e.amount), className: 'text-red-600 font-bold' }
                ]}
                actions={(item) => (
                    <button className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                        <Trash2 size={16}/>
                    </button>
                )}
            />
        </div>
        <div>
            <Card className="h-80">
                <h3 className="font-bold mb-4">Cash Flow Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to remove this expense record? This will affect your net profit calculation."
      />

      <Modal title="Record Expense" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
         <div className="space-y-4">
            <Input label="Expense Name" value={newExpense.name || ''} onChange={e => setNewExpense({...newExpense, name: e.target.value})} placeholder="e.g., Utility Bill" />
            <Input label="Amount" type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} />
            <Select label="Category" options={[{label:'Utilities', value:'Utilities'}, {label:'Rent', value:'Rent'}, {label:'Maintenance', value:'Maintenance'}, {label:'Salary', value:'Salary'}]} onChange={e => setNewExpense({...newExpense, category: e.target.value})} />
            <div className="flex justify-end gap-3 mt-6">
                 <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button onClick={handleAddExpense}>Save Expense</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
