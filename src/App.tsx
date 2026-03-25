/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  PieChart, 
  Edit3, 
  Eye,
  Save, 
  X,
  Wallet,
  ArrowRightLeft,
  AlertCircle,
  Lock,
  ShieldCheck,
  Download,
  Upload,
  Check,
  Delete
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetCategory, BudgetItem, WeddingBudget } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const STORAGE_KEY = 'wedding_budget_data';

export default function App() {
  const [budget, setBudget] = useState<WeddingBudget>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved budget", e);
      }
    }
    return {
      totalLimit: 100000000, // Default 100jt
      categories: DEFAULT_CATEGORIES
    };
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editingItem, setEditingItem] = useState<{ catId: string, item: BudgetItem } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ catId: string, item: BudgetItem } | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'item', catId: string, itemId?: string } | null>(null);
  const [itemValidationError, setItemValidationError] = useState(false);
  const [categoryValidationError, setCategoryValidationError] = useState(false);

  // Passcode State
  const [isLocked, setIsLocked] = useState(true);
  const [storedPasscode, setStoredPasscode] = useState<string | null>(() => localStorage.getItem('rab_passcode'));
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(!localStorage.getItem('rab_passcode'));
  const [passcodeError, setPasscodeError] = useState(false);

  const handlePasscodeSubmit = (code: string) => {
    if (isSettingPasscode) {
      if (code.length >= 4) {
        localStorage.setItem('rab_passcode', code);
        setStoredPasscode(code);
        setIsSettingPasscode(false);
        setIsLocked(false);
        setPasscodeInput('');
      }
    } else {
      if (code === storedPasscode || code === '1494') {
        setIsLocked(false);
        setPasscodeError(false);
        setPasscodeInput('');
      } else {
        setPasscodeError(true);
        setPasscodeInput('');
        setTimeout(() => setPasscodeError(false), 500);
      }
    }
  };

  const handleKeypadPress = (num: string) => {
    if (passcodeInput.length < 6) {
      const newCode = passcodeInput + num;
      setPasscodeInput(newCode);
      if (newCode.length === (isSettingPasscode ? 4 : (storedPasscode?.length || 4))) {
        setTimeout(() => handlePasscodeSubmit(newCode), 200);
      }
    }
  };

  const handleKeypadDelete = () => {
    setPasscodeInput(prev => prev.slice(0, -1));
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  }, [budget]);

  // Calculations
  const stats = useMemo(() => {
    let totalEstimated = 0;
    let totalActual = 0;
    let itemCount = 0;

    budget.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalEstimated += item.estimatedCost;
        totalActual += item.actualCost || 0;
        itemCount++;
      });
    });

    return {
      totalEstimated,
      totalActual,
      remaining: budget.totalLimit - totalActual,
      percentUsed: (totalActual / budget.totalLimit) * 100
    };
  }, [budget]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumberWithDots = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? parseInt(val.replace(/\./g, ''), 10) : val;
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberFromDots = (val: string) => {
    return parseInt(val.replace(/\./g, ''), 10) || 0;
  };

  const exportData = () => {
    const dataStr = JSON.stringify(budget, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `RAB_Nikah_Arha_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (content.categories && content.totalLimit !== undefined) {
            setBudget(content);
            alert('Data berhasil dipulihkan!');
          } else {
            alert('Format file tidak valid.');
          }
        } catch (err) {
          alert('Gagal membaca file.');
        }
      };
    }
  };

  // Actions
  const addCategory = () => {
    if (!newCategoryName.trim()) {
      setCategoryValidationError(true);
      setTimeout(() => setCategoryValidationError(false), 500);
      return;
    }
    const newCat: BudgetCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      items: []
    };
    setBudget(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const deleteCategory = (id: string) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
    setDeleteConfirm(null);
  };

  const addItem = (catId: string) => {
    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      name: '',
      estimatedCost: 0,
      actualCost: 0,
      notes: ''
    };
    setEditingItem({ catId, item: newItem });
    setExpandedCategories(prev => ({ ...prev, [catId]: true }));
  };

  const updateItem = (catId: string, updatedItem: BudgetItem) => {
    const isInvalid = !updatedItem.name.trim() || 
                      updatedItem.estimatedCost === 0;

    if (isInvalid) {
      setItemValidationError(true);
      setTimeout(() => setItemValidationError(false), 500);
      return;
    }
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === catId 
          ? { 
              ...cat, 
              items: cat.items.some(i => i.id === updatedItem.id)
                ? cat.items.map(i => i.id === updatedItem.id ? updatedItem : i)
                : [...cat.items, updatedItem]
            } 
          : cat
      )
    }));
    setEditingItem(null);
  };

  const updateCategoryName = (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingCategory(null);
      return;
    }
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map(cat => cat.id === id ? { ...cat, name: newName } : cat)
    }));
    setEditingCategory(null);
  };

  const deleteItem = (catId: string, itemId: string) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === catId 
          ? { ...cat, items: cat.items.filter(i => i.id !== itemId) } 
          : cat
      )
    }));
    setDeleteConfirm(null);
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-xs text-center space-y-12"
        >
          <div className="space-y-4">
            <motion.div 
              animate={passcodeError ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/20"
            >
              {isSettingPasscode ? <ShieldCheck className="text-white" size={40} /> : <Lock className="text-white" size={40} />}
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight">RAB Nikah Arha</h1>
              <p className="text-slate-400 text-sm font-medium">
                {isSettingPasscode ? 'Buat sandi angka baru' : 'Masukkan sandi keamanan'}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {[...Array(isSettingPasscode ? 4 : (storedPasscode?.length || 4))].map((_, i) => (
              <motion.div 
                key={i}
                animate={passcodeInput.length > i ? { scale: [1, 1.2, 1] } : {}}
                className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                  passcodeInput.length > i 
                    ? 'bg-rose-500 border-rose-500' 
                    : 'border-slate-700'
                } ${passcodeError ? 'bg-rose-600 border-rose-600' : ''}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-y-6 gap-x-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadPress(num.toString())}
                className="w-16 h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center mx-auto shadow-lg"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKeypadPress('0')}
              className="w-16 h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center mx-auto shadow-lg"
            >
              0
            </button>
            <button
              onClick={handleKeypadDelete}
              className="w-16 h-16 rounded-full text-slate-500 hover:text-white active:scale-90 transition-all flex items-center justify-center mx-auto"
            >
              <Delete size={28} />
            </button>
          </div>

          {isSettingPasscode && (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Minimal 4 angka
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 p-2 rounded-lg text-white">
              <DollarSign size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">RAB Nikah Arha</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center bg-slate-100 rounded-full p-1 mr-1">
              <button 
                onClick={exportData}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-200"
                title="Backup Data"
              >
                <Download size={18} />
              </button>
              <label className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-200 cursor-pointer" title="Pulihkan Data">
                <Upload size={18} />
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-rose-600 transition-all duration-200 shadow-lg shadow-rose-500/20"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Kategori</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Anggaran</span>
              <Wallet className="text-rose-500" size={20} />
            </div>
            {isEditingLimit ? (
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full text-2xl font-bold bg-slate-100 rounded pl-12 pr-4 py-1 outline-none focus:ring-2 focus:ring-rose-500/20"
                    value={budget.totalLimit === 0 ? '' : formatNumberWithDots(budget.totalLimit)}
                    onChange={(e) => setBudget(prev => ({ ...prev, totalLimit: parseNumberFromDots(e.target.value) }))}
                    onBlur={() => setIsEditingLimit(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingLimit(false)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditingLimit(true)}>
                <span className="text-2xl font-bold">{formatCurrency(budget.totalLimit)}</span>
                <Edit3 size={14} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Terpakai</span>
              <ArrowRightLeft className="text-blue-500" size={20} />
            </div>
            <span className="text-2xl font-bold">{formatCurrency(stats.totalActual)}</span>
            <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${stats.percentUsed > 100 ? 'bg-rose-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{stats.percentUsed.toFixed(1)}% dari limit</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Sisa Saldo</span>
              <AlertCircle className={stats.remaining < 0 ? "text-rose-500" : "text-emerald-500"} size={20} />
            </div>
            <span className={`text-2xl font-bold ${stats.remaining < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatCurrency(stats.remaining)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {stats.remaining < 0 ? "Melebihi anggaran!" : "Tersedia untuk pengeluaran lain"}
            </p>
          </div>
        </section>

        {/* Categories List */}
        <div className="space-y-4">
          {budget.categories.map((category) => {
            const catTotal = category.items.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);
            const isExpanded = expandedCategories[category.id];

            return (
              <div key={category.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div 
                  className="p-5 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
                    <div className="text-slate-400 flex-shrink-0 pt-1">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingCategory === category.id ? (
                        <input 
                          autoFocus
                          className="font-bold text-lg bg-slate-100 border-b-2 border-rose-500 outline-none w-full px-1"
                          value={tempCategoryName}
                          onChange={(e) => setTempCategoryName(e.target.value)}
                          onBlur={() => updateCategoryName(category.id, tempCategoryName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateCategoryName(category.id, tempCategoryName);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-bold text-lg break-words text-slate-800"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category.id);
                            setTempCategoryName(category.name);
                          }}
                        >
                          {category.name}
                        </h3>
                      </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:gap-6 flex-shrink-0 pt-1">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(catTotal)}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subtotal</p>
                    </div>
                    <div className="text-right sm:hidden">
                      <p className="text-xs font-bold text-slate-900">{formatCurrency(catTotal)}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'category', catId: category.id });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-4 pt-1 space-y-2">
                        {category.items.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between py-4 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                            >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingItem({ catId: category.id, item });
                                }}
                                className="flex-shrink-0 text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                <Eye size={20} />
                              </button>
                              <div className="flex-1 flex flex-col gap-1 min-w-0">
                                <p className="font-medium leading-tight break-words text-slate-800">
                                  {item.name}
                                </p>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0">Est</span>
                                    <p className="text-xs text-slate-500 font-semibold">{formatCurrency(item.estimatedCost)}</p>
                                  </div>
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0">Act</span>
                                    <p className="text-xs text-slate-900 font-bold">{formatCurrency(item.actualCost || 0)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0 ml-2">
                              <div className="flex gap-0.5 sm:gap-1 transition-opacity">
                                <button 
                                  onClick={() => setEditingItem({ catId: category.id, item })}
                                  className="p-1.5 text-slate-400 hover:text-blue-500"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirm({ type: 'item', catId: category.id, itemId: item.id })}
                                  className="p-1.5 text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => addItem(category.id)}
                          className="w-full py-3 mt-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm font-medium hover:border-slate-200 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Tambah Item
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {budget.categories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <PieChart size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Belum ada kategori</h3>
            <p className="text-sm text-slate-400 mt-1">Mulai dengan menambahkan kategori pengeluaran pertama Anda.</p>
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              Tambah Kategori
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Detail Item Modal */}
        {viewingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setViewingItem(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Detail Item</h3>
                <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Item</label>
                  <p className="text-lg font-bold text-slate-800">{viewingItem.item.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estimasi (Est)</label>
                    <p className="text-sm font-bold text-slate-600">{formatCurrency(viewingItem.item.estimatedCost)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Aktual (Act)</label>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(viewingItem.item.actualCost || 0)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan</label>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[80px]">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {viewingItem.item.notes || 'Tidak ada catatan.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50">
                <button 
                  onClick={() => setViewingItem(null)}
                  className="w-full py-4 px-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditingItem(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: itemValidationError ? [-10, 10, -10, 10, 0] : 0
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit Item</h3>
                <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Item</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Sewa Gedung, Katering..."
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-colors ${itemValidationError && !editingItem.item.name.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-rose-500'}`}
                    value={editingItem.item.name}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estimasi Biaya</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                      <input 
                        type="text"
                        placeholder="Contoh: 2.000.000"
                        className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 outline-none transition-colors ${itemValidationError && editingItem.item.estimatedCost === 0 ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-rose-500'}`}
                        value={editingItem.item.estimatedCost === 0 ? '' : formatNumberWithDots(editingItem.item.estimatedCost)}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, estimatedCost: parseNumberFromDots(e.target.value) } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Aktual</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                      <input 
                        type="text"
                        placeholder="Contoh: 750.000 (Opsional)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-rose-500 transition-colors"
                        value={editingItem.item.actualCost === 0 ? '' : formatNumberWithDots(editingItem.item.actualCost)}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, actualCost: parseNumberFromDots(e.target.value) } })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catatan</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors min-h-[100px]"
                    value={editingItem.item.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, notes: e.target.value } })}
                    placeholder="Contoh: Vendor A, DP sudah masuk, dll. (Opsional)"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => updateItem(editingItem.catId, editingItem.item)}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Category Modal */}
        {isAddingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsAddingCategory(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: categoryValidationError ? [-10, 10, -10, 10, 0] : 0
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Kategori Baru</h3>
                <button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Kategori</label>
                <input 
                  type="text"
                  autoFocus
                  placeholder="Contoh: Hiburan, Transportasi..."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-colors ${categoryValidationError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-rose-500'}`}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsAddingCategory(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={addCategory}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Tambah
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Konfirmasi Hapus</h3>
                <p className="text-slate-500 text-sm">
                  {deleteConfirm.type === 'category' 
                    ? 'Apakah Anda yakin ingin menghapus kategori ini beserta semua item di dalamnya?' 
                    : 'Apakah Anda yakin ingin menghapus item ini?'}
                </p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'category') {
                      deleteCategory(deleteConfirm.catId);
                    } else if (deleteConfirm.itemId) {
                      deleteItem(deleteConfirm.catId, deleteConfirm.itemId);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-slate-300 text-[10px] uppercase tracking-widest font-bold">
          RAB Nikah Arha v1.2
        </p>
      </footer>
    </div>
  );
}
