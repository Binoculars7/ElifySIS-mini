

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Button } from '../components/UI';
import { Api } from '../services/api';
import { Sale, StockLog } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileBarChart, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Reports = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [tab, setTab] = useState<'sales' | 'stock'>('sales');
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
       if (!user) return;
       const s = await Api.getSales(user.businessId);
       setSales(s);
       setStockLogs(await Api.getStockLogs(user.businessId));

       // Process Sales Chart Data (Last 7 days)
       const last7Days = [...Array(7)].map((_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - (6 - i));
         return d.toLocaleDateString('en-US', { weekday: 'short' });
       });

       const grouped = s.reduce((acc: any, curr) => {
         const date = new Date(curr.date).toLocaleDateString('en-US', { weekday: 'short' });
         acc[date] = (acc[date] || 0) + curr.totalAmount;
         return acc;
       }, {});

       setSalesChartData(last7Days.map(day => ({ name: day, amount: grouped[day] || 0 })));
    };
    init();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button onClick={() => setTab('sales')} className={`pb-2 px-4 font-medium flex items-center gap-2 ${tab === 'sales' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}>
            <TrendingUp size={18}/> Sales Report
        </button>
        <button onClick={() => setTab('stock')} className={`pb-2 px-4 font-medium flex items-center gap-2 ${tab === 'stock' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}>
            <Package size={18}/> Stock Movement
        </button>
      </div>

      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="h-80">
                <h3 className="font-bold mb-4">Weekly Revenue</h3>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#1A73E8" radius={[4, 4, 0, 0]} name="Revenue" />
                   </BarChart>
                </ResponsiveContainer>
             </Card>
             <Card className="h-80">
                <h3 className="font-bold mb-4">Sales Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="amount" stroke="#8A3FFC" strokeWidth={3} />
                   </LineChart>
                </ResponsiveContainer>
             </Card>
          </div>

          <DataTable<Sale>
            title="Detailed Sales Log"
            data={sales}
            columns={[
                { header: 'Date', accessor: (s) => new Date(s.date).toLocaleString() },
                { header: 'Customer', accessor: 'customerName' },
                { header: 'Items', accessor: (s) => s.items.map(i => i.productName).join(', ') },
                { header: 'Total', accessor: (s) => formatCurrency(s.totalAmount), className: 'font-bold' },
                { header: 'Payment', accessor: 'paymentMethod' }
            ]}
          />
        </div>
      )}

      {tab === 'stock' && (
          <div className="space-y-6">
              <DataTable<StockLog>
                title="Stock Audit Trail"
                data={stockLogs.sort((a,b) => b.date - a.date)}
                columns={[
                    { header: 'Date', accessor: (l) => new Date(l.date).toLocaleString() },
                    { header: 'Product', accessor: 'productName', className: 'font-medium' },
                    { header: 'Type', accessor: (l) => (
                        <span className={`uppercase text-xs font-bold px-2 py-1 rounded ${
                            l.type === 'restock' ? 'bg-blue-100 text-blue-700' : 
                            l.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                        }`}>{l.type}</span>
                    )},
                    { header: 'Change', accessor: (l) => (
                        <span className={l.change > 0 ? 'text-blue-600' : 'text-red-500'}>
                            {l.change > 0 ? '+' : ''}{l.change}
                        </span>
                    )},
                    { header: 'Balance', accessor: 'balance' }
                ]}
              />
          </div>
      )}
    </div>
  );
};
