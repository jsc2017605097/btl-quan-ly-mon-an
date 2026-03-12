/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Utensils, 
  Layers, 
  Clock, 
  DollarSign, 
  ChevronRight,
  X,
  Filter,
  LayoutDashboard,
  ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Dish {
  id: number;
  name: string;
  image: string;
  price: number;
  service_time: number;
  category_id: number;
  category_name?: string;
}

type View = 'dashboard' | 'dishes' | 'categories';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [maxTime, setMaxTime] = useState<string>('');

  // Modals
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, dishesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/dishes')
      ]);
      const cats = await catsRes.json();
      const ds = await dishesRes.json();
      setCategories(cats);
      setDishes(ds);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || dish.category_id === Number(selectedCategory);
      const matchesPrice = !maxPrice || dish.price <= Number(maxPrice);
      const matchesTime = !maxTime || dish.service_time <= Number(maxTime);
      return matchesSearch && matchesCategory && matchesPrice && matchesTime;
    });
  }, [dishes, search, selectedCategory, maxPrice, maxTime]);

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
    try {
      await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
      setDishes(dishes.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting dish:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Xóa loại món sẽ xóa tất cả món ăn thuộc loại này. Bạn có chắc chắn?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter(c => c.id !== id));
      setDishes(dishes.filter(d => d.category_id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSaveDish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      image: formData.get('image') as string || `https://picsum.photos/seed/${Math.random()}/400/300`,
      price: Number(formData.get('price')),
      service_time: Number(formData.get('service_time')),
      category_id: Number(formData.get('category_id')),
    };

    try {
      const url = editingDish ? `/api/dishes/${editingDish.id}` : '/api/dishes';
      const method = editingDish ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const saved = await res.json();
      
      if (editingDish) {
        setDishes(dishes.map(d => d.id === saved.id ? { ...saved, category_name: categories.find(c => c.id === saved.category_id)?.name } : d));
      } else {
        setDishes([...dishes, { ...saved, category_name: categories.find(c => c.id === saved.category_id)?.name }]);
      }
      setIsDishModalOpen(false);
      setEditingDish(null);
    } catch (error) {
      console.error('Error saving dish:', error);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const saved = await res.json();
      
      if (editingCategory) {
        setCategories(categories.map(c => c.id === saved.id ? saved : c));
      } else {
        setCategories([...categories, saved]);
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#1A1A1A] relative overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ChefHat size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-emerald-900">MenuMaster</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            Tổng quan
          </button>
          <button 
            onClick={() => { setView('dishes'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dishes' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Utensils size={20} />
            Món ăn
          </button>
          <button 
            onClick={() => { setView('categories'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'categories' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Layers size={20} />
            Loại món
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-emerald-900 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-70 uppercase tracking-wider font-bold mb-1">Hệ thống</p>
            <p className="text-sm font-medium">BTL Lập trình mạng</p>
            <p className="text-[10px] opacity-50 mt-2">v1.0.0 • 2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <LayoutDashboard size={24} />
            </button>
            <div>
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 line-clamp-1">
                {view === 'dashboard' && 'Bảng điều khiển'}
                {view === 'dishes' && 'Quản lý món ăn'}
                {view === 'categories' && 'Quản lý loại món'}
              </h2>
              <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Chào mừng bạn quay trở lại hệ thống quản lý.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            {view === 'dishes' && (
              <button 
                onClick={() => { setEditingDish(null); setIsDishModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-emerald-100 text-sm lg:text-base"
              >
                <Plus size={18} className="lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Thêm món ăn</span>
                <span className="sm:hidden">Thêm</span>
              </button>
            )}
            {view === 'categories' && (
              <button 
                onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-emerald-100 text-sm lg:text-base"
              >
                <Plus size={18} className="lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Thêm loại món</span>
                <span className="sm:hidden">Thêm</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Utensils size={24} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Tổng số món ăn</p>
                  <h3 className="text-3xl font-bold mt-1">{dishes.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Layers size={24} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Số lượng loại món</p>
                  <h3 className="text-3xl font-bold mt-1">{categories.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Thời gian TB phục vụ</p>
                  <h3 className="text-3xl font-bold mt-1">
                    {dishes.length ? Math.round(dishes.reduce((acc, d) => acc + d.service_time, 0) / dishes.length) : 0} phút
                  </h3>
                </div>

                <div className="md:col-span-3 bg-white p-4 lg:p-8 rounded-3xl border border-gray-200 shadow-sm mt-4 overflow-hidden">
                  <h4 className="text-lg font-bold mb-6">Món ăn mới nhất</h4>
                  <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-4">Món ăn</th>
                          <th className="pb-4">Loại món</th>
                          <th className="pb-4">Giá</th>
                          <th className="pb-4">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dishes.slice(-5).reverse().map(dish => (
                          <tr key={dish.id} className="group hover:bg-gray-50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <img src={dish.image} alt={dish.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                <span className="font-semibold text-gray-900">{dish.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-gray-600">{dish.category_name}</td>
                            <td className="py-4 text-sm font-bold text-emerald-600">{dish.price.toLocaleString()}đ</td>
                            <td className="py-4 text-sm text-gray-500">{dish.service_time} phút</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'dishes' && (
              <motion.div 
                key="dishes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Filters */}
                <div className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm món ăn..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 lg:gap-3">
                    <div className="col-span-2 sm:col-auto flex items-center gap-2 text-gray-400 lg:hidden mb-1">
                      <Filter size={16} />
                      <span className="text-xs font-bold uppercase">Bộ lọc</span>
                    </div>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 lg:px-4 py-2.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full"
                    >
                      <option value="">Tất cả loại</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    
                    <select 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 lg:px-4 py-2.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full"
                    >
                      <option value="">Mọi mức giá</option>
                      <option value="50000">Dưới 50k</option>
                      <option value="100000">Dưới 100k</option>
                      <option value="200000">Dưới 200k</option>
                    </select>

                    <select 
                      value={maxTime}
                      onChange={(e) => setMaxTime(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 lg:px-4 py-2.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:col-span-2"
                    >
                      <option value="">Mọi thời gian</option>
                      <option value="10">Dưới 10 phút</option>
                      <option value="20">Dưới 20 phút</option>
                      <option value="30">Dưới 30 phút</option>
                    </select>
                  </div>
                </div>

                {/* Dish Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDishes.map(dish => (
                    <motion.div 
                      layout
                      key={dish.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                            {dish.category_name}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDish(dish.id)}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1">{dish.name}</h3>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">Giá bán</span>
                            <span className="text-lg font-bold text-emerald-600">{dish.price.toLocaleString()}đ</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                            <Clock size={14} />
                            <span className="text-xs font-semibold">{dish.service_time}m</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {filteredDishes.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Không tìm thấy món ăn</h3>
                    <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'categories' && (
              <motion.div 
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {categories.map(category => (
                  <div key={category.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Layers size={24} />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{category.description}</p>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {dishes.filter(d => d.category_id === category.id).length} món ăn
                      </span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Dish Modal */}
      <AnimatePresence>
        {isDishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDishModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{editingDish ? 'Sửa món ăn' : 'Thêm món ăn mới'}</h3>
                <button onClick={() => setIsDishModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveDish} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên món ăn</label>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingDish?.name}
                    placeholder="VD: Phở bò tái lăn"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá bán (đ)</label>
                    <input 
                      name="price" 
                      type="number" 
                      required 
                      defaultValue={editingDish?.price}
                      placeholder="50000"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Thời gian (phút)</label>
                    <input 
                      name="service_time" 
                      type="number" 
                      required 
                      defaultValue={editingDish?.service_time}
                      placeholder="15"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại món</label>
                  <select 
                    name="category_id" 
                    required 
                    defaultValue={editingDish?.category_id}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Chọn loại món</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">URL Hình ảnh (tùy chọn)</label>
                  <input 
                    name="image" 
                    defaultValue={editingDish?.image}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsDishModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-colors"
                  >
                    Lưu món ăn
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{editingCategory ? 'Sửa loại món' : 'Thêm loại món mới'}</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên loại món</label>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingCategory?.name}
                    placeholder="VD: Món nướng"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    defaultValue={editingCategory?.description}
                    placeholder="Mô tả ngắn về loại món này..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-colors"
                  >
                    Lưu loại món
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
