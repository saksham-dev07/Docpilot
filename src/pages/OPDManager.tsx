import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export const OPDManager: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Currently Waiting', value: '0', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'In Consultation', value: '0', icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'Avg. Wait Time', value: '24m', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Critical Cases', value: '0', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const todayAppointments = appointmentsData.filter((app: any) => app.date === today);
      setQueue(todayAppointments);
      
      const waiting = todayAppointments.filter((app: any) => app.status === 'Waiting').length;
      const inConsultation = todayAppointments.filter((app: any) => app.status === 'In Progress').length;
      const critical = todayAppointments.filter((app: any) => app.priority === 'High').length;
      const totalWaitMins = waiting * 12; // Dynamic 12m tracker per patient
      
      setStats(prev => [
        { ...prev[0], value: waiting.toString() },
        { ...prev[1], value: inConsultation.toString() },
        { ...prev[2], value: `${totalWaitMins}m` },
        { ...prev[3], value: critical.toString() }
      ]);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleComplete = async (patientId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', patientId), { status: 'Completed' });
    } catch(err) {
      console.error(err);
    }
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
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">OPD Manager</h1>
          <p className="text-slate-500 text-lg">Manage your outpatient queue and triage real-time.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Queue
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Patient
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
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Queue Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-display font-bold text-slate-900">Patient Queue</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse" />
              Live Updates
            </div>
          </div>
          <div className="relative group w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search queue..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival / Wait</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Complaint</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-500">Loading queue...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-500">No patients in queue for today.</td>
                </tr>
              ) : queue.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                        {patient.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{patient.patientName}</p>
                        <p className="text-xs text-slate-500">ID: {patient.patientId?.slice(-5)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 text-sm">{patient.time}</p>
                    <p className="text-xs text-slate-400">Scheduled</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block text-center",
                      patient.status === 'In Progress' ? "bg-brand-50 text-brand-600" :
                      patient.status === 'Waiting' ? "bg-amber-50 text-amber-600" :
                      patient.status === 'Completed' ? "bg-emerald-50 text-emerald-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {patient.status || 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        patient.priority === 'High' ? "bg-rose-500" :
                        patient.priority === 'Medium' ? "bg-amber-500" :
                        "bg-emerald-500"
                      )} />
                      <span className="text-xs font-bold text-slate-700">{patient.priority || 'Medium'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-600 font-medium truncate max-w-[150px]">{patient.type || 'Routine Check'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleComplete(patient.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Mark as Completed">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <Link to={`/doctor/consultations?id=${patient.id}`} className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default OPDManager;
