/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { Toast, Button } from './UI';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Wallet, 
  Settings as SettingsIcon, Menu, X, LogOut, FileText, Moon, Sun, Bell, Check, AlertTriangle, ArrowRight
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        isActive 
          ? 'bg-primary text-white shadow-md shadow-primary/30' 
          : 'text-textSecondary dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { dbReady } = useSettings();
  const { toasts, notifications, markAsRead, markAllRead } = useNotification();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null; 
  }

  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'SALES'] },
    { to: '/sales', icon: ShoppingCart, label: 'POS & Sales', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'SALES'] },
    { to: '/inventory', icon: Package, label: 'Inventory', roles: ['ADMIN', 'MANAGER'] },
    { to: '/people', icon: Users, label: 'Customers & Staff', roles: ['ADMIN', 'MANAGER'] },
    { to: '/finance', icon: Wallet, label: 'Finance', roles: ['ADMIN'] },
    { to: '/reports', icon: FileText, label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
    { to: '/admin', icon: SettingsIcon, label: 'Admin', roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const getTitle = () => {
    const found = filteredMenu.find(m => m.to === location.pathname);
    if(found) return found.label;
    if(location.pathname.includes('inventory')) return 'Inventory Management';
    return 'Dashboard';
  };

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-bgLight dark:bg-slate-900 transition-colors">
      {/* DB Setup Warning Banner */}
      {!dbReady && user.role === 'ADMIN' && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-bold animate-in slide-in-from-top duration-500 z-[60] sticky top-0 no-print">
            <AlertTriangle size={18} />
            <span>Database Initialization Required: Some features are unavailable until the schema is set up.</span>
            <button 
                onClick={() => navigate('/admin')} 
                className="bg-white text-amber-600 px-3 py-1 rounded-full text-xs hover:bg-amber-50 transition-colors flex items-center gap-1"
            >
                Set Up Now <ArrowRight size={14}/>
            </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Toast Container */}
        <div className="fixed top-5 right-5 z-[100] flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
               {toasts.map(n => <Toast key={n.id} {...n} />)}
            </div>
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-bgLight dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 p-4 fixed h-full z-10 no-print transition-colors">
          <div className="flex items-center gap-3 px-4 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">E</div>
            <h1 className="text-xl font-bold text-textPrimary dark:text-white">ElifySIS</h1>
          </div>
          <nav className="flex-1">
            {filteredMenu.map(item => <SidebarItem key={item.to} {...item} />)}
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-danger hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors mt-auto">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden no-print" onClick={() => setIsMobileOpen(false)}>
            <div className="bg-white dark:bg-slate-800 w-3/4 h-full p-4 transition-colors" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                 <h1 className="text-xl font-bold text-primary">ElifySIS</h1>
                 <button onClick={() => setIsMobileOpen(false)} className="dark:text-white"><X /></button>
              </div>
              <nav>
                {filteredMenu.map(item => <SidebarItem key={item.to} {...item} onClick={() => setIsMobileOpen(false)} />)}
              </nav>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-danger hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors mt-8 w-full">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden transition-colors">
          {/* Header */}
          <header className="flex justify-between items-center mb-8 no-print">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 bg-white dark:bg-slate-800 dark:text-white rounded-lg shadow-sm" onClick={() => setIsMobileOpen(true)}>
                <Menu size={20} />
              </button>
              <h2 className="text-2xl font-bold text-textPrimary dark:text-white">{getTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors">
                  {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
               </button>
               
               {/* Notification Bell */}
               <div className="relative" ref={notifRef}>
                   <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative">
                      <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                      )}
                   </button>

                   {/* Notification Dropdown */}
                   {isNotifOpen && (
                       <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                           <div className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                               <h3 className="font-bold text-sm text-textPrimary dark:text-white">Notifications</h3>
                               {unreadCount > 0 && (
                                   <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                               )}
                           </div>
                           <div className="max-h-80 overflow-y-auto">
                               {notifications.length === 0 ? (
                                   <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                               ) : (
                                   notifications.map(notif => (
                                       <div key={notif.id} className={`p-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/20'}`}>
                                           <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-orange-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                           <div className="flex-1">
                                               <p className="text-sm font-medium text-textPrimary dark:text-white">{notif.title}</p>
                                               <p className="text-xs text-textSecondary dark:text-gray-400 mt-0.5">{notif.message}</p>
                                               <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                                           </div>
                                           {!notif.read && (
                                              <button onClick={() => markAsRead(notif.id)} className="text-primary hover:text-blue-700" title="Mark as read"><Check size={14}/></button>
                                           )}
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>
                   )}
               </div>

               <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-textPrimary dark:text-white">{user.username}</p>
                  <p className="text-xs text-textSecondary dark:text-gray-400 capitalize">{user.role}</p>
               </div>
               <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-white font-bold text-sm">
                  {user.username.substring(0,2).toUpperCase()}
               </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};