
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card } from '../components/UI';
import { Api } from '../services/api';
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, Lock, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="flex items-center gap-4 min-w-0 h-full">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100 flex-shrink-0`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
    <div className="min-w-0 flex-1 overflow-hidden">
      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider truncate mb-0.5" title={title}>
        {title}
      </p>
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate tracking-tight" title={String(value)}>
        {value}
      </h3>
    </div>
  </Card>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const { formatCurrency } = useSettings();
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const s = await Api.getDashboardStats(user.businessId);
      const sales = await Api.getSales(user.businessId);
      setStats(s);

      if (s.lowStockCount > 0 && s.lowStockNames) {
          const hasNotified = sessionStorage.getItem('lowStockNotified');
          if (!hasNotified) {
              const productList = s.lowStockNames.join(', ');
              const message = s.lowStockCount === 1 
                ? `Warning: "${productList}" is running low on stock!` 
                : `Warning: ${s.lowStockCount} items are running low: ${productList}`;
              
              notify(message, 'warning', 'Low Inventory Alert');
              sessionStorage.setItem('lowStockNotified', 'true');
          }
      }

      const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
      });

      const chartData = last7Days.map(date => {
          const dateKey = date.toDateString();
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          const daySales = sales
            .filter((s: any) => new Date(s.date).toDateString() === dateKey)
            .reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

          return { name: dayName, sales: daySales };
      });
      
      setSalesData(chartData);
    };
    loadData();
  }, [user]);

  if (!stats) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const isRestricted = ['CASHIER', 'SALES'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {!isRestricted ? (
          <>
            <StatCard title="Total Sales" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="bg-blue-600 text-blue-600" />
            <StatCard title="GROSS PROFIT" value={formatCurrency(stats.grossProfit)} icon={TrendingUp} color="bg-green-600 text-green-600" />
            <StatCard title="Customers" value={stats.customerCount} icon={Users} color="bg-purple-600 text-purple-600" />
          </>
        ) : (
          <Card className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 min-w-0">
             <div className="p-3 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                <Lock size={24} />
             </div>
             <div className="min-w-0 flex-1 overflow-hidden">
               <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate mb-0.5">Financials</p>
               <h3 className="text-xl font-black text-gray-300 dark:text-gray-600 truncate uppercase">Restricted</h3>
             </div>
          </Card>
        )}
        <StatCard title="Products" value={stats.productCount} icon={Package} color="bg-orange-600 text-orange-600" />
      </div>

      {!isRestricted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-h-[400px] flex flex-col min-w-0 overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate mb-4">Revenue Trends</h3>
            <div className="flex-1 w-full min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} 
                      interval="preserveStartEnd" 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} />
                  <Tooltip 
                      cursor={{ fill: '#F1F5F9' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                      formatter={(value: any) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#1A73E8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="min-h-[400px] flex flex-col min-w-0 overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate mb-4">Daily Volume</h3>
            <div className="flex-1 w-full min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} />
                  <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                      formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="sales" fill="#8A3FFC" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3">
           <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm text-primary mb-2">
              <Store size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Welcome, {user?.username}!</h3>
           <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Your account is active as a <strong>{user?.role}</strong>. Access has been tailored to your specific store responsibilities.</p>
        </div>
      )}
    </div>
  );
};
