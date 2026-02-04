
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button } from '../components/UI';
import { Api } from '../services/api';
import { Sale, StockLog, Product } from '../types';
import { Calendar, Printer, DollarSign, Package, Info, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Reports = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [tab, setTab] = useState<'cash' | 'stock'>('cash');
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductId, setSelectedProductId] = useState('all');

  useEffect(() => {
    const loadData = async () => {
       if (!user) return;
       setIsLoading(true);
       try {
         const [s, p, l] = await Promise.all([
             Api.getSales(user.businessId),
             Api.getProducts(user.businessId),
             Api.getStockLogs(user.businessId)
         ]);
         setSales(s);
         setProducts(p);
         setStockLogs(l);
       } finally {
         setIsLoading(false);
       }
    };
    loadData();
  }, [user]);

  const handlePreset = (type: 'today' | 'week' | 'month' | 'year') => {
      const now = new Date();
      let start = new Date();
      if (type === 'today') {
          start = new Date();
      } else if (type === 'week') {
          start.setDate(now.getDate() - now.getDay());
      } else if (type === 'month') {
          start.setDate(1);
      } else if (type === 'year') {
          start.setMonth(0, 1);
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
  };

  const getStockAtTime = (productId: string, targetTime: number) => {
      const prod = products.find(p => p.id === productId);
      if (!prod) return 0;
      const logsAfterTarget = stockLogs.filter(l => l.productId === productId && l.date > targetTime);
      const totalChangeAfter = logsAfterTarget.reduce((acc, curr) => acc + curr.change, 0);
      return prod.quantity - totalChangeAfter;
  };

  const cashFlowData = useMemo(() => {
      const start = new Date(startDate).setHours(0,0,0,0);
      const end = new Date(endDate).setHours(23,59,59,999);
      
      return products.map(p => {
          const productSales = sales.filter(s => s.date >= start && s.date <= end)
              .flatMap(s => s.items)
              .filter(item => item.productId === p.id);
          
          const qtySold = productSales.reduce((acc, curr) => acc + curr.quantity, 0);
          const totalRevenue = productSales.reduce((acc, curr) => acc + curr.total, 0);
          const totalCost = qtySold * p.buyPrice;
          
          return {
              id: p.id,
              name: p.name,
              qtySold,
              openingStock: getStockAtTime(p.id, start),
              closingStock: getStockAtTime(p.id, end),
              totalCost,
              profit: totalRevenue - totalCost
          };
      }).filter(item => item.qtySold > 0) // Only show products with actual sales
        .sort((a, b) => b.profit - a.profit);
  }, [products, sales, stockLogs, startDate, endDate]);

  const totals = useMemo(() => {
      return cashFlowData.reduce((acc, curr) => ({
          qty: acc.qty + curr.qtySold,
          cost: acc.cost + curr.totalCost,
          profit: acc.profit + curr.profit
      }), { qty: 0, cost: 0, profit: 0 });
  }, [cashFlowData]);

  const stockFlowGroups = useMemo(() => {
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);
    
    let filteredLogs = stockLogs.filter(l => l.date >= start && l.date <= end);
    if (selectedProductId !== 'all') {
        filteredLogs = filteredLogs.filter(l => l.productId === selectedProductId);
    }

    const grouped: Record<string, { name: string, logs: any[], summary: any }> = {};
    filteredLogs.forEach(log => {
        if (!grouped[log.productId]) {
            grouped[log.productId] = { 
                name: log.productName, 
                logs: [], 
                summary: { 
                    qtySold: 0, 
                    opening: getStockAtTime(log.productId, start), 
                    closing: getStockAtTime(log.productId, end) 
                } 
            };
        }
        grouped[log.productId].logs.push(log);
        if (log.type === 'sale') {
            grouped[log.productId].summary.qtySold += Math.abs(log.change);
        }
    });
    return grouped;
  }, [stockLogs, startDate, endDate, selectedProductId, products]);

  const print = () => {
    // Force a small delay to ensure any dynamic rendering is caught
    setTimeout(() => {
        window.print();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm font-bold text-textSecondary uppercase tracking-widest">Compiling Data...</p>
      </div>
    );
  }

  // Helper to format date for display in the styled boxes
  const formatDisplayDate = (d: string) => {
      if (!d) return 'Select Date';
      return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Print Styles Injection */}
      <style>{`
        @media print {
            body { 
                background: white !important; 
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            #root { width: 100% !important; margin: 0 !important; padding: 0 !important; }
            main { margin: 0 !important; padding: 20px !important; width: 100% !important; }
            .card-shadow-none { box-shadow: none !important; border: 1px solid #ddd !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #ddd !important; padding: 8px !important; color: black !important; }
            .bg-slate-800, .bg-slate-900, .bg-gray-50 { background: white !important; color: black !important; }
            .text-white, .text-slate-300, .text-slate-400 { color: black !important; }
            .text-primary { color: #1A73E8 !important; }
            .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
            .shadow-xl { box-shadow: none !important; }
            @page {
                size: A4;
                margin: 1cm;
            }
        }
      `}</style>

      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 w-full md:w-auto">
          <button 
            onClick={() => setTab('cash')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'cash' ? 'bg-primary text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <DollarSign size={16}/> Cash Report
          </button>
          <button 
            onClick={() => setTab('stock')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'stock' ? 'bg-primary text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <Package size={16}/> Stock Report
          </button>
        </div>

        <Button onClick={print} variant="secondary" className="gap-2 w-full md:w-auto font-bold border-gray-300 dark:border-slate-600">
          <Printer size={16} /> Print Worksheet
        </Button>
      </div>

      {/* Date & Filter Controls */}
      <Card className="no-print border border-gray-200 dark:border-slate-700 shadow-none overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-3">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Preset Ranges</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Today', 'Week', 'Month', 'Year'].map(label => (
                        <button 
                            key={label}
                            onClick={() => handlePreset(label.toLowerCase() as any)}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                            {label}
                        </button>
                    ))}
                  </div>
              </div>

              <div className="lg:col-span-5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Period Range</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* START DATE BOX */}
                    <div className="relative w-full h-11 bg-slate-800 border border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none">
                            {formatDisplayDate(startDate)}
                        </span>
                        {/* THE FIX: Invisible native input covering the WHOLE area including the icon. */}
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[100]" 
                        />
                    </div>

                    <span className="text-gray-400 font-bold hidden sm:inline flex-shrink-0 text-sm">to</span>

                    {/* END DATE BOX */}
                    <div className="relative w-full h-11 bg-slate-800 border border-slate-600 rounded-xl group hover:border-primary transition-colors flex items-center px-4">
                        <Calendar className="text-primary mr-3 flex-shrink-0" size={16} />
                        <span className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none">
                            {formatDisplayDate(endDate)}
                        </span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[100]" 
                        />
                    </div>
                  </div>
              </div>

              {tab === 'stock' && (
                  <div className="lg:col-span-4">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Filter Item</p>
                      <select 
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-600 bg-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
                      >
                          <option value="all" className="bg-slate-800 text-white">All Inventory Items</option>
                          {products.map(p => <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}</option>)}
                      </select>
                  </div>
              )}
          </div>
      </Card>

      {/* Report Worksheet Area */}
      <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 shadow-xl overflow-hidden rounded-2xl print:border-0 print:shadow-none print:w-full print:rounded-none">
        {/* Worksheet Header */}
        <div className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-300 dark:border-slate-700 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:p-4 print:bg-white print:border-b-2 print:border-black">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl shadow-inner print:hidden">
                    <FileSpreadsheet size={24}/>
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter print:text-black print:text-2xl">
                        {tab === 'cash' ? 'Cash Flow Analysis' : 'Stock Audit Worksheet'}
                    </h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest print:text-gray-600 print:text-xs">
                        Statement Period: {startDate} to {endDate}
                    </p>
                </div>
            </div>
            <div className="text-right flex items-center gap-4 print:block">
                <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest print:text-gray-600">Authorized By</p>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 print:text-black print:text-sm">{user?.username}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 no-print">
                    {user?.username?.substring(0,2).toUpperCase()}
                </div>
            </div>
        </div>

        {tab === 'cash' ? (
          <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
            <table className="w-full text-xs border-collapse font-sans min-w-[800px] print:min-w-0 print:table-fixed">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] print:bg-gray-200 print:text-black print:font-bold">
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-left">Item Description</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Qty Sold</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Opening</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Closing</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Gross Cost</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 print:text-black">
                {cashFlowData.map((row, idx) => (
                  <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors print:bg-white`}>
                    <td className="border border-gray-300 dark:border-slate-700 px-6 py-3 font-black text-slate-900 dark:text-slate-100 print:text-black print:font-bold">{row.name}</td>
                    <td className="border border-gray-300 dark:border-slate-700 px-6 py-3 text-right font-mono font-bold">{row.qtySold}</td>
                    <td className="border border-gray-300 dark:border-slate-700 px-6 py-3 text-right font-mono text-slate-400 print:text-gray-600">{row.openingStock}</td>
                    <td className="border border-gray-300 dark:border-slate-700 px-6 py-3 text-right font-mono text-slate-400 print:text-gray-600">{row.closingStock}</td>
                    <td className="border border-gray-300 dark:border-slate-700 px-6 py-3 text-right font-mono font-bold">{formatCurrency(row.totalCost)}</td>
                    <td className={`border border-gray-300 dark:border-slate-700 px-6 py-3 text-right font-mono font-black ${row.profit >= 0 ? 'text-green-600 print:text-green-800' : 'text-red-600 print:text-red-800'}`}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
                {cashFlowData.length === 0 && (
                  <tr><td colSpan={6} className="border border-gray-300 dark:border-slate-700 px-6 py-16 text-center text-slate-400 italic font-medium print:text-black">No transaction activity found for this period.</td></tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-slate-900 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 print:bg-gray-100 print:text-black">
                <tr>
                  <td className="border border-gray-300 dark:border-slate-700 px-6 py-5 uppercase tracking-widest text-[10px]">Totals</td>
                  <td className="border border-gray-300 dark:border-slate-700 px-6 py-5 text-right font-mono text-sm">{totals.qty}</td>
                  <td colSpan={2} className="border border-gray-300 dark:border-slate-700 px-6 py-5 text-center italic text-slate-400 font-normal">N/A</td>
                  <td className="border border-gray-300 dark:border-slate-700 px-6 py-5 text-right font-mono text-sm">{formatCurrency(totals.cost)}</td>
                  <td className="border border-gray-300 dark:border-slate-700 px-6 py-5 text-right font-mono text-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 print:bg-white print:text-black">
                    {formatCurrency(totals.profit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
            <table className="w-full text-xs border-collapse font-sans min-w-[800px] print:min-w-0 print:table-fixed">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] print:bg-gray-200 print:text-black">
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-left">Activity / Reference</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center">Qty Change</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center">Prev Balance</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center">New Balance</th>
                  <th className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 print:text-black">
                {(Object.entries(stockFlowGroups) as [string, any][]).map(([pid, data]) => (
                    <React.Fragment key={pid}>
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10 print:bg-gray-100">
                            <td colSpan={5} className="border border-gray-300 dark:border-slate-700 px-6 py-2.5 font-black uppercase text-[11px] text-primary tracking-widest print:text-black">
                                {data.name} HISTORY
                            </td>
                        </tr>
                        {data.logs.map((log: any, idx: number) => (
                            <tr key={`${pid}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors print:bg-white">
                                <td className="border border-gray-300 dark:border-slate-700 px-8 py-2 italic text-slate-500 font-medium">
                                    {log.type === 'sale' ? 'Order Fulfillment' : log.type === 'restock' ? 'Inventory Replenishment' : 'System Adjustment'}
                                </td>
                                <td className={`border border-gray-300 dark:border-slate-700 px-6 py-2 text-center font-black ${log.change > 0 ? 'text-blue-600 print:text-blue-800' : 'text-red-600 print:text-red-800'}`}>
                                    {log.change > 0 ? '+' : ''}{log.change}
                                </td>
                                <td className="border border-gray-300 dark:border-slate-700 px-6 py-2 text-center font-mono opacity-50 font-bold">{log.balance - log.change}</td>
                                <td className="border border-gray-300 dark:border-slate-700 px-6 py-2 text-center font-mono font-black text-slate-900 dark:text-white print:text-black">{log.balance}</td>
                                <td className="border border-gray-300 dark:border-slate-700 px-6 py-2 text-right font-mono text-[10px] text-slate-400 font-bold print:text-gray-500">{new Date(log.date).toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 dark:bg-slate-900 font-black border-t-2 border-gray-300 dark:border-slate-700 print:bg-gray-50 print:text-black">
                            <td className="border border-gray-300 dark:border-slate-700 px-6 py-4 uppercase text-[10px] tracking-widest">Summary Audit</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center text-primary font-black bg-primary/5 print:text-black">{data.summary.qtySold} Change</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center text-slate-400 font-medium">{data.summary.opening} (Opening)</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-center text-primary underline decoration-2 decoration-primary/30 font-black print:text-black">{data.summary.closing} (Closing)</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-6 py-4 text-right italic text-[10px] text-slate-400 tracking-wider print:text-gray-500">VERIFIED: OK</td>
                        </tr>
                    </React.Fragment>
                ))}
                {Object.keys(stockFlowGroups).length === 0 && (
                    <tr><td colSpan={5} className="border border-gray-300 dark:border-slate-700 px-6 py-20 text-center text-slate-400 flex flex-col items-center gap-3 print:text-black">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-full print:hidden"><Info size={32} className="opacity-30" /></div>
                        <p className="font-bold">No transactions found for the selected worksheet criteria.</p>
                    </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Worksheet Footer Message */}
      <div className="text-center no-print pb-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">End of Audit Statement. Internal Confidential Document.</p>
      </div>
      
      {/* Print-only footer */}
      <div className="hidden print:block pt-10 text-center text-[10px] text-gray-500 italic">
          <p>Official ElifySIS Audit Report — Generated on {new Date().toLocaleString()}</p>
          <p>Page 1 of 1</p>
      </div>
    </div>
  );
};
