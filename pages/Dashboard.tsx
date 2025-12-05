/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card } from '../components/UI';
import { Api } from '../services/api';
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
    <div>
      <p className="text-sm text-textSecondary dark:text-gray-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-textPrimary dark:text-white">{value}</h3>
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

      // Low Stock Notification Check - Once per session
      if (s.lowStockCount > 0) {
          const hasNotified = sessionStorage.getItem('lowStockNotified');
          if (!hasNotified) {
              notify(`Warning: ${s.lowStockCount} products are running low on stock!`, 'warning', 'Low Inventory Alert');
              sessionStorage.setItem('lowStockNotified', 'true');
          }
      }

      // Prepare chart data (Last 7 Days)
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

  // Restrict financial view for CASHIER and SALES roles
  const isRestricted = ['CASHIER', 'SALES'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!isRestricted ? (
          <>
            <StatCard title="Total Sales" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="bg-blue-600 text-blue-600" />
            <StatCard title="Net Profit" value={formatCurrency(stats.netProfit)} icon={TrendingUp} color="bg-green-600 text-green-600" />
            <StatCard title="Customers" value={stats.customerCount} icon={Users} color="bg-purple-600 text-purple-600" />
          </>
        ) : (
          <Card className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
             <div className="p-3 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                <Lock size={24} />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Financials</p>
               <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">Restricted</h3>
             </div>
          </Card>
        )}
        <StatCard title="Products" value={stats.productCount} icon={Package} color="bg-orange-600 text-orange-600" />
        {isRestricted && (
           <StatCard title="Transactions" value={stats.saleCount} icon={ShoppingBag} color="bg-blue-600 text-blue-600" />
        )}
      </div>

      {!isRestricted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-80 flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">Revenue Trends</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11 }} 
                      interval="preserveStartEnd" 
                      minTickGap={15}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                      cursor={{ fill: '#F1F5F9' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value: any) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#1A73E8" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="h-80 flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">Sales Volume</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11 }} 
                      interval="preserveStartEnd" 
                      minTickGap={15}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none' }} 
                      formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="sales" fill="#8A3FFC" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900 rounded-xl p-8 text-center text-blue-800 dark:text-blue-200">
           <h3 className="text-xl font-bold mb-2">Welcome back, {user?.username}!</h3>
           <p>You have access to your assigned modules. Please use the sidebar to navigate.</p>
        </div>
      )}
    </div>
  );
};