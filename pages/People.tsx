

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { DataTable, Button, Modal, Input, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Customer, Employee } from '../types';
import { UserPlus, Briefcase, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const People = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState<'customers' | 'employees'>('customers');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, type: 'customer'|'employee'}>({isOpen: false, id: '', type: 'customer'});

    const loadData = async () => {
        if (!user) return;
        setCustomers(await Api.getCustomers(user.businessId));
        setEmployees(await Api.getEmployees(user.businessId));
    };

    useEffect(() => { loadData(); }, [user]);

    const handleSave = async () => {
        if (!user) return;
        const dataWithBiz = { ...formData, businessId: user.businessId };

        if(tab === 'customers') {
            await Api.saveCustomer(dataWithBiz);
        } else {
            await Api.saveEmployee(dataWithBiz);
        }
        setIsOpen(false);
        setFormData({});
        loadData();
    };

    const confirmDelete = async () => {
        const { id, type } = deleteModal;
        if (type === 'customer') {
            await Api.deleteCustomer(id);
        } else {
            await Api.deleteEmployee(id);
        }
        loadData();
        setDeleteModal({ ...deleteModal, isOpen: false });
    };

    return (
        <div className="space-y-6">
             <div className="flex gap-4 border-b border-gray-200 pb-2">
                <button onClick={() => setTab('customers')} className={`pb-2 px-4 font-medium ${tab === 'customers' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}>Customers</button>
                <button onClick={() => setTab('employees')} className={`pb-2 px-4 font-medium ${tab === 'employees' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}>Employees</button>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => { setFormData({}); setIsOpen(true); }} className="gap-2"><UserPlus size={18}/> Add {tab === 'customers' ? 'Customer' : 'Employee'}</Button>
            </div>

            {tab === 'customers' ? (
                <DataTable<Customer> 
                    data={customers}
                    columns={[
                        { header: 'Name', accessor: (c) => `${c.firstName} ${c.lastName}`, className: 'font-bold' },
                        { header: 'Phone', accessor: 'phone' },
                        { header: 'Address', accessor: 'address' },
                        { header: 'Joined', accessor: (c) => new Date(c.createdAt).toLocaleDateString() }
                    ]}
                    actions={(item) => (
                        <div className="flex justify-end gap-2">
                             <button className="text-blue-600 hover:text-blue-800" onClick={() => { setFormData(item); setIsOpen(true); }}><Edit size={16}/></button>
                             <button className="text-red-500 hover:text-red-700" onClick={() => setDeleteModal({isOpen: true, id: item.id, type: 'customer'})}><Trash2 size={16}/></button>
                        </div>
                    )}
                />
            ) : (
                <DataTable<Employee> 
                    data={employees}
                    columns={[
                        { header: 'Name', accessor: (e) => `${e.firstName} ${e.lastName}`, className: 'font-bold' },
                        { header: 'Role', accessor: (e) => <span className="flex items-center gap-1"><Briefcase size={12}/> {e.jobRole}</span> },
                        { header: 'Email', accessor: 'email' },
                        { header: 'Phone', accessor: 'phone' }
                    ]}
                    actions={(item) => (
                        <div className="flex justify-end gap-2">
                             <button className="text-blue-600 hover:text-blue-800" onClick={() => { setFormData(item); setIsOpen(true); }}><Edit size={16}/></button>
                             <button className="text-red-500 hover:text-red-700" onClick={() => setDeleteModal({isOpen: true, id: item.id, type: 'employee'})}><Trash2 size={16}/></button>
                        </div>
                    )}
                />
            )}

            <ConfirmationModal 
                isOpen={deleteModal.isOpen} 
                onClose={() => setDeleteModal({...deleteModal, isOpen: false})} 
                onConfirm={confirmDelete}
                title={`Delete ${deleteModal.type === 'customer' ? 'Customer' : 'Employee'}`}
                message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
            />

            <Modal title={`Add New ${tab === 'customers' ? 'Customer' : 'Employee'}`} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        <Input label="Last Name" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                    <Input label="Phone Number" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <Input label="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    
                    {tab === 'employees' && (
                        <>
                             <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                             <Select label="Job Role" options={[{label:'Cashier', value:'Cashier'}, {label:'Manager', value:'Manager'}, {label:'Stock Clerk', value:'Stock Clerk'}]} onChange={e => setFormData({...formData, jobRole: e.target.value})} />
                        </>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Record</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};