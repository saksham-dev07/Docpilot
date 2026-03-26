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
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Query } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '../lib/appwrite';
import { ChatWidget } from '../components/ChatWidget';

export const PatientConsultations: React.FC = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<{ doctorId: string, patientId: string, sessionContext: string } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {

    const fetchCons = async () => {
      try {
        const currentUser = await account.get();
        setCurrentUserId(currentUser.$id);

        const fetchData = async () => {
          try {
             const consData = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, [
               Query.equal('patientId', currentUser.$id),
               Query.orderDesc('date'),
               Query.limit(100)
             ]);
             setConsultations(consData.documents.map(d => ({id: d.$id, ...d})).filter(c => !c.id.endsWith('_chat')));
             setLoading(false);
          } catch(e) { setLoading(false); }
        };
        fetchData();
      } catch(e) { setLoading(false); }
    };
    fetchCons();
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
  const pastConsultations = consultations.filter(c => c.status === 'Completed');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">My Consultations</h1>
          <p className="text-slate-500 text-lg">Access your virtual appointments and medical history.</p>
        </motion.div>
        <div className="flex gap-3">
          <Link to="/patient/appointments" className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule New
          </Link>
        </div>
      </div>

      {/* Live Now Card */}
      {liveConsultation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-brand-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-500/20"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 rounded-4xl bg-white/20 backdrop-blur-xl border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
              <UserIcon className="w-20 h-20 text-white/20" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Doctor is Waiting
              </div>
              <h2 className="text-4xl font-display font-bold mb-2">{liveConsultation.doctorName}</h2>
              <p className="text-brand-100 text-lg mb-8 italic">"Ready for our follow-up regarding your recent consultation."</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button onClick={() => setActiveChat({ doctorId: liveConsultation.doctorId, patientId: currentUserId || '', sessionContext: `${liveConsultation.date} • ${liveConsultation.time}` })} className="px-8 py-4 bg-white text-brand-600 rounded-2xl font-bold hover:bg-brand-50 transition-all flex items-center gap-2">
                  <MessageSquare className="w-5 h-5"/> Start Chat Session
                </button>
                <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all">
                  Prepare Records
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-50 rounded-[3rem] p-20 text-center text-slate-400 border-2 border-dashed border-slate-200">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No live consultations at the moment.</p>
        </div>
      )}

      {/* Upcoming Consultations */}
      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold text-slate-900">Upcoming Consultations</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {loading ? (
          <div className="col-span-full py-10 text-center text-slate-400">Loading consultations...</div>
        ) : upcomingConsultations.length > 0 ? upcomingConsultations.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-slate-400" />
              </div>
              <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                {c.date}
              </div>
            </div>
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{c.doctorName}</h4>
            <p className="text-xs text-slate-500 mb-6">{c.specialty || 'General Physician'}</p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-8">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {c.time}
              </div>
              <div className="flex items-center gap-1.5 text-brand-600">
                <MessageSquare className="w-3.5 h-3.5" />
                Chat Session
              </div>
            </div>
            <div className="flex gap-2">
               <Link to="/book" state={{ isReschedule: true, oldConsultationId: c.id, rescheduleCount: c.rescheduleCount || 0 }} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all text-center">
                Reschedule
              </Link>
               <button onClick={() => setActiveChat({ doctorId: c.doctorId, patientId: currentUserId || '', sessionContext: `${c.date} • ${c.time}` })} className="relative flex-1 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 text-center flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Start Chat
                {c.messages?.length > 0 && c.messages[c.messages.length - 1].senderId !== currentUserId && !c.messages[c.messages.length - 1].read && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-10 text-center text-slate-400">No upcoming consultations found.</div>
        )}
      </div></div>

      {/* Missed Consultations */}
      {missedConsultations.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-slate-900">Missed Consultations</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {missedConsultations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-slate-50 p-8 rounded-4xl border border-slate-100 shadow-sm transition-all grayscale"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Missed • {c.date}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{c.doctorName}</h4>
                <p className="text-xs text-slate-500 mb-6">{c.specialty || 'General Physician'}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-8">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {c.time}
                  </div>
                </div>
                <Link to="/book" state={{ isReschedule: true, oldConsultationId: c.id, rescheduleCount: c.rescheduleCount || 0 }} className="block w-full py-3 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all text-center cursor-pointer">
                  Reschedule
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past Records */}
      <div className="bg-slate-50 rounded-4xl p-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-display font-bold text-slate-900">Past Consultations</h3>
          <button className="text-sm font-bold text-brand-600 hover:text-brand-700">View All History</button>
        </div>
        <div className="space-y-4">
          {pastConsultations.length > 0 ? pastConsultations.map((c, i) => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Consultation Summary - {c.date}</p>
                  <p className="text-xs text-slate-500">{c.doctorName} • {c.specialty || 'General Physician'}</p>
                </div>
              </div>
              <button className="p-3 text-slate-400 hover:text-brand-600 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )) : (
            <div className="py-10 text-center text-slate-400">No past consultations found.</div>
          )}
        </div>
      </div>
      
      {activeChat && (
        <ChatWidget 
          doctorId={activeChat.doctorId}
          patientId={activeChat.patientId}
          sessionContext={activeChat.sessionContext}
          currentUserId={currentUserId || ''} 
          currentUserName="Patient" 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};

export default PatientConsultations;
