

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useRef } from 'react';
import { Card, DataTable, Button, Modal, Input, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Product, Supplier, Category } from '../types';
import { Plus, Trash2, Edit, Upload, FileDown, Filter, Settings2, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Inventory = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'categories'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; type: 'product' | 'supplier' | 'category' }>({ isOpen: false, id: '', type: 'product' });

  // Stock Adjustment State
  const [adjustModal, setAdjustModal] = useState({ isOpen: false, productId: '', currentQty: 0, productName: '' });
  const [adjustQty, setAdjustQty] = useState<string>('');

  const loadData = async () => {
    if (!user) return;
    const p = await Api.getProducts(user.businessId);
    const s = await Api.getSuppliers(user.businessId);
    const c = await Api.getCategories(user.businessId);
    setProducts(p);
    setSuppliers(s);
    setCategories(c);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const commonData = { businessId: user.businessId };

    if (activeTab === 'products') {
        if (!formData.name || !formData.buyPrice) return;
        await Api.saveProduct({ ...formData, ...commonData } as Product);
    } else if (activeTab === 'suppliers') {
        if (!formData.name) return;
        await Api.saveSupplier({ ...formData, ...commonData } as Supplier);
    } else if (activeTab === 'categories') {
        if (!formData.name) return;
        await Api.saveCategory({ ...formData, ...commonData } as Category);
    }
    
    setIsModalOpen(false);
    loadData();
    setFormData({});
  };

  const confirmDelete = async () => {
      const { id, type } = deleteModal;
      if (type === 'category') {
          setCategories(prev => prev.filter(c => c.id !== id));
          await Api.deleteCategory(id);
      } else if (type === 'supplier') {
          setSuppliers(prev => prev.filter(s => s.id !== id));
          await Api.deleteSupplier(id);
      } else if (type === 'product') {
          setProducts(prev => prev.filter(p => p.id !== id));
          await Api.deleteProduct(id);
      }
      loadData();
      setDeleteModal({ isOpen: false, id: '', type: 'product' });
  };

  const openDeleteModal = (id: string, type: 'product' | 'supplier' | 'category') => {
      setDeleteModal({ isOpen: true, id, type });
  };

  const openAdjustStock = (p: Product) => {
      setAdjustModal({ isOpen: true, productId: p.id, currentQty: p.quantity, productName: p.name });
      setAdjustQty('');
  };

  const handleStockAdjustment = async () => {
      const qty = parseInt(adjustQty);
      if (isNaN(qty) || qty === 0) return;
      
      const type = 'adjustment';
      await Api.adjustStock(adjustModal.productId, qty, type);
      
      setAdjustModal({ ...adjustModal, isOpen: false });
      loadData();
  };

  const downloadTemplate = () => {
      const headers = "Name,Description,Quantity,BuyPrice,SellPrice,Category,SupplierId";
      const example = "Sample Product,A great item,100,5.00,10.00,General,s1";
      const blob = new Blob([headers + "\n" + example], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "product_import_template.csv";
      a.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) return;

          const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
          if (rows.length < 2) {
              alert("Invalid CSV format");
              return;
          }

          // Simple CSV parser
          const newProducts: Product[] = [];
          
          for (let i = 1; i < rows.length; i++) {
              const cols = rows[i].split(',');
              if (cols.length < 5) continue; // Basic validation

              const p: any = {
                  businessId: user.businessId,
                  name: cols[0]?.trim(),
                  description: cols[1]?.trim() || '',
                  quantity: parseInt(cols[2]?.trim()) || 0,
                  buyPrice: parseFloat(cols[3]?.trim()) || 0,
                  sellPrice: parseFloat(cols[4]?.trim()) || 0,
                  category: cols[5]?.trim() || 'General',
                  supplierId: cols[6]?.trim() || '',
                  lastUpdated: Date.now()
              };
              
              if (p.name && p.sellPrice >= 0) {
                  newProducts.push(p);
              }
          }

          if (newProducts.length > 0) {
              if (window.confirm(`Found ${newProducts.length} valid products. Import them?`)) {
                  await Api.importProducts(newProducts);
                  alert("Import successful!");
                  loadData();
              }
          } else {
              alert("No valid products found in CSV.");
          }
          
          if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsText(file);
  };

  const filteredProducts = products.filter(p => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterSupplier && p.supplierId !== filterSupplier) return false;
      return true;
  });

  const productColumns = [
    { header: 'Product Name', accessor: 'name' as keyof Product, className: 'font-medium' },
    { header: 'Category', accessor: 'category' as keyof Product },
    { header: 'Stock', accessor: (p: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {p.quantity} Units
        </span>
    ) },
    { header: 'Buy Price', accessor: (p: Product) => formatCurrency(p.buyPrice) },
    { header: 'Sell Price', accessor: (p: Product) => formatCurrency(p.sellPrice) },
  ];

  const supplierColumns = [
    { header: 'Name', accessor: 'name' as keyof Supplier },
    { header: 'Phone', accessor: 'phone' as keyof Supplier },
    { header: 'Address', accessor: 'address' as keyof Supplier },
  ];

  const categoryColumns = [
      { header: 'Category Name', accessor: 'name' as keyof Category, className: 'font-bold' },
      { header: 'ID', accessor: 'id' as keyof Category, className: 'text-gray-400 text-xs' }
  ];

  const getModalTitle = () => {
      if(activeTab === 'products') return "Add New Product";
      if(activeTab === 'suppliers') return "Add New Supplier";
      return "Add New Category";
  };

  const getDeleteMessage = () => {
      if(deleteModal.type === 'category') return "Are you sure you want to delete this category?";
      if(deleteModal.type === 'supplier') return "Are you sure you want to delete this supplier?";
      return "Are you sure you want to delete this product? This action cannot be undone.";
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`pb-2 px-4 font-medium ${activeTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')} 
          className={`pb-2 px-4 font-medium ${activeTab === 'suppliers' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}
        >
          Suppliers
        </button>
        <button 
          onClick={() => setActiveTab('categories')} 
          className={`pb-2 px-4 font-medium ${activeTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'}`}
        >
          Categories
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
         <div>
            {activeTab === 'products' && (
                <div className="flex flex-wrap gap-2 items-center">
                    <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                    />
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <Upload size={16}/> Import CSV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2 text-primary">
                        <FileDown size={16}/> Template
                    </Button>

                    <div className="h-6 w-px bg-gray-300 mx-2 hidden lg:block"></div>
                    
                    <div className="flex gap-2">
                        <select 
                            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>

                        <select 
                            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                            value={filterSupplier}
                            onChange={e => setFilterSupplier(e.target.value)}
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            )}
         </div>
         <Button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="gap-2">
            <Plus size={18} /> Add {activeTab === 'categories' ? 'Category' : activeTab === 'suppliers' ? 'Supplier' : 'Product'}
         </Button>
      </div>

      {activeTab === 'products' && (
        <DataTable 
          title="Product Inventory" 
          data={filteredProducts} 
          columns={productColumns} 
          actions={(item) => (
             <div className="flex justify-end gap-2">
                 <button className="text-gray-500 hover:text-primary" onClick={() => openAdjustStock(item)} title="Adjust Stock">
                    <Activity size={16} />
                 </button>
                 <button className="text-blue-600 hover:text-blue-800" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                 <button className="text-red-500 hover:text-red-700" onClick={() => openDeleteModal(item.id, 'product')}><Trash2 size={16}/></button>
             </div>
          )}
        />
      )}

      {activeTab === 'suppliers' && (
        <DataTable 
          title="Supplier List" 
          data={suppliers} 
          columns={supplierColumns}
          actions={(item) => (
             <div className="flex justify-end gap-2">
                 <button className="text-blue-600 hover:text-blue-800" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                 <button className="text-red-500 hover:text-red-700" onClick={() => openDeleteModal(item.id, 'supplier')}><Trash2 size={16}/></button>
             </div>
          )} 
        />
      )}

      {activeTab === 'categories' && (
          <DataTable 
            title="Product Categories"
            data={categories}
            columns={categoryColumns}
            actions={(item) => (
                <div className="flex justify-end gap-2">
                    <button className="text-blue-600 hover:text-blue-800" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => openDeleteModal(item.id, 'category')}><Trash2 size={16}/></button>
                </div>
            )}
          />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={getDeleteMessage()}
      />

      {/* Adjust Stock Modal */}
      <Modal 
         isOpen={adjustModal.isOpen} 
         onClose={() => setAdjustModal({...adjustModal, isOpen: false})} 
         title="Manual Stock Adjustment"
      >
         <div className="space-y-4">
             <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
                 <p className="font-bold">Product: {adjustModal.productName}</p>
                 <p>Current Stock: {adjustModal.currentQty}</p>
             </div>
             
             <Input 
                label="Adjustment Quantity (+/-)" 
                type="number" 
                value={adjustQty} 
                onChange={e => setAdjustQty(e.target.value)} 
                placeholder="e.g., 5 to add, -3 to remove"
             />
             <p className="text-xs text-gray-500">
                Enter a positive number to add stock (restock/return).<br/>
                Enter a negative number to deduct stock (damage/loss).
             </p>

             <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setAdjustModal({...adjustModal, isOpen: false})}>Cancel</Button>
                <Button onClick={handleStockAdjustment}>Update Stock</Button>
             </div>
         </div>
      </Modal>

      {/* Edit/Add Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={getModalTitle()}
      >
        <div className="space-y-4">
          {activeTab === 'products' ? (
            <>
               <Input label="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Buy Price" value={formData.buyPrice || ''} onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})} />
                  <Input type="number" label="Sell Price" value={formData.sellPrice || ''} onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Quantity" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                  <Select 
                    label="Category" 
                    value={formData.category || ''} 
                    options={[{value: '', label: 'Select Category'}, ...categories.map(c => ({ value: c.name, label: c.name }))]}
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
               </div>
               <Select 
                 label="Supplier"
                 options={[{value: '', label: 'Select Supplier'}, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
                 value={formData.supplierId}
                 onChange={e => setFormData({...formData, supplierId: e.target.value})}
               />
            </>
          ) : activeTab === 'suppliers' ? (
             <>
                <Input label="Supplier Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                <Input label="Phone Number" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input label="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
             </>
          ) : (
             <>
                <Input label="Category Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
             </>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
