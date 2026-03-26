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
import { Query } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '../lib/appwrite';
import { ChatWidget } from '../components/ChatWidget';
import { PatientProfileModal } from '../components/PatientProfileModal';

export const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ id: string, date: string, time: string } | null>(null);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [activePatientProfileId, setActivePatientProfileId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    const uids = [...new Set(appointments.map(a => a.patientId).filter(Boolean))];
    uids.forEach(async (uidRaw) => {
      const uid = uidRaw as string;
      if (!patientNames[uid]) {
        try {
          const snap = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.USERS, uid);
          if (snap.firstName) {
            setPatientNames(prev => ({...prev, [uid]: `${snap.firstName} ${snap.lastName}`}));
          }
        } catch(e) {}
      }
    });
  }, [appointments]);

  useEffect(() => {
    const fetchApts = async () => {
      try {
        const currentUser = await account.get();
        setCurrentUserId(currentUser.$id);
        setCurrentUserName(currentUser.name);
        
        const fetchData = async () => {
          const aptsData = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.APPOINTMENTS, [
            Query.equal('doctorId', currentUser.$id),
            Query.limit(100),
            Query.orderAsc('date')
          ]);
          setAppointments(aptsData.documents.map(d => ({ id: d.$id, ...d })));
          setLoading(false);
        };
        fetchData();


      } catch (e) {
        setLoading(false);
      }
    };
    fetchApts();

  }, []);

  const filteredAppointments = appointments.filter(apt => {
    if (apt.date) {
      const aptDate = new Date(apt.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (aptDate < today) return false;
    }
    const realName = patientNames[apt.patientId] || apt.patientName || '';
    const matchesSearch = realName.toLowerCase().includes(searchQuery.toLowerCase()) || apt.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' ? true : apt.status === filterType;
    return matchesSearch && matchesFilter;
  });

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
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showCalendar ? 'List View' : 'View Calendar'}
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
      {showCalendar ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {Object.entries(filteredAppointments.reduce((acc, curr) => {
              if(!acc[curr.date]) acc[curr.date] = [];
              acc[curr.date].push(curr);
              return acc;
           }, {} as any)).map(([date, apts]: any) => (
             <div key={date} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-lg mb-4">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                {apts.map((a: any) => (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group transition-all">
                    <div>
                      <p 
                        onClick={() => a.patientId && setActivePatientProfileId(a.patientId)}
                        className="font-bold text-slate-700 cursor-pointer hover:text-brand-600 hover:underline transition-all"
                      >
                        {patientNames[a.patientId] || a.patientName}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mt-1 text-brand-600">{a.time}</p>
                    </div>
                    <span className={cn("w-3 h-3 rounded-full shadow-sm", a.status === 'Completed' ? "bg-emerald-400" : "bg-brand-500 animate-pulse")} title={a.status} />
                  </div>
                ))}
             </div>
           ))}
           {filteredAppointments.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-100 mt-4">No appointments scheduled matching filters.</div>}
        </div>
      ) : (
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
                        <p 
                          onClick={() => apt.patientId && setActivePatientProfileId(apt.patientId)}
                          className="font-bold text-slate-900 cursor-pointer hover:text-brand-600 hover:underline transition-colors block"
                        >
                          {patientNames[apt.patientId] || apt.patientName}
                        </p>
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
                    <select 
                      value={apt.priority || 'Medium'}
                      onChange={async (e) => {
                        await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.APPOINTMENTS, apt.id, { priority: e.target.value });
                      }}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg border-2 cursor-pointer outline-none transition-all",
                        apt.priority === 'High' ? "text-rose-700 bg-rose-50 border-rose-100" :
                        apt.priority === 'Medium' ? "text-amber-700 bg-amber-50 border-amber-100" :
                        "text-emerald-700 bg-emerald-50 border-emerald-100"
                      )}
                    >
                      <option value="High" className="uppercase font-black text-rose-700 shrink-0">High</option>
                      <option value="Medium" className="uppercase font-black text-amber-700 shrink-0">Medium</option>
                      <option value="Low" className="uppercase font-black text-emerald-700 shrink-0">Low</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setActiveChatId(apt.id)}
                        className="relative p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                        title="Live Chat"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {apt.messages?.length > 0 && apt.messages[apt.messages.length - 1].senderId !== currentUserId && !apt.messages[apt.messages.length - 1].read && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </button>
                      <button 
                        onClick={() => setRescheduleModal({ id: apt.id, date: apt.date || '', time: apt.time || '' })}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Reschedule Drop"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={async () => {
                           if(window.confirm(`Permanently cancel appointment for ${apt.patientName}?`)) {
                              await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.APPOINTMENTS, apt.id, { status: 'Cancelled' });
                           }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-5 h-5" />
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
      )}

      {/* Interactivity Modals */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 space-y-6">
             <h2 className="text-2xl font-display font-bold text-slate-900">Reschedule Event</h2>
             <div className="space-y-4">
                <div>
                   <label className="text-sm font-bold text-slate-700 block mb-2">New Date Block</label>
                   <input type="date" value={rescheduleModal.date} onChange={e => setRescheduleModal({...rescheduleModal, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-brand-500 outline-none rounded-xl font-bold text-slate-600" />
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-700 block mb-2">New Time Matrix</label>
                   <input type="time" value={rescheduleModal.time} onChange={e => setRescheduleModal({...rescheduleModal, time: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-brand-500 outline-none rounded-xl font-bold text-slate-600" />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
               <button onClick={() => setRescheduleModal(null)} className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all">Cancel Move</button>
               <button onClick={async () => {
                  try {
                    await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.APPOINTMENTS, rescheduleModal.id, { date: rescheduleModal.date, time: rescheduleModal.time, status: 'Rescheduled' });
                    setRescheduleModal(null);
                  } catch (e) { alert("Failed to secure new timeslot"); }
               }} className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-brand-500/20">Confirm Shift</button>
             </div>
          </motion.div>
        </div>
      )}

      {activeChatId && (
        <ChatWidget 
          documentId={activeChatId} 
          collectionName="appointments" 
          currentUserId={currentUserId} 
          currentUserName={currentUserName || 'Doctor'} 
          onClose={() => setActiveChatId(null)} 
        />
      )}

      {activePatientProfileId && (
        <PatientProfileModal patientId={activePatientProfileId} onClose={() => setActivePatientProfileId(null)} />
      )}
    </div>
  );
};

export default DoctorAppointments;
