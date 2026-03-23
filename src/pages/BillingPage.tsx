import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  DollarSign,
  PieChart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const BillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: '$0', change: '+0%', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending Payments', value: '$0', change: '+0%', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Avg. Invoice', value: '$0', change: '+0%', icon: TrendingUp, color: 'text-brand-600 bg-brand-50' },
    { label: 'Overdue Amount', value: '$0', change: '+0%', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'invoices'),
      where('doctorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setInvoices(invoicesData);
      
      // Calculate stats
      const totalRevenue = invoicesData
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
      
      const pendingAmount = invoicesData
        .filter((inv: any) => inv.status === 'Pending')
        .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
      
      const overdueAmount = invoicesData
        .filter((inv: any) => inv.status === 'Overdue')
        .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
      
      const avgInvoice = invoicesData.length > 0 
        ? totalRevenue / invoicesData.length 
        : 0;
      
      setStats([
        { ...stats[0], value: `$${totalRevenue.toLocaleString()}` },
        { ...stats[1], value: `$${pendingAmount.toLocaleString()}` },
        { ...stats[2], value: `$${Math.round(avgInvoice).toLocaleString()}` },
        { ...stats[3], value: `$${overdueAmount.toLocaleString()}` },
      ]);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Financial Health</h1>
          <p className="text-slate-500 text-lg">Manage invoices, payments, and practice revenue.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Statements
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.change}
                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h2 className="text-xl font-display font-bold text-slate-900">Recent Invoices</h2>
            <div className="flex items-center gap-3">
              <div className="relative group w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                />
              </div>
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-600 transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500">Loading invoices...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500">No invoices found.</td>
                  </tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-sm">{inv.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{inv.method || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-sm">{inv.patientName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-sm">${inv.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{inv.date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                        inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600" :
                        inv.status === 'Pending' ? "bg-amber-50 text-amber-600" :
                        "bg-rose-50 text-rose-600"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payment Methods Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-slate-900 rounded-4xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100" />
                  <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-200" />
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Primary Card</p>
              <h3 className="text-2xl font-display font-bold mb-8">•••• •••• •••• 4242</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Card Holder</p>
                  <p className="text-sm font-bold">Dr. {auth.currentUser?.displayName || 'Sarah Chen'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Expires</p>
                  <p className="text-sm font-bold">12/28</p>
                </div>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-600 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-brand-600" />
              Revenue Breakdown
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Consultations', amount: '$28,400', percent: 65, color: 'bg-brand-600' },
                { label: 'Lab Referrals', amount: '$8,250', percent: 20, color: 'bg-emerald-500' },
                { label: 'Procedures', amount: '$6,200', percent: 15, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    <span className="text-sm font-black text-slate-900">{item.amount}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">
              View Detailed Analytics
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPage;
