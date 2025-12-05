/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Button, Modal, Input, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { User, UserRole } from '../types';
import { Shield, UserPlus, Trash2, Edit, CheckCircle, XCircle, Power, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Admin = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errorMsg, setErrorMsg] = useState('');

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
        // Ensure the new user belongs to the same business as the admin
        await Api.saveUser({
          ...formData,
          businessId: user.businessId, 
          password: formData.password || 'password', // Default password if empty
          isActive: formData.isActive ?? true,
          role: formData.role || 'CASHIER',
          createdAt: formData.createdAt || Date.now()
        } as User);
        
        setIsModalOpen(false);
        setFormData({});
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

  return (
    <div className="space-y-6">
      
      {/* Store Settings Section */}
      <Card className="mb-8 border-l-4 border-purple-500">
          <div className="flex items-start justify-between">
              <div className="flex gap-4">
                 <div className="p-3 bg-purple-50 text-purple-600 rounded-full h-fit"><Globe size={24}/></div>
                 <div>
                     <h3 className="text-lg font-bold text-textPrimary dark:text-white">Store Configuration</h3>
                     <p className="text-sm text-textSecondary dark:text-gray-400">Manage global settings for your business.</p>
                     
                     <div className="mt-4 flex items-center gap-4">
                         <div className="w-32">
                            <Select 
                                label="Currency" 
                                value={settings.currency} 
                                onChange={(e) => updateSettings({ currency: e.target.value })}
                                options={[
                                    { value: 'USD', label: 'USD' },
                                    { value: 'EUR', label: 'EUR' },
                                    { value: 'GBP', label: 'GBP' },
                                    { value: 'NGN', label: 'NGN' },
                                    { value: 'KES', label: 'KES' },
                                    { value: 'GHS', label: 'GHS' },
                                    { value: 'INR', label: 'INR' },
                                    { value: 'ZAR', label: 'ZAR' },
                                    { value: 'CAD', label: 'CAD' },
                                    { value: 'AUD', label: 'AUD' },
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
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white">User Management</h2>
            <p className="text-textSecondary dark:text-gray-400">Manage system access and roles.</p>
         </div>
         <Button onClick={() => { setFormData({}); setIsModalOpen(true); setErrorMsg(''); }} className="gap-2">
            <UserPlus size={18} /> Add User
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <Card className="flex items-center gap-4 border-l-4 border-primary">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Shield size={24}/></div>
            <div>
               <p className="text-sm text-gray-500">Total Admins</p>
               <h3 className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</h3>
            </div>
         </Card>
         <Card className="flex items-center gap-4 border-l-4 border-green-500">
            <div className="p-3 bg-green-50 text-green-600 rounded-full"><CheckCircle size={24}/></div>
            <div>
               <p className="text-sm text-gray-500">Active Users</p>
               <h3 className="text-2xl font-bold">{users.filter(u => u.isActive).length}</h3>
            </div>
         </Card>
         <Card className="flex items-center gap-4 border-l-4 border-red-500">
            <div className="p-3 bg-red-50 text-red-600 rounded-full"><XCircle size={24}/></div>
            <div>
               <p className="text-sm text-gray-500">Inactive/Suspended</p>
               <h3 className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</h3>
            </div>
         </Card>
      </div>

      <DataTable<User>
        title="System Users"
        data={users}
        columns={[
          { header: 'Username', accessor: 'username', className: 'font-bold' },
          { header: 'Email', accessor: 'email' },
          { header: 'Role', accessor: (u) => (
             <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                 u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                 u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                 u.role === 'SALES' ? 'bg-orange-100 text-orange-700' :
                 'bg-gray-100 text-gray-700'
             }`}>{u.role}</span>
          )},
          { header: 'Status', accessor: (u) => (
             <span className={`flex items-center gap-1 text-sm ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                {u.isActive ? <CheckCircle size={14}/> : <XCircle size={14}/>} {u.isActive ? 'Active' : 'Inactive'}
             </span>
          )},
          { header: 'Created', accessor: (u) => new Date(u.createdAt).toLocaleDateString() }
        ]}
        actions={(userItem) => (
            <div className="flex justify-end gap-2">
                <button 
                    onClick={() => handleToggleStatus(userItem)}
                    className={`p-1 rounded ${userItem.id === user?.id ? 'text-gray-300 cursor-not-allowed' : userItem.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                    disabled={userItem.id === user?.id}
                    title={userItem.isActive ? 'Deactivate User' : 'Activate User'}
                >
                    <Power size={18}/>
                </button>
                <button onClick={() => { setFormData(userItem); setIsModalOpen(true); setErrorMsg(''); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18}/></button>
                <button 
                  onClick={() => openDeleteModal(userItem.id)} 
                  className={`p-1 rounded ${userItem.id === user?.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                  disabled={userItem.id === user?.id}
                >
                  <Trash2 size={18}/>
                </button>
            </div>
        )}
      />

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Delete User" 
        message="Are you sure you want to delete this user? This account will be permanently removed."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit User" : "Add New User"}>
        <div className="space-y-4">
           {errorMsg && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{errorMsg}</div>}
           <Input label="Username" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} />
           <Input label="Email Address" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
           <Input label="Password" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={formData.id ? "Leave empty to keep current" : "Set login password"} />
           
           <Select 
             label="Role" 
             value={formData.role || 'CASHIER'} 
             options={[
                 { label: 'Administrator', value: 'ADMIN' },
                 { label: 'Store Manager', value: 'MANAGER' },
                 { label: 'Sales Staff', value: 'SALES' },
                 { label: 'Cashier', value: 'CASHIER' }
             ]}
             onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
           />

           <div className="flex items-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={formData.isActive ?? true}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-textPrimary">User account is active</label>
           </div>

           <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUser}>Save User</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};