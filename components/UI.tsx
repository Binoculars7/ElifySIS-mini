/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, AlertTriangle, Check, Info, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { Notification } from '../types';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-cardBg dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-xl p-5 text-textPrimary dark:text-gray-100 transition-colors ${className || ''}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-secondary focus:ring-primary",
    secondary: "bg-white dark:bg-slate-700 text-textPrimary dark:text-gray-100 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-gray-200",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "bg-transparent text-textSecondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className || ''}`} {...props} />;
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="mb-4 w-full">
    {label && <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1.5">{label}</label>}
    <input 
      className={`w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${className || ''}`}
      {...props} 
    />
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: {value: string, label: string}[];
}
export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => (
    <div className="mb-4 w-full">
      {label && <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1.5">{label}</label>}
      <select 
        className={`w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${className || ''}`}
        {...props} 
      >
        {options.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-700 text-white">{opt.label}</option>)}
      </select>
    </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex justify-between items-center p-5 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h3 className="text-lg font-bold text-textPrimary dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>
        <div className="p-5 text-textPrimary dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Confirmation Modal ---
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => { onConfirm(); onClose(); }} className="flex-1">Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Toast Component ---
export const Toast: React.FC<Notification> = ({ id, message, type, title }) => {
    const { removeNotification } = useNotification();
    
    const colors = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
        warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
    };

    const icons = {
        success: <Check size={18} />,
        error: <AlertTriangle size={18} />,
        warning: <AlertCircle size={18} />,
        info: <Info size={18} />
    };

    return (
        <div className={`mb-3 p-4 rounded-lg shadow-lg border flex items-start gap-3 w-80 animate-in slide-in-from-right duration-300 ${colors[type]}`}>
            <div className="mt-0.5">{icons[type]}</div>
            <div className="flex-1">
                {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
                <p className="text-sm">{message}</p>
            </div>
            <button onClick={() => removeNotification(id)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X size={16} />
            </button>
        </div>
    );
};

// --- Data Table ---
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  title?: string;
}

export const DataTable = <T extends { id: string }>({ data, columns, actions, title }: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when data changes
  useEffect(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [data.length]);

  const filteredData = data.filter((item) =>
    Object.values(item as any).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-cardBg dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
        {title && <h3 className="text-lg font-bold text-textPrimary dark:text-white">{title}</h3>}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary outline-none"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              {columns.map((col, idx) => (
                <th key={idx} className="p-4 text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && <th className="p-4 text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-textPrimary dark:text-gray-200">
            {paginatedData.length === 0 ? (
                <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center text-textSecondary dark:text-gray-400">
                        No records found.
                    </td>
                </tr>
            ) : (
                paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    {columns.map((col, idx) => (
                    <td key={idx} className={`p-4 text-sm ${col.className || ''}`}>
                        {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                    ))}
                    {actions && (
                    <td className="p-4 text-right">
                        {actions(item)}
                    </td>
                    )}
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <span className="text-sm text-textSecondary dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 text-textPrimary dark:text-gray-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 text-textPrimary dark:text-gray-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};