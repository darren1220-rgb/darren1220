import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  LayoutDashboard, 
  PlusCircle,
  RefreshCw,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Investment, AssetType, ASSET_TYPES } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Stock' as AssetType,
    amount: '',
    cost: '',
    current_price: '',
    currency: 'TWD'
  });

  const fetchInvestments = async () => {
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      setInvestments(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          cost: parseFloat(formData.cost),
          current_price: parseFloat(formData.current_price || formData.cost)
        })
      });
      if (res.ok) {
        setIsAdding(false);
        setFormData({ name: '', type: 'Stock', amount: '', cost: '', current_price: '', currency: 'TWD' });
        fetchInvestments();
      }
    } catch (error) {
      console.error('Failed to add:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這筆投資紀錄嗎？')) return;
    try {
      const res = await fetch(`/api/investments/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInvestments();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const stats = useMemo(() => {
    const totalCost = investments.reduce((acc, inv) => acc + (inv.cost * inv.amount), 0);
    const totalValue = investments.reduce((acc, inv) => acc + (inv.current_price * inv.amount), 0);
    const profit = totalValue - totalCost;
    const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const typeData = ASSET_TYPES.map(type => {
      const value = investments
        .filter(inv => inv.type === type.value)
        .reduce((acc, inv) => acc + (inv.current_price * inv.amount), 0);
      return { name: type.label, value, color: type.color };
    }).filter(d => d.value > 0);

    return { totalCost, totalValue, profit, profitRate, typeData };
  }, [investments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-blue-600" />
            投資紀錄分析大師
          </h1>
          <p className="text-slate-500 mt-1">追蹤您的資產配置與投資績效</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 gap-2"
        >
          <PlusCircle size={20} />
          新增投資項目
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="總資產價值" 
          value={`$${stats.totalValue.toLocaleString()}`} 
          icon={<DollarSign className="text-blue-600" />}
        />
        <StatCard 
          title="投資總成本" 
          value={`$${stats.totalCost.toLocaleString()}`} 
          icon={<RefreshCw className="text-slate-600" />}
        />
        <StatCard 
          title="累積損益" 
          value={`$${stats.profit.toLocaleString()}`} 
          subValue={`${stats.profitRate.toFixed(2)}%`}
          trend={stats.profit >= 0 ? 'up' : 'down'}
          icon={stats.profit >= 0 ? <TrendingUp className="text-emerald-600" /> : <TrendingDown className="text-rose-600" />}
        />
        <StatCard 
          title="投資項目數" 
          value={investments.length.toString()} 
          icon={<LayoutDashboard className="text-indigo-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-1 glass-card p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PieChartIcon className="text-blue-600" size={20} />
            資產配置比例
          </h2>
          <div className="h-[300px]">
            {stats.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                尚無資料
              </div>
            )}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            個別項目價值分析
          </h2>
          <div className="h-[300px]">
            {investments.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investments.map(inv => ({ 
                  name: inv.name, 
                  value: inv.current_price * inv.amount,
                  cost: inv.cost * inv.amount
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="當前價值" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="投入成本" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                尚無資料
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">投資明細</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm font-medium uppercase tracking-wider">
                <th className="px-6 py-4">項目名稱</th>
                <th className="px-6 py-4">類別</th>
                <th className="px-6 py-4">數量</th>
                <th className="px-6 py-4">平均成本</th>
                <th className="px-6 py-4">當前價格</th>
                <th className="px-6 py-4">損益</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investments.map((inv) => {
                const profit = (inv.current_price - inv.cost) * inv.amount;
                const profitRate = (profit / (inv.cost * inv.amount)) * 100;
                const typeInfo = ASSET_TYPES.find(t => t.value === inv.type);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">{inv.name}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${typeInfo?.color}15`, color: typeInfo?.color }}
                      >
                        {typeInfo?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{inv.amount}</td>
                    <td className="px-6 py-4 text-slate-600">${inv.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">${inv.current_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex flex-col",
                        profit >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        <span className="font-bold">${profit.toLocaleString()}</span>
                        <span className="text-xs opacity-80">{profitRate.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(inv.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {investments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    目前尚無投資紀錄，點擊「新增投資項目」開始追蹤您的財富。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">新增投資項目</h2>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <Plus className="rotate-45 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">項目名稱</label>
                    <input 
                      required
                      type="text" 
                      placeholder="例如：台積電 (2330)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">資產類別</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as AssetType})}
                    >
                      {ASSET_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">持有數量</label>
                      <input 
                        required
                        type="number" 
                        step="any"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">平均成本</label>
                      <input 
                        required
                        type="number" 
                        step="any"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.cost}
                        onChange={e => setFormData({...formData, cost: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">當前市價 (選填)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="留空則預設與成本相同"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.current_price}
                      onChange={e => setFormData({...formData, current_price: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 mt-4 active:scale-95"
                  >
                    確認新增
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, subValue, trend, icon }: { 
  title: string; 
  value: string; 
  subValue?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subValue && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-bold mt-1",
            trend === 'up' ? "text-emerald-600" : "text-rose-600"
          )}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {subValue}
          </div>
        )}
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
