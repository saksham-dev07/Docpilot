import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  Clock, 
  User as UserIcon, 
  Search, 
  Filter, 
  ChevronRight,
  VideoOff,
  MessageSquare,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const DoctorConsultations: React.FC = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'consultations'),
      where('doctorId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConsultations(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isPast = (date: string, time: string) => {
    try {
      const [timeVal, modifier] = time.split(' ');
      let [hours, minutes] = timeVal.split(':').map(Number);
      if (hours === 12 && modifier === 'AM') hours = 0;
      else if (hours < 12 && modifier === 'PM') hours += 12;
      const slotDateTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      return slotDateTime < new Date();
    } catch(e) { return false; }
  };

  const liveConsultation = consultations.find(c => c.status === 'Live');
  const upcomingConsultations = consultations.filter(c => c.status === 'Scheduled' && !isPast(c.date, c.time));
  const missedConsultations = consultations.filter(c => c.status === 'Scheduled' && isPast(c.date, c.time));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Video Consultations</h1>
          <p className="text-slate-500 text-lg">Connect with your patients remotely via AI-powered video calls.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Video className="w-4 h-4" />
            Start Instant Meeting
          </button>
        </div>
      </div>

      {/* Live Now Card */}
      {liveConsultation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Zap className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              <UserIcon className="w-20 h-20 text-white/20" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live Now
              </div>
              <h2 className="text-4xl font-display font-bold mb-2">{liveConsultation.patientName}</h2>
              <p className="text-slate-400 text-lg mb-8 italic">"Consultation in progress..."</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link to="/doctor/consultation" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all flex items-center gap-2">
                  Join Consultation
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all">
                  View Records
                </button>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-lg p-6 rounded-3xl border border-white/5">
                <Activity className="w-6 h-6 text-brand-400 mb-2" />
                <p className="text-xs text-slate-400 uppercase font-black">Heart Rate</p>
                <p className="text-xl font-bold">-- BPM</p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg p-6 rounded-3xl border border-white/5">
                <Clock className="w-6 h-6 text-brand-400 mb-2" />
                <p className="text-xs text-slate-400 uppercase font-black">Duration</p>
                <p className="text-xl font-bold">--:--</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-50 rounded-[3rem] p-20 text-center text-slate-400 border-2 border-dashed border-slate-200">
          <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No live consultations at the moment.</p>
        </div>
      )}

      {/* Scheduled Consultations */}
      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold text-slate-900">Upcoming Consultations</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-10 text-center text-slate-400">Loading consultations...</div>
          ) : upcomingConsultations.length > 0 ? upcomingConsultations.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group"
            >
              <div className="w-20 h-20 rounded-3xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{c.patientName}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.time}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Video Consultation • {c.date}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </button>
                  <Link to="/doctor/consultation" className="flex-1 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all flex items-center justify-center gap-2">
                    <Video className="w-3 h-3" />
                    Join
                  </Link>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-10 text-center text-slate-400">No upcoming consultations found.</div>
          )}
        </div>
      </div>

      {/* Missed Consultations */}
      {missedConsultations.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-slate-900">Missed Consultations</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {missedConsultations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-slate-50 p-8 rounded-4xl border border-slate-100 shadow-sm transition-all flex items-center gap-6 grayscale"
              >
                <div className="w-20 h-20 rounded-3xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{c.patientName}</h4>
                    <span className="px-2 py-1 bg-red-50 text-red-500 rounded-md text-[10px] font-black uppercase tracking-wider">Missed</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Video Consultation • {c.date}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultations;
