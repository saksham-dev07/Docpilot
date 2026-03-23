import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', auth.currentUser.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAppointments = appointments.filter(apt => 
    apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    remaining: appointments.filter(a => a.status !== 'Completed').length
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">My Appointments</h1>
          <p className="text-slate-500 text-lg">Manage your daily schedule and patient consultations.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            View Calendar
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total</p>
            <h3 className="text-2xl font-display font-bold text-slate-900">{stats.total} Appointments</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Completed</p>
            <h3 className="text-2xl font-display font-bold text-slate-900">{stats.completed} Patients</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Remaining</p>
            <h3 className="text-2xl font-display font-bold text-slate-900">{stats.remaining} Patients</h3>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h2 className="text-xl font-display font-bold text-slate-900">Schedule Details</h2>
          <div className="relative group w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time / Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">Loading appointments...</td>
                </tr>
              ) : filteredAppointments.length > 0 ? filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{apt.patientName}</p>
                        <p className="text-xs text-slate-500">Patient</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 text-sm">{apt.time}</p>
                    <p className="text-xs text-slate-400">{apt.date}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-600 font-medium">{apt.type}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                      apt.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600" : 
                      apt.status === 'Completed' ? "bg-slate-50 text-slate-500" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        apt.priority === 'High' ? "bg-rose-500" :
                        apt.priority === 'Medium' ? "bg-amber-500" :
                        "bg-emerald-500"
                      )} />
                      <span className="text-xs font-bold text-slate-700">{apt.priority || 'Medium'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">No appointments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorAppointments;
