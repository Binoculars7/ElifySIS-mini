
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useRef } from 'react';
import { Card, DataTable, Button, Modal, Input, Select, ConfirmationModal } from '../components/UI';
import { Api } from '../services/api';
import { Product, Supplier, Category } from '../types';
import { Plus, Trash2, Edit, Upload, FileDown, Filter, Settings2, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotification } from '../context/NotificationContext';
import Papa from 'papaparse';

export const Inventory = () => {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const { notify } = useNotification();
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
    try {
        const [p, s, c] = await Promise.all([
            Api.getProducts(user.businessId),
            Api.getSuppliers(user.businessId),
            Api.getCategories(user.businessId)
        ]);
        setProducts(p);
        setSuppliers(s);
        setCategories(c);
    } catch (err) {
        console.error("Inventory data fetch failed:", err);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  // Helper for normalization to prevent subtle duplicate misses
  const normalize = (str: string) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';

  const handleSave = async () => {
    if (!user) return;
    const commonData = { businessId: user.businessId };

    try {
        if (activeTab === 'products') {
            if (!formData.name) return;
            
            const normalizedName = normalize(formData.name);
            const normalizedCategory = normalize(formData.category || 'General');
            
            // Check against existing products in state
            const isDuplicate = products.some(p => 
                p.id !== formData.id && 
                normalize(p.name) === normalizedName &&
                normalize(p.category) === normalizedCategory
            );

            if (isDuplicate) {
                notify(`${formData.name} already exist in the ${formData.category || 'General'} category.`, 'warning', 'Duplicate Found');
                return;
            }

            await Api.saveProduct({ 
              ...formData, 
              ...commonData,
              name: formData.name.trim(),
              category: formData.category || 'General',
              lastUpdated: Date.now() 
            } as Product);
        } else if (activeTab === 'suppliers') {
            if (!formData.name) return;
            await Api.saveSupplier({ 
              ...formData, 
              ...commonData,
              createdAt: formData.createdAt || Date.now()
            } as Supplier);
        } else if (activeTab === 'categories') {
            if (!formData.name) return;
            await Api.saveCategory({ ...formData, ...commonData } as Category);
        }
        
        setIsModalOpen(false);
        await loadData(); // Reload to sync state
        setFormData({});
    } catch (err: any) {
        alert("Save failed: " + err.message);
    }
  };

  const confirmDelete = async () => {
      const { id, type } = deleteModal;
      try {
          if (type === 'category') {
              await Api.deleteCategory(id);
          } else if (type === 'supplier') {
              await Api.deleteSupplier(id);
          } else if (type === 'product') {
              await Api.deleteProduct(id);
          }
          await loadData();
          setDeleteModal({ isOpen: false, id: '', type: 'product' });
      } catch (err: any) {
          alert("Delete failed: " + err.message);
      }
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
      try {
          await Api.adjustStock(adjustModal.productId, qty, type);
          setAdjustModal({ ...adjustModal, isOpen: false });
          await loadData();
      } catch (err: any) {
          alert("Adjustment failed: " + err.message);
      }
  };

  const downloadTemplate = () => {
      const headers = ["Name", "Description", "Quantity", "BuyPrice", "SellPrice", "Category", "SupplierId"];
      const example = ["Sample Product", "A great item", "100", "5.00", "10.00", "General", ""];
      const csv = Papa.unparse([headers, example]);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "elifysis_inventory_template.csv";
      a.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
              const rows = results.data as any[];
              if (rows.length === 0) {
                  alert("No data found in CSV.");
                  return;
              }

              // Mapping logic
              const fields = results.meta.fields || [];
              const findKey = (candidates: string[]) => 
                  fields.find(f => candidates.some(c => f.toLowerCase() === c.toLowerCase()));

              const nameKey = findKey(['name', 'product name', 'item']);
              const descKey = findKey(['description', 'desc']);
              const qtyKey = findKey(['quantity', 'qty', 'stock']);
              const buyKey = findKey(['buyprice', 'buy price', 'cost']);
              const sellKey = findKey(['sellprice', 'sell price', 'price']);
              const catKey = findKey(['category', 'type']);
              const supKey = findKey(['supplierid', 'supplier', 'vendor']);

              if (!nameKey) {
                  alert("CSV Error: No 'Name' column found.");
                  return;
              }

              const newProducts: Product[] = [];
              const duplicatesList: string[] = [];

              // IMPORTANT: Using current state 'products' for comparison
              for (const row of rows) {
                  const productName = String(row[nameKey] || '').trim();
                  if (!productName) continue;
                  
                  const productCategory = String(row[catKey] || 'General').trim();
                  const normName = normalize(productName);
                  const normCat = normalize(productCategory);

                  // 1. Check against DB records loaded in 'products' state
                  const existsInInventory = products.some(p => 
                      normalize(p.name) === normName &&
                      normalize(p.category) === normCat
                  );

                  // 2. Check against items already added to this batch to prevent internal CSV duplicates
                  const existsInBatch = newProducts.some(p => 
                    normalize(p.name) === normName &&
                    normalize(p.category) === normCat
                  );

                  if (existsInInventory || existsInBatch) {
                      duplicatesList.push(productName);
                      continue;
                  }

                  newProducts.push({
                      businessId: user.businessId,
                      name: productName,
                      description: String(row[descKey] || '').trim(),
                      quantity: parseInt(row[qtyKey]) || 0,
                      buyPrice: parseFloat(row[buyKey]) || 0,
                      sellPrice: parseFloat(row[sellKey]) || 0,
                      category: productCategory,
                      supplierId: String(row[supKey] || '').trim(),
                      lastUpdated: Date.now()
                  } as Product);
              }

              // Notify for skipped duplicates
              if (duplicatesList.length > 0) {
                  const limit = 4;
                  const displayList = duplicatesList.length > limit 
                    ? `${duplicatesList.slice(0, limit).join(', ')} and ${duplicatesList.length - limit} others` 
                    : duplicatesList.join(', ');
                  
                  notify(`${displayList} already exist.`, 'warning', 'Items Skipped');
              }

              if (newProducts.length > 0) {
                  if (window.confirm(`Found ${newProducts.length} new products to import. Skip duplicates and proceed?`)) {
                      try {
                          await Api.importProducts(newProducts);
                          notify(`Imported ${newProducts.length} products successfully.`, 'success', 'Import Complete');
                          await loadData(); // Re-sync state immediately
                      } catch (err: any) {
                          alert("Import failed: " + err.message);
                      }
                  }
              } else if (duplicatesList.length > 0) {
                  notify("No new products added. All items in CSV already exist in your inventory.", 'info', 'Import Finished');
              } else {
                  alert("No valid product data found in CSV.");
              }
              
              if (fileInputRef.current) fileInputRef.current.value = "";
          }
      });
  };

  const filteredProducts = products.filter(p => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterSupplier && p.supplierId !== filterSupplier) return false;
      return true;
  });

  const productColumns = [
    { header: 'Product Name', accessor: 'name' as keyof Product, className: 'font-bold' },
    { header: 'Category', accessor: 'category' as keyof Product },
    { header: 'Stock', accessor: (p: Product) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${p.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {p.quantity} Units
        </span>
    ) },
    { header: 'Buy Price', accessor: (p: Product) => formatCurrency(p.buyPrice) },
    { header: 'Sell Price', accessor: (p: Product) => formatCurrency(p.sellPrice) },
  ];

  const supplierColumns = [
    { header: 'Supplier Name', accessor: 'name' as keyof Supplier, className: 'font-bold' },
    { header: 'Phone', accessor: 'phone' as keyof Supplier },
    { header: 'Address', accessor: 'address' as keyof Supplier },
  ];

  const categoryColumns = [
      { header: 'Category Name', accessor: 'name' as keyof Category, className: 'font-bold' },
      { header: 'ID', accessor: 'id' as keyof Category, className: 'text-gray-400 font-mono text-xs' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        >
          Inventory Items
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')} 
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'suppliers' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        >
          Suppliers
        </button>
        <button 
          onClick={() => setActiveTab('categories')} 
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        >
          Categories
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
         <div className="flex flex-wrap gap-2 items-center">
            {activeTab === 'products' && (
                <>
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload size={16}/> Import CSV</Button>
                    <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2 text-primary font-bold"><FileDown size={16}/> Template</Button>
                    <div className="h-6 w-px bg-gray-300 mx-2 hidden lg:block"></div>
                    <select className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
                        <option value="">All Suppliers</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </>
            )}
         </div>
         <Button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="gap-2">
            <Plus size={18} /> New {activeTab === 'categories' ? 'Category' : activeTab === 'suppliers' ? 'Supplier' : 'Product'}
         </Button>
      </div>

      <div className="min-w-0">
          {activeTab === 'products' && (
            <DataTable 
              title="Stock Ledger" 
              data={filteredProducts} 
              columns={productColumns} 
              actions={(item) => (
                 <div className="flex justify-end gap-2">
                     <button className="text-slate-400 hover:text-primary p-1.5 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => openAdjustStock(item)} title="Quick Adjust Stock"><Activity size={16} /></button>
                     <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                     <button className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" onClick={() => openDeleteModal(item.id, 'product')}><Trash2 size={16}/></button>
                 </div>
              )}
            />
          )}

          {activeTab === 'suppliers' && (
            <DataTable title="Authorized Suppliers" data={suppliers} columns={supplierColumns}
              actions={(item) => (
                 <div className="flex justify-end gap-2">
                     <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                     <button className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" onClick={() => openDeleteModal(item.id, 'supplier')}><Trash2 size={16}/></button>
                 </div>
              )} 
            />
          )}

          {activeTab === 'categories' && (
              <DataTable title="Item Groupings" data={categories} columns={categoryColumns}
                actions={(item) => (
                    <div className="flex justify-end gap-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => { setFormData(item); setIsModalOpen(true); }}><Edit size={16}/></button>
                        <button className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" onClick={() => openDeleteModal(item.id, 'category')}><Trash2 size={16}/></button>
                    </div>
                )}
              />
          )}
      </div>

      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={confirmDelete} title="Confirm Deletion" message="This action is irreversible. All associated records may be affected." />

      <Modal isOpen={adjustModal.isOpen} onClose={() => setAdjustModal({...adjustModal, isOpen: false})} title="Audit Stock Adjustment">
         <div className="space-y-4">
             <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm border border-blue-100">
                 <p className="font-black uppercase tracking-widest text-[10px] mb-1">Target Product</p>
                 <p className="font-bold text-lg leading-tight mb-2">{adjustModal.productName}</p>
                 <div className="flex justify-between items-center text-xs opacity-80">
                    <span>Current Inventory:</span>
                    <span className="font-black">{adjustModal.currentQty} Units</span>
                 </div>
             </div>
             <Input label="Adjustment Value (+ or -)" type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. 10 to restock, -2 for damage" />
             <div className="flex justify-end gap-3 mt-8">
                <Button variant="secondary" onClick={() => setAdjustModal({...adjustModal, isOpen: false})}>Discard</Button>
                <Button onClick={handleStockAdjustment}>Apply Audit</Button>
             </div>
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? 'Edit Record' : 'Create New Record'}>
        <div className="space-y-4">
          {activeTab === 'products' ? (
            <>
               <Input label="Product Full Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Buy Unit Price" value={formData.buyPrice || ''} onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})} />
                  <Input type="number" label="Sell Unit Price" value={formData.sellPrice || ''} onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Opening Quantity" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                  <Select label="Category" value={formData.category || ''} options={[{value: '', label: 'None'}, ...categories.map(c => ({ value: c.name, label: c.name }))]} onChange={e => setFormData({...formData, category: e.target.value})} />
               </div>
               <Select label="Authorized Supplier" options={[{value: '', label: 'None'}, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} />
            </>
          ) : activeTab === 'suppliers' ? (
             <>
                <Input label="Authorized Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                <Input label="Contact Phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input label="Physical Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
             </>
          ) : (
             <Input label="Category Label" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
          )}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button onClick={handleSave}>Confirm Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
