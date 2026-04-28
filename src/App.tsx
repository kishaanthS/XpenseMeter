import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  LayoutDashboard, 
  Code, 
  Settings, 
  ChevronRight,
  Zap,
  Trash,
  TrendingUp,
  Terminal,
  ShieldCheck,
  Eraser,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useXpense } from './hooks/useXpense';
import { Category, SMSMessage, Transaction } from './types';
import { cn } from './lib/utils';

export default function App() {
  const { 
    transactions, 
    addTransactions, 
    getStats, 
    isSyncing, 
    clearAll, 
    deleteTransaction,
    refineWithAi 
  } = useXpense();

  const [activeTab, setActiveTab] = useState('Home');
  const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [syncSinceDate, setSyncSinceDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));

  const stats = getStats();

  const filteredTransactions = useMemo(() => {
    return filter === 'ALL' 
      ? transactions 
      : transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const handleSyncSubmit = () => {
    if (!rawSmsInput.trim()) return;
    
    setIsSyncing(true);
    const sinceTimestamp = new Date(syncSinceDate).getTime();
    
    // Simulate deep scan progress
    setTimeout(() => {
      const messages: SMSMessage[] = rawSmsInput
        .split('\n')
        .filter(line => line.trim().length > 5)
        .map((body, index) => ({
          id: `m_${Date.now()}_${index}`,
          sender: 'SIM_BANK',
          body: body.trim(),
          timestamp: Date.now() - (index * 1000 * 60 * 60 * 4)
        }));

      addTransactions(messages, sinceTimestamp);
      setRawSmsInput('');
      setShowSyncModal(false);
      setIsSyncing(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0A0C] text-[#E1E1E6] overflow-hidden justify-center items-center font-sans">
      {/* Mobile Frame (Centering the app for desktop users, full width for mobile) */}
      <div className="w-full max-w-md h-full md:h-[844px] md:max-h-[90vh] bg-[#0E0E12] md:rounded-[3rem] md:border-[8px] border-zinc-900 overflow-hidden relative flex flex-col shadow-2xl">
        
        {/* StatusBar Mock */}
        <div className="h-10 w-full flex justify-between items-center px-8 pt-4 pb-2 z-20">
          <span className="text-xs font-semibold">9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="w-6 h-3 border border-white/20 rounded-sm" />
          </div>
        </div>

        {/* Header */}
        <header className="px-6 pt-4 pb-2 flex justify-between items-center z-10 bg-[#0E0E12]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight italic text-white">XpenseMeter</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Heuristic Engine v2.1</p>
          </div>
          <button 
            onClick={() => setShowSyncModal(true)}
            className="p-3 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20 active:scale-90 transition-transform"
          >
            <RefreshCw size={18} className={cn(isSyncing && "animate-spin")} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scroll-smooth pb-32">
          
          {/* Dashboard View */}
          <AnimatePresence mode="wait">
            {activeTab === 'Home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Balance Slide */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <span className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">Total Net Balance</span>
                  <div className="text-4xl font-light mt-1 flex items-baseline gap-2">
                    <span className="text-xl">₹</span>
                    {stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex -space-x-2">
                       <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-white/10 flex items-center justify-center text-[10px] font-bold">H</div>
                       <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-white/10 flex items-center justify-center text-[10px] font-bold">I</div>
                       <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-white/10 flex items-center justify-center text-[10px] font-bold">+2</div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full text-white font-bold tracking-tighter">CONFIDENCE: 98.4%</span>
                  </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <StatCardSmall label="Inflow" value={stats.income} type="income" icon={<TrendingUp size={14} />} />
                  <StatCardSmall label="Outflow" value={stats.expenses} type="expense" icon={<Zap size={14} />} />
                </div>

                {/* Recent List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Transaction Feed</h3>
                    <div className="flex gap-3">
                      {(['ALL', 'EXPENSE', 'INCOME'] as const).map(c => (
                        <button key={c} onClick={() => setFilter(c)} className={cn("text-[10px] font-bold transition-colors", filter === c ? "text-blue-400 underline underline-offset-4" : "text-zinc-600")}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredTransactions.map((tx: Transaction) => (
                      <TxItem key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
                    ))}
                    {filteredTransactions.length === 0 && (
                      <div className="flex flex-col items-center py-10 opacity-20 italic text-xs">
                        <Terminal size={24} className="mb-2" />
                        Awaiting data stream...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 flex flex-col items-center py-10 text-center"
              >
                <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-600/20">
                  <BarChart3 size={32} />
                </div>
                <h3 className="text-xl font-light text-white">Analytics Node</h3>
                <p className="text-zinc-500 text-sm px-10">Advanced spending insights and category behavior analysis will appear here once local DB has sufficient history.</p>
              </motion.div>
            )}
            {activeTab === 'Rules' && (
              <motion.div 
                key="rules"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-blue-600/5 p-4 rounded-2xl border border-blue-600/20">
                   <div className="flex items-center gap-3">
                     <ShieldCheck className="text-blue-400" />
                     <span className="text-sm font-bold text-blue-100 uppercase tracking-widest">Active Heuristics</span>
                   </div>
                   <span className="text-[10px] bg-blue-600/20 px-2 py-1 rounded text-blue-400 font-bold">STABLE</span>
                </div>

                <div className="space-y-4">
                  <RuleItem title="Sent Patterns" desc="Matches keywords like 'Sent', 'Debited', 'Paid' followed by currency symbols." active />
                  <RuleItem title="Income Patterns" desc="Detects 'Credited', 'Received', 'Salary' for inflow classification." active />
                  <RuleItem title="Account Extraction" desc="Pulls account endings like 'A/c x1234' or 'ending in 4455'." active />
                  <RuleItem title="Merchant Refinement" desc="Extracts merchant names from 'at', 'to', or 'from' prepositions." active />
                  <RuleItem title="UPI Detection" desc="Prioritizes UPI Reference numbers and VPA addresses." active />
                </div>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5 space-y-6">
                  <div className="flex justify-between items-center group cursor-pointer" onClick={() => clearAll()}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Wipe Local Database</span>
                      <span className="text-xs text-zinc-600">Delete all processed transaction history</span>
                    </div>
                    <Eraser size={20} className="text-zinc-700 group-hover:text-rose-500 transition-colors" />
                  </div>

                  <div className="h-[1px] bg-white/5 w-full" />

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">AI Refinement (Gemini)</span>
                      <span className="text-xs text-zinc-600">Use AI for low-confidence messages</span>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                       <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/5 w-full" />

                  <div className="flex justify-between items-center opacity-40">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Biometric Lock</span>
                      <span className="text-xs text-zinc-600">Require login on app open</span>
                    </div>
                    <div className="w-10 h-5 bg-zinc-800 rounded-full relative">
                       <div className="w-4 h-4 bg-zinc-600 rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                   <AlertCircle size={18} className="text-amber-500 shrink-0" />
                   <p className="text-[10px] text-zinc-500 italic">Advanced settings like Multi-SIM support and Cloud Sync are available in the native APK builds via GitHub Export.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <nav className="absolute bottom-0 w-full bg-[#0E0E12] border-t border-white/5 px-8 pt-4 pb-10 flex justify-between items-center z-20">
          <NavItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'Home'} onClick={() => setActiveTab('Home')} />
          <NavItem icon={<BarChart3 size={20} />} label="Stats" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
          <NavItem icon={<Code size={20} />} label="Rules" active={activeTab === 'Rules'} onClick={() => setActiveTab('Rules')} />
          <NavItem icon={<Settings size={20} />} label="Prefs" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
        </nav>

        {/* Transaction Detail Overlay */}
        <AnimatePresence>
          {selectedTx && (
            <div className="absolute inset-0 z-40 flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTx(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-[#16161A] rounded-t-[2.5rem] border-t border-white/10 p-8 z-50 relative min-h-[60vh] flex flex-col gap-6"
              >
                <div className="w-12 h-1 bg-white/10 rounded-full self-center mb-2" />
                
                <header className="flex justify-between items-start">
                  <div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold border",
                      selectedTx.type === Category.EXPENSE ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {selectedTx.type}
                    </span>
                    <h3 className="text-2xl font-light mt-3">{selectedTx.merchant || 'Unknown Entity'}</h3>
                    <p className="text-zinc-500 text-sm mt-1">{format(selectedTx.timestamp, 'MMMM dd, yyyy · HH:mm')}</p>
                  </div>
                  <div className={cn("text-2xl font-bold", selectedTx.type === Category.EXPENSE ? "text-rose-400" : "text-emerald-400")}>
                    ₹{selectedTx.amount}
                  </div>
                </header>

                <div className="bg-black/30 rounded-2xl p-5 border border-white/5 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Parser Trace Log</span>
                    <div className="text-xs text-blue-400/80 mono leading-relaxed italic">
                      "{selectedTx.rawMessage}"
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <DebugLine label="Reference" value={selectedTx.txnId || 'N/A'} />
                    <DebugLine label="Method" value={selectedTx.account ? `ENDING ${selectedTx.account}` : 'UPI'} />
                    <DebugLine label="Confidence" value={`${(selectedTx.confidence * 100).toFixed(1)}%`} />
                    <DebugLine label="AI Refinement" value={selectedTx.isAiProcessed ? 'YES' : 'NO'} />
                  </div>
                  <div className="text-[10px] text-zinc-700 leading-tight mono border-t border-white/5 pt-4">
                    REGEXP MATCH:<br />
                    {"\\s?(\\d+[\\,\\d]*\\.?\\d*) -> Group [0]"}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  {!selectedTx.isAiProcessed && (
                    <button 
                      onClick={() => refineWithAi(selectedTx)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                      <Zap size={18} className="fill-white" />
                      Refine using Gemini AI
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      deleteTransaction(selectedTx.id);
                      setSelectedTx(null);
                    }}
                    className="w-full py-4 text-rose-400 font-bold hover:bg-rose-500/5 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash size={18} />
                    Discard Transaction
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sync Simulation Portal */}
        <AnimatePresence>
          {showSyncModal && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSyncModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full bg-[#16161A] p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-light text-blue-400">Sync Simulation</h3>
                  <p className="text-xs text-zinc-500 mt-1 italic">Web apps simulate SMS receiving through the portal below.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Sync From Date</label>
                    <input 
                      type="date" 
                      value={syncSinceDate}
                      onChange={(e) => setSyncSinceDate(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Raw SMS Input Data</label>
                    <textarea 
                      value={rawSmsInput}
                      onChange={(e) => setRawSmsInput(e.target.value)}
                      placeholder="Paste bank SMS here..."
                      className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRawSmsInput(`Sent Rs 1200.00 to Pizza Hut UPI Ref 9123812\nCredited with INR 50000.00 - Google Salary\nDebited Rs 400.00 at Starbucks x9912`)} className="px-4 py-3 bg-white/5 text-[10px] font-bold rounded-xl active:bg-white/10">LOAD SAMPLES</button>
                  <button onClick={handleSyncSubmit} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold shadow-lg shadow-blue-900/40">RUN PARSER</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function StatCardSmall({ label, value, type, icon }: { label: string, value: number, type: 'income' | 'expense', icon: React.ReactNode }) {
  return (
    <div className="bg-[#16161A] p-5 rounded-[1.5rem] border border-white/5 space-y-2">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{label}</span>
        <span className="text-lg font-medium text-white truncate">₹{value.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

function TxItem({ tx, onClick }: { tx: Transaction, onClick: () => void, key?: string | number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-[#16161A] hover:bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5 flex justify-between items-center group cursor-pointer transition-colors active:scale-95"
    >
      <div className="flex gap-4 items-center">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", tx.type === Category.EXPENSE ? "bg-rose-500/10 text-rose-500 border-rose-500/10" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10")}>
          {tx.type === Category.EXPENSE ? <Zap size={18} /> : <TrendingUp size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-100 line-clamp-1">{tx.merchant || 'Transaction'}</span>
          <span className="text-[10px] text-zinc-600 font-bold">{format(tx.timestamp, 'MMM dd · HH:mm')}</span>
        </div>
      </div>
      <div className={cn("text-sm font-bold shrink-0", tx.type === Category.EXPENSE ? "text-rose-400" : "text-emerald-400")}>
        {tx.type === Category.EXPENSE ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
      </div>
    </motion.div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className={cn("p-2 rounded-xl transition-all", active ? "text-blue-500" : "text-zinc-600 group-hover:text-zinc-400")}>
        {icon}
      </div>
      <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity", active && "opacity-100 text-blue-500")}>{label}</span>
    </button>
  );
}

function RuleItem({ title, desc, active }: { title: string, desc: string, active: boolean }) {
  return (
    <div className="p-4 bg-[#16161A] border border-white/5 rounded-2xl flex justify-between items-center group hover:border-blue-600/20 transition-all">
       <div className="flex flex-col gap-1">
         <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{title}</span>
         <span className="text-xs text-zinc-600 leading-relaxed">{desc}</span>
       </div>
       <div className={cn("w-2 h-2 rounded-full", active ? "bg-emerald-500 status-glow" : "bg-zinc-800")} />
    </div>
  );
}

function DebugLine({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-xs text-white mono font-semibold">{value}</span>
    </div>
  );
}
