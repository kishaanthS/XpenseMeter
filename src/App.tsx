import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Trash2, 
  LayoutDashboard, 
  Settings, 
  Zap, 
  TrendingUp,
  X,
  Notebook,
  Wallet,
  Search,
  Download,
  Calendar,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format, isSameDay, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addWeeks, addMonths, addYears, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useXpense } from './hooks/useXpense';
import { Category, Transaction } from './types';
import { cn } from './lib/utils';

type PeriodType = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export default function App() {
  const { 
    transactions, 
    addTransaction, 
    updateTransaction,
    getPeriodStats,
    clearAll, 
    deleteTransaction,
  } = useXpense();

  const [activeTab, setActiveTab] = useState('Home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalType, setModalType] = useState<Category>(Category.EXPENSE);
  
  // Period State
  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [refDate, setRefDate] = useState(new Date());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [bank, setBank] = useState('');
  const [notes, setNotes] = useState('');

  const periodRange = useMemo(() => {
    switch (periodType) {
      case 'DAY': return { start: startOfDay(refDate), end: endOfDay(refDate) };
      case 'WEEK': return { start: startOfWeek(refDate, { weekStartsOn: 1 }), end: endOfWeek(refDate, { weekStartsOn: 1 }) };
      case 'MONTH': return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
      case 'YEAR': return { start: startOfYear(refDate), end: endOfYear(refDate) };
    }
  }, [periodType, refDate]);

  const pStats = useMemo(() => {
    return getPeriodStats(periodRange.start, periodRange.end);
  }, [periodRange, transactions]);

  const filteredTransactions = useMemo(() => {
    const items = pStats.items;
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(t => 
      t.categoryName.toLowerCase().includes(q) || 
      t.bank.toLowerCase().includes(q) || 
      t.notes.toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  }, [pStats.items, searchQuery]);

  const navigatePeriod = (direction: 'PREV' | 'NEXT') => {
    setRefDate(prev => {
      if (direction === 'PREV') {
        switch (periodType) {
          case 'DAY': return subDays(prev, 1);
          case 'WEEK': return subWeeks(prev, 1);
          case 'MONTH': return subMonths(prev, 1);
          case 'YEAR': return subYears(prev, 1);
        }
      } else {
        switch (periodType) {
          case 'DAY': return addDays(prev, 1);
          case 'WEEK': return addWeeks(prev, 1);
          case 'MONTH': return addMonths(prev, 1);
          case 'YEAR': return addYears(prev, 1);
        }
      }
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryName) return;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        amount: parseFloat(amount),
        type: modalType,
        categoryName: categoryName.trim(),
        bank: bank.trim() || 'Cash',
        notes: notes.trim()
      });
    } else {
      addTransaction({
        amount: parseFloat(amount),
        type: modalType,
        categoryName: categoryName.trim(),
        bank: bank.trim() || 'Cash',
        notes: notes.trim()
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setCategoryName('');
    setBank('');
    setNotes('');
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const openModal = (type: Category) => {
    setModalType(type);
    if (type === Category.INCOME) {
      setCategoryName('Income');
    } else {
      setCategoryName('');
    }
    setShowAddModal(true);
  };

  const startEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalType(tx.type);
    setAmount(tx.amount.toString());
    setCategoryName(tx.categoryName);
    setBank(tx.bank);
    setNotes(tx.notes);
    setShowAddModal(true);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#EC4899'];

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTransactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const dateLabel = periodType === 'DAY' ? format(refDate, 'MMM_dd_yyyy') : 
                     periodType === 'WEEK' ? `${format(periodRange.start, 'MMM_dd')}_to_${format(periodRange.end, 'MMM_dd')}` :
                     periodType === 'MONTH' ? format(refDate, 'MMMM_yyyy') : 
                     format(refDate, 'yyyy');
    
    downloadAnchorNode.setAttribute("download", `Xpense_${dateLabel}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#0A0A0C] text-[#E1E1E6] overflow-hidden justify-center items-center font-sans uppercase">
      {/* Mobile Frame */}
      <div className="w-full max-w-md h-[100dvh] md:h-[844px] md:max-h-[90vh] bg-[#0E0E12] md:rounded-[3.5rem] md:border-[12px] border-zinc-900 overflow-hidden relative flex flex-col shadow-2xl">
        
        {/* Fixed Header */}
        <header className="px-6 pt-10 pb-4 flex justify-between items-center z-20 bg-[#0E0E12]/80 backdrop-blur-lg sticky top-0 border-b border-white/5">
          <div>
            <h1 className="text-xl font-black tracking-tighter italic text-white flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center rotate-3">
                <Wallet size={16} className="text-white -rotate-3" />
              </div>
              XPENSE
            </h1>
            <p className="text-[8px] text-zinc-600 font-bold tracking-[0.2em] mt-1">Manual Ledger v3.2</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={exportData} className="text-zinc-600 hover:text-blue-400 transition-colors">
                <Download size={18} />
             </button>
             <button onClick={() => setActiveTab('Settings')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <Settings size={18} />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar pb-32">
          
          <AnimatePresence mode="wait">
            {activeTab === 'Home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="px-6 py-6 space-y-8"
              >
                {/* Period Selector */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                   {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as PeriodType[]).map(type => (
                     <button 
                       key={type}
                       onClick={() => {
                         setPeriodType(type);
                         setRefDate(new Date());
                       }}
                       className={cn(
                         "flex-1 py-2 text-[9px] font-black tracking-widest rounded-xl transition-all",
                         periodType === type ? "bg-blue-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                       )}
                     >
                       {type}
                     </button>
                   ))}
                </div>

                {/* Summary Section - Dynamic tracker */}
                <section className="space-y-4">
                   <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-10 -mt-10 blur-3xl " />
                      
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-zinc-600 text-[10px] font-black tracking-widest uppercase">Summary</span>
                        <div className="flex items-center gap-4 relative z-30">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               navigatePeriod('PREV');
                             }} 
                             className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                           >
                              <ChevronLeft size={18} />
                           </button>
                           <div className="bg-blue-600/20 px-3 py-1.5 rounded-xl border border-blue-600/20">
                              <span className="text-[9px] text-blue-400 font-black tracking-tight whitespace-nowrap uppercase">
                                {periodType === 'DAY' ? format(refDate, 'MMM dd, yyyy') : 
                                 periodType === 'WEEK' ? `${format(periodRange.start, 'MMM dd')} - ${format(periodRange.end, 'MMM dd')}` :
                                 periodType === 'MONTH' ? format(refDate, 'MMMM yyyy') : 
                                 format(refDate, 'yyyy')}
                              </span>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               navigatePeriod('NEXT');
                             }} 
                             className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                           >
                              <ChevronRight size={18} />
                           </button>
                        </div>
                      </div>

                      <div className="text-4xl font-black flex items-baseline gap-2 text-white italic">
                        <span className="text-rose-400">₹{pStats.expenses.toLocaleString()}</span>
                        <span className="text-zinc-700 text-xs">/</span>
                        <span className="text-emerald-400 text-xl">₹{pStats.income.toLocaleString()}</span>
                      </div>
                   </div>
                </section>

                {/* Quick Actions */}
                <section className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => openModal(Category.EXPENSE)}
                     className="bg-zinc-100 text-black py-5 rounded-[2rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 shadow-lg shadow-white/5"
                   >
                     <Zap size={14} strokeWidth={3} />
                     SPENT
                   </button>
                   <button 
                     onClick={() => openModal(Category.INCOME)}
                     className="bg-blue-600 text-white py-5 rounded-[2rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/10"
                   >
                     <TrendingUp size={14} strokeWidth={3} />
                     INCOME
                   </button>
                </section>

                {/* Transactions List */}
                <section className="space-y-6">
                   <div className="flex justify-between items-center px-2">
                      <h3 className="text-[10px] font-black text-zinc-600 tracking-widest flex items-center gap-2">
                        <Calendar size={12} />
                        RECENT LOGS
                      </h3>
                      <div className="bg-white/5 flex items-center px-3 py-1.5 rounded-full">
                         <Search size={10} className="text-zinc-600" />
                         <input 
                            type="text" 
                            placeholder="SEARCH" 
                            className="bg-transparent border-none text-[8px] font-bold text-zinc-400 focus:outline-none w-16 ml-1 placeholder:text-zinc-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="space-y-3">
                      {filteredTransactions.map((tx) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={tx.id} 
                          onClick={() => startEdit(tx)}
                          className="bg-[#16161A] border border-white/5 p-5 rounded-[2rem] flex justify-between items-center group relative cursor-pointer hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex gap-4 items-center">
                            <div className={cn(
                              "w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-[9px] border",
                              tx.type === Category.EXPENSE ? "bg-rose-500/5 text-rose-500 border-rose-500/10" : "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"
                            )}>
                              {tx.type === Category.EXPENSE ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-black text-zinc-100 tracking-tight uppercase">{tx.categoryName}</span>
                                 <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-zinc-600 font-black">{tx.bank}</span>
                              </div>
                              <span className="text-[9px] text-zinc-700 font-bold mt-1 truncate max-w-[120px]">{tx.notes || '---'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className={cn("text-xs font-black tracking-tight", tx.type === Category.EXPENSE ? "text-rose-400" : "text-emerald-400")}>
                               {tx.type === Category.EXPENSE ? '-' : '+'}₹{tx.amount.toLocaleString()}
                             </span>
                             <span className="text-[8px] text-zinc-800 font-bold mt-1">{format(tx.timestamp, 'MMM dd, HH:mm')}</span>
                          </div>
                        </motion.div>
                      ))}

                      {filteredTransactions.length === 0 && (
                        <div className="py-20 text-center space-y-4 opacity-10">
                           <Notebook size={40} className="mx-auto" />
                           <p className="text-[10px] font-black tracking-[0.2em]">NO ENTRIES IN LEDGER</p>
                        </div>
                      )}
                   </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'Stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-6 py-6 space-y-8"
              >
                <section className="space-y-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">{periodType}ly Breakdown</span>
                      <h2 className="text-2xl font-black italic tracking-tighter">ANALYTICS</h2>
                   </div>

                   <div className="h-[200px] w-full bg-[#16161A] p-4 rounded-[2.5rem] border border-white/5">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pStats.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 7, fontWeight: 700, fill: '#52525b' }} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#16161A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </section>

                <section className="grid grid-cols-1 gap-6">
                   <div className="bg-[#16161A] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Category Split</span>
                        <PieChartIcon size={14} className="text-zinc-600" />
                      </div>
                      
                      <div className="h-[180px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={pStats.categoryStats}
                               cx="50%"
                               cy="50%"
                               innerRadius={40}
                               outerRadius={60}
                               paddingAngle={5}
                               dataKey="value"
                             >
                               {pStats.categoryStats.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                             </Pie>
                             <Tooltip />
                           </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2 mt-4">
                        {pStats.categoryStats.map((item, idx) => (
                          <div key={item.name} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                               <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">{item.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-white">₹{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-6 py-6 space-y-8"
              >
                <div className="space-y-1">
                   <h2 className="text-xl font-black italic tracking-tighter">CONFIGURATION</h2>
                   <p className="text-[10px] text-zinc-600 font-bold tracking-widest">SYSTEM PREFERENCES</p>
                </div>

                <div className="space-y-4">
                   <SettingItem 
                      icon={<Download size={18} />} 
                      title="EXPORT BACKUP" 
                      desc="Download ledger as JSON for portability."
                      onClick={exportData}
                   />
                   <SettingItem 
                      icon={<Trash2 size={18} className="text-rose-500" />} 
                      title="PURGE DATABASE" 
                      desc="Irreversibly wipe all transaction history."
                      onClick={() => setShowPurgeConfirm(true)}
                      danger
                   />
                </div>

                <div className="pt-8 border-t border-white/5 opacity-30 text-center">
                   <p className="text-[8px] font-black tracking-widest leading-loose">
                     DEVICE STORAGE ONLY<br/>
                     NO EXTERNAL SYNC ACTIVE<br/>
                     ENCRYPTED AT REST (LOCALSTORAGE)
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Simplified Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[70%] h-18 bg-[#16161A]/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] flex justify-around items-center px-4 z-30 shadow-2xl">
           <NavItem 
             icon={<LayoutDashboard size={20} />} 
             label="HOME" 
             active={activeTab === 'Home'} 
             onClick={() => setActiveTab('Home')}
           />
           <div className="bg-white/5 w-px h-6 mx-2" />
           <NavItem 
             icon={<BarChart3 size={20} />} 
             label="STATS" 
             active={activeTab === 'Stats'} 
             onClick={() => setActiveTab('Stats')}
           />
        </div>

        {/* Modal Entry Form */}
        <AnimatePresence>
          {showAddModal && (
            <div className="absolute inset-0 z-[60] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm">
               <motion.div 
                 initial={{ y: "100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="bg-[#0E0E12] w-full p-8 pb-12 rounded-t-[3.5rem] border-t border-white/10 space-y-8 shadow-3xl"
               >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <h2 className="text-xl font-black italic tracking-tighter">
                         {editingTransaction ? 'REVISE' : 'LOG'} {modalType === Category.EXPENSE ? 'PAYMENT' : 'RECEIPT'}
                       </h2>
                       <span className="text-[8px] text-zinc-600 font-black tracking-widest mt-1 uppercase italic">Identity: {txId(editingTransaction)}</span>
                    </div>
                    <button onClick={resetForm} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[9px] text-zinc-600 font-black tracking-widest ml-1">VALUE (₹)</label>
                          <div className="relative">
                             <input 
                               type="number" 
                               required
                               placeholder="0.00"
                               value={amount}
                               onChange={(e) => setAmount(e.target.value)}
                               className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-4xl font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                             />
                             <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className={cn(
                                   "w-2 h-2 rounded-full",
                                   modalType === Category.EXPENSE ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                )} />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] text-zinc-600 font-black tracking-widest ml-1">BUCKET</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. FOOD"
                              value={categoryName}
                              onChange={(e) => setCategoryName(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-zinc-600 font-black tracking-widest ml-1">ACCOUNT</label>
                            <input 
                              type="text" 
                              placeholder="e.g. UPI / CASH"
                              value={bank}
                              onChange={(e) => setBank(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[9px] text-zinc-600 font-black tracking-widest ml-1">ANNOTATION</label>
                          <textarea 
                            placeholder="WHAT WAS THIS FOR?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] font-bold text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 h-24 uppercase"
                          />
                       </div>
                    </div>

                    <div className="flex gap-4">
                        {editingTransaction && (
                          <button 
                             type="button"
                             onClick={() => {
                               deleteTransaction(editingTransaction.id);
                               resetForm();
                             }}
                             className="w-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 transition-all"
                          >
                             <Trash2 size={20} />
                          </button>
                        )}
                        <button 
                          type="submit"
                          className={cn(
                            "flex-1 py-5 rounded-[2rem] font-black text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl",
                            modalType === Category.EXPENSE ? "bg-white text-black shadow-white/5" : "bg-blue-600 text-white shadow-blue-600/20"
                          )}
                        >
                          {editingTransaction ? 'UPDATE LOG' : 'CONFIRM ENTRY'}
                        </button>
                    </div>
                  </form>
               </motion.div>
            </div>
          )}

          {showPurgeConfirm && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#121216] w-full p-8 rounded-[3rem] border border-white/10 space-y-6 text-center"
               >
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trash2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">Purge Database?</h2>
                    <p className="text-[10px] text-zinc-600 font-bold tracking-widest leading-relaxed uppercase">
                      This will irreversibly delete all your logs. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={() => {
                        clearAll();
                        setShowPurgeConfirm(false);
                        setActiveTab('Home');
                      }}
                      className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-rose-600 transition-all"
                    >
                      DELETE EVERYTHING
                    </button>
                    <button 
                      onClick={() => setShowPurgeConfirm(false)}
                      className="w-full py-4 bg-white/5 text-zinc-400 rounded-2xl font-black text-[10px] tracking-widest hover:bg-white/10 transition-all"
                    >
                      NEVERMIND
                    </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function txId(tx: Transaction | null) {
  if (!tx) return 'NEW';
  return tx.id.split('_')[2]?.substring(0, 4).toUpperCase() || 'TX';
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all cursor-pointer group",
        active ? "text-blue-500" : "text-zinc-600 hover:text-zinc-400"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-blue-600/10" : "group-hover:bg-white/5"
      )}>
        {icon}
      </div>
      <span className={cn("text-[7px] font-black tracking-widest", active ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
        {label}
      </span>
    </div>
  );
}

function SettingItem({ icon, title, desc, onClick, danger }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, danger?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-[#16161A] border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.02] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
          danger ? "bg-rose-500/5 text-rose-500" : "bg-white/5 text-zinc-400"
        )}>
          {icon}
        </div>
        <div className="flex flex-col text-left">
           <span className={cn("text-[10px] font-black tracking-widest", danger ? "text-rose-500" : "text-zinc-100")}>{title}</span>
           <span className="text-[9px] text-zinc-600 font-bold mt-1 uppercase italic">{desc}</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
