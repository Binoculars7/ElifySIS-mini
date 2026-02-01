
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Button, Modal, Input, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { User, UserRole } from '../types';
import { Shield, UserPlus, Trash2, Edit, CheckCircle, XCircle, Power, Globe, Database, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Admin = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'database'>('users');
  const [copied, setCopied] = useState(false);

  // Delete Modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!user) return;
    setUsers(await Api.getUsers(user.businessId));
  };

  useEffect(() => { loadUsers(); }, [user]);

  const handleSaveUser = async () => {
    if (!formData.username || !formData.email || !user) return;
    setErrorMsg('');
    
    try {
        const isEditing = !!formData.id;
        
        // Final password to save
        let passwordToSave = formData.password;

        if (isEditing) {
            // Only update password if a NEW one was provided in the extra state
            if (newPassword.trim()) {
                passwordToSave = newPassword.trim();
            }
            // else: passwordToSave remains what was loaded from the DB row
        } else {
            // New user: Use provided password or fallback to 'password'
            passwordToSave = newPassword.trim() || 'password';
        }

        const userToSave: User = {
          ...formData,
          businessId: user.businessId, 
          password: passwordToSave,
          isActive: formData.isActive ?? true,
          role: formData.role || 'CASHIER',
          createdAt: formData.createdAt || Date.now()
        } as User;

        await Api.saveUser(userToSave);
        
        setIsModalOpen(false);
        setFormData({});
        setNewPassword('');
        loadUsers();
    } catch (e: any) {
        setErrorMsg(e.message || "Failed to save user.");
    }
  };

  const handleToggleStatus = async (userItem: User) => {
      if (userItem.id === user?.id) {
          alert("Action Denied: You cannot deactivate your own account.");
          return;
      }
      try {
          await Api.saveUser({ ...userItem, isActive: !userItem.isActive });
          loadUsers();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const openDeleteModal = (id: string) => {
    if (id === user?.id) {
        alert("Action Denied: You cannot delete your own administrator account.");
        return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await Api.deleteUser(deleteId);
      loadUsers();
      setDeleteId(null);
    }
  };

  const sqlSchema = `-- ElifySIS Supabase Schema Initialization
-- Run this in your Supabase SQL Editor

-- 1. CLEANUP & UPDATES
ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "users_id_fkey";
ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "users_id_fkey1";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" BIGINT NOT NULL
);

-- 3. SECURITY: Enable RLS but add a Public Access Policy for Login
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON "users";
CREATE POLICY "Enable read access for all users" ON "users" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON "users";
CREATE POLICY "Enable insert for all users" ON "users" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON "users";
CREATE POLICY "Enable update for all users" ON "users" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON "users";
CREATE POLICY "Enable delete for all users" ON "users" FOR DELETE USING (true);

-- 4. STANDARD TABLES
CREATE TABLE IF NOT EXISTS "categories" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "expenseCategories" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "products" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "quantity" INTEGER DEFAULT 0, "buyPrice" NUMERIC(15, 2) DEFAULT 0, "sellPrice" NUMERIC(15, 2) DEFAULT 0, "category" TEXT, "supplierId" TEXT, "lastUpdated" BIGINT);
CREATE TABLE IF NOT EXISTS "customers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "phone" TEXT, "email" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "employees" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "gender" TEXT, "email" TEXT, "phone" TEXT, "jobRole" TEXT, "hiredDate" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "suppliers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "sales" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "customerId" TEXT, "customerName" TEXT, "items" JSONB NOT NULL DEFAULT '[]'::jsonb, "totalAmount" NUMERIC(15, 2) DEFAULT 0, "date" BIGINT NOT NULL, "paymentMethod" TEXT, "status" TEXT DEFAULT 'Pending');
CREATE TABLE IF NOT EXISTS "expenses" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "amount" NUMERIC(15, 2) DEFAULT 0, "date" BIGINT NOT NULL, "category" TEXT);
CREATE TABLE IF NOT EXISTS "stockLogs" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "productId" TEXT NOT NULL, "productName" TEXT NOT NULL, "change" INTEGER NOT NULL, "type" TEXT NOT NULL, "date" BIGINT NOT NULL, "balance" INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS "settings" ("businessId" TEXT PRIMARY KEY, "currency" TEXT DEFAULT 'USD', "currencySymbol" TEXT DEFAULT '$');
CREATE TABLE IF NOT EXISTS "notifications" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT, "type" TEXT DEFAULT 'info', "read" BOOLEAN DEFAULT FALSE, "timestamp" BIGINT NOT NULL);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = (u: User) => {
      setFormData(u);
      setNewPassword(''); // Clear new password input for edits
      setIsModalOpen(true);
      setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-2">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('database')} 
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'database' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        >
          Database Setup
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <Card className="mb-8 border-l-4 border-purple-500">
              <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                     <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full h-fit"><Globe size={24}/></div>
                     <div>
                         <h3 className="text-lg font-bold text-textPrimary dark:text-white">Store Configuration</h3>
                         <p className="text-sm text-textSecondary dark:text-gray-400">Manage global settings for your business.</p>
                         
                         <div className="mt-4 flex items-center gap-4">
                             <div className="w-64">
                                <Select 
                                    label="System Currency" 
                                    value={settings.currency} 
                                    onChange={(e) => {
                                        const symbols: Record<string, string> = { 'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'KES': 'KSh', 'GHS': 'GH₵', 'INR': '₹', 'ZAR': 'R', 'CAD': 'CA$', 'AUD': 'AU$' };
                                        updateSettings({ 
                                            currency: e.target.value,
                                            currencySymbol: symbols[e.target.value] || e.target.value 
                                        });
                                    }}
                                    options={[
                                        { value: 'USD', label: '$ - US Dollar (USD)' },
                                        { value: 'EUR', label: '€ - Euro (EUR)' },
                                        { value: 'GBP', label: '£ - British Pound (GBP)' },
                                        { value: 'NGN', label: '₦ - Nigerian Naira (NGN)' },
                                        { value: 'KES', label: 'KSh - Kenyan Shilling (KES)' },
                                        { value: 'GHS', label: 'GH₵ - Ghanaian Cedi (GHS)' },
                                        { value: 'INR', label: '₹ - Indian Rupee (INR)' },
                                        { value: 'ZAR', label: 'R - South African Rand (ZAR)' },
                                        { value: 'CAD', label: 'CA$ - Canadian Dollar (CAD)' },
                                        { value: 'AUD', label: 'AU$ - Australian Dollar (AUD)' },
                                    ]}
                                />
                             </div>
                         </div>
                     </div>
                  </div>
              </div>
          </Card>

          <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-bold text-textPrimary dark:text-white">User Accounts</h2>
                <p className="text-textSecondary dark:text-gray-400">Control who can access your system.</p>
             </div>
             <Button onClick={() => { setFormData({}); setNewPassword(''); setIsModalOpen(true); setErrorMsg(''); }} className="gap-2">
                <UserPlus size={18} /> Add User
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             <Card className="flex items-center gap-4 border-l-4 border-primary">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"><Shield size={24}/></div>
                <div>
                   <p className="text-sm text-gray-500">Total Admins</p>
                   <h3 className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</h3>
                </div>
             </Card>
             <Card className="flex items-center gap-4 border-l-4 border-green-500">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full"><CheckCircle size={24}/></div>
                <div>
                   <p className="text-sm text-gray-500">Active Users</p>
                   <h3 className="text-2xl font-bold">{users.filter(u => u.isActive).length}</h3>
                </div>
             </Card>
             <Card className="flex items-center gap-4 border-l-4 border-red-500">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full"><XCircle size={24}/></div>
                <div>
                   <p className="text-sm text-gray-500">Inactive Users</p>
                   <h3 className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</h3>
                </div>
             </Card>
          </div>

          <DataTable<User>
            title="Registered Users"
            data={users}
            columns={[
              { header: 'Username', accessor: 'username', className: 'font-bold' },
              { header: 'Email', accessor: 'email' },
              { header: 'Role', accessor: (u) => (
                 <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                     u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                     u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                     u.role === 'SALES' ? 'bg-orange-100 text-orange-700' :
                     'bg-gray-100 text-gray-700'
                 }`}>{u.role}</span>
              )},
              { header: 'Status', accessor: (u) => (
                 <span className={`flex items-center gap-1 text-xs font-bold ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    {u.isActive ? <CheckCircle size={14}/> : <XCircle size={14}/>} {u.isActive ? 'Active' : 'Inactive'}
                 </span>
              )},
              { header: 'Created', accessor: (u) => new Date(u.createdAt).toLocaleDateString() }
            ]}
            actions={(userItem) => (
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => handleToggleStatus(userItem)}
                        className={`p-1.5 rounded-lg border ${userItem.id === user?.id ? 'text-gray-300 border-gray-100 cursor-not-allowed' : userItem.isActive ? 'text-orange-500 border-orange-100 hover:bg-orange-50' : 'text-green-500 border-green-100 hover:bg-green-50'}`}
                        disabled={userItem.id === user?.id}
                        title={userItem.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                        <Power size={18}/>
                    </button>
                    <button onClick={() => handleEditClick(userItem)} className="text-blue-600 border border-blue-100 hover:bg-blue-50 p-1.5 rounded-lg"><Edit size={18}/></button>
                    <button 
                      onClick={() => openDeleteModal(userItem.id)} 
                      className={`p-1.5 rounded-lg border ${userItem.id === user?.id ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-red-500 border-red-100 hover:bg-red-50'}`}
                      disabled={userItem.id === user?.id}
                    >
                      <Trash2 size={18}/>
                    </button>
                </div>
            )}
          />
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <Card className="border-l-4 border-blue-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"><Database size={24}/></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-textPrimary dark:text-white">Supabase Schema Initialization</h3>
                <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">
                  To ensure the application functions correctly without schema errors, copy the SQL below and run it in your 
                  <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" className="text-primary hover:underline ml-1">Supabase SQL Editor</a>.
                </p>
                <div className="mt-6 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                      {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                      {copied ? 'Copied!' : 'Copy Schema'}
                    </Button>
                  </div>
                  <pre className="p-6 bg-slate-950 text-slate-300 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px] custom-scrollbar">
                    {sqlSchema}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Delete User" 
        message="Are you sure you want to delete this user? This account will be permanently removed."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit User Account" : "Add New User Account"}>
        <div className="space-y-4">
           {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200">{errorMsg}</div>}
           <Input label="Display Username" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} />
           <Input label="Authentication Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
           
           <div className="space-y-1.5">
             <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">{formData.id ? "Change Password" : "Set Password"}</label>
             <input 
               type="password" 
               className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
               value={newPassword}
               onChange={e => setNewPassword(e.target.value)}
               placeholder={formData.id ? "Leave empty to keep current" : "Default is 'password'"}
             />
             <p className="text-[10px] text-gray-500 italic mt-1">Passwords are stored in the public.users table for staff access.</p>
           </div>
           
           <Select 
             label="Access Role" 
             value={formData.role || 'CASHIER'} 
             options={[
                 { label: 'Administrator (Full Access)', value: 'ADMIN' },
                 { label: 'Store Manager (Management)', value: 'MANAGER' },
                 { label: 'Sales Staff (Entry Only)', value: 'SALES' },
                 { label: 'Cashier (Payment Only)', value: 'CASHIER' }
             ]}
             onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
           />

           <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl mt-4">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={formData.isActive ?? true}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 text-primary rounded-lg focus:ring-primary border-slate-300"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-textPrimary dark:text-white">Account Active / Enabled</label>
           </div>

           <div className="flex justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="px-6">Cancel</Button>
              <Button onClick={handleSaveUser} className="px-8">Save Account</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
