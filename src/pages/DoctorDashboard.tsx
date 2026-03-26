import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  User,
  Calendar, 
  Video, 
  Zap, 
  ArrowUpRight, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Activity,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PatientProfileModal } from '../components/PatientProfileModal';

export const DoctorDashboard: React.FC = () => {
  const [userName, setUserName] = useState('Doctor');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [patientPhotos, setPatientPhotos] = useState<Record<string, string>>({});
  const [activePatientProfileId, setActivePatientProfileId] = useState<string | null>(null);

  useEffect(() => {
    const aptUids = allAppointments.map(a => a.patientId);
    const consUids = consultations.map(c => c.patientId);
    const uids = [...new Set([...aptUids, ...consUids].filter(Boolean))];
    uids.forEach(async (uidRaw) => {
      const uid = uidRaw as string;
      if (!patientNames[uid]) {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists() && snap.data().firstName) {
            setPatientNames(prev => ({...prev, [uid]: `${snap.data().firstName} ${snap.data().lastName}`}));
            if (snap.data().photoURL) {
              setPatientPhotos(prev => ({...prev, [uid]: snap.data().photoURL}));
            }
          }
        } catch(e) {}
      }
    });
  }, [allAppointments, consultations]);

  const [stats, setStats] = useState([
    { label: 'Total Patients', value: '0', icon: Users, color: 'bg-brand-50 text-brand-600' },
    { label: 'Appointments', value: '0', icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Chat Sessions', value: '0', icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'AI Insights', value: '0', icon: Zap, color: 'bg-purple-50 text-purple-600' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch User Name
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(`${data.firstName} ${data.lastName}`);
      }
    };
    fetchUser();

    // SINGLE UNIFIED QUERY STREAM
    const aptQuery = query(collection(db, 'appointments'), where('doctorId', '==', auth.currentUser.uid));
    const unsubscribeApts = onSnapshot(aptQuery, (snapshot) => {
      const allApts = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setAllAppointments(allApts);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const upcoming = allApts.filter(a => a.date >= today).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      setAppointments(upcoming);

      const uniquePatients = new Set(allApts.map(a => a.patientId)).size;
      
      const insightsList = [];
      const todayApts = upcoming.filter(a => a.date === today);
      if (todayApts.length > 4) {
         insightsList.push({ id: '1', title: 'High Volume Day', severity: 'High', patient: 'Multiple', desc: `You have an exceptionally dense schedule today with ${todayApts.length} consultations.` });
      }
      const urgent = upcoming.find(a => a.type?.includes('Emergency') || a.type?.includes('Urgent'));
      if (urgent) {
         insightsList.push({ id: '2', title: 'Urgent Care Required', severity: 'High', patient: urgent.patientName || 'Unknown', desc: 'An emergency appointment has been slotted into your upcoming workflow.' });
      }
      if (upcoming.some(a => a.status === 'Waiting')) {
         insightsList.push({ id: '3', title: 'Patients Waiting', severity: 'Normal', patient: 'Lobby', desc: `You have active patients waiting in the digital lobby experiencing delays.` });
      }
      if (insightsList.length === 0) {
         insightsList.push({ id: '4', title: 'Standard Cadence', severity: 'Normal', patient: 'General', desc: 'Your calendar is well-balanced without critical overlaps.' });
      }
      setAiInsights(insightsList);

      setStats(prev => prev.map(stat => {
        if (stat.label === 'Appointments') return { ...stat, value: upcoming.length.toString() };
        if (stat.label === 'Total Patients') return { ...stat, value: uniquePatients.toString() };
        if (stat.label === 'AI Insights') return { ...stat, value: insightsList.length.toString() };
        return stat;
      }));
    });

    const consQuery = query(collection(db, 'consultations'), where('doctorId', '==', auth.currentUser.uid));
    const unsubscribeCons = onSnapshot(consQuery, (snapshot) => {
      const isPast = (date: string, time: string) => {
        try {
          if (!time) return false;
          const [timeVal, modifier] = time.split(' ');
          let [hours, minutes] = timeVal.split(':').map(Number);
          if (hours === 12 && modifier === 'AM') hours = 0;
          else if (hours < 12 && modifier === 'PM') hours += 12;
          const slotDateTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
          return slotDateTime < new Date();
        } catch { return false; }
      };

      const activeCons = snapshot.docs.filter(d => {
         if (d.id.endsWith('_chat')) return false;
         const data = d.data();
         if (data.status === 'Scheduled' && isPast(data.date, data.time)) return false; // Hide technically missed items
         return data.status === 'Completed' || data.status === 'Scheduled' || data.status === 'Active' || data.status === 'In Progress';
      });

      const consArr = activeCons.map(d => ({ id: d.id, ...(d.data() as any) }));
      consArr.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      setConsultations(consArr);

      setStats(prev => prev.map(stat => {
        if (stat.label === 'Consultations') return { ...stat, value: activeCons.length.toString() };
        return stat;
      }));
    });

    return () => { unsubscribeApts(); unsubscribeCons(); };
  }, []);

  useEffect(() => {
    const daysLength = timeRange === 'week' ? 7 : 30;
    const dateArray = Array.from({length: daysLength}).map((_, i) => {
       const d = new Date();
       d.setDate(d.getDate() - (daysLength - 1 - i));
       return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    
    const dayCounts = dateArray.reduce((acc, dateStr) => { acc[dateStr] = 0; return acc; }, {} as Record<string, number>);
    allAppointments.forEach(a => { if (dayCounts[a.date] !== undefined) dayCounts[a.date]++; });
    
    const chartFormatter = dateArray.map(dateStr => {
       const d = new Date(dateStr);
       const name = timeRange === 'week' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.getDate().toString();
       return { name, appointments: dayCounts[dateStr], consultations: Math.floor(dayCounts[dateStr] * 0.8) };
    });
    setChartData(chartFormatter);
  }, [timeRange, allAppointments]);

  const dismissAlert = (id: string) => {
    setAiInsights(prev => {
      const updated = prev.filter(insight => insight.id !== id);
      setStats(s => s.map(stat => stat.label === 'AI Insights' ? { ...stat, value: updated.length.toString() } : stat));
      return updated;
    });
  };

  const handleDownloadReport = () => {
    const userName = auth.currentUser?.displayName || 'Doctor';
    const text = `DocPilot - Daily Practice Report\nDate: ${new Date().toLocaleDateString()}\nDoctor: ${userName}\nTotal Daily Appointments: ${appointments.length}\n\nQueue List:\n` + 
      appointments.map(a => `- ${a.time}: ${a.patientName} (${a.type}) - [${a.status || 'Scheduled'}]`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Practice_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Good Morning, Dr. {userName}</h1>
          <p className="text-slate-500 text-lg">You have {appointments.length} upcoming appointments scheduled.</p>
        </motion.div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={handleDownloadReport} className="flex-1 md:flex-none justify-center px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
             Download Report
          </button>
          <Link to="/doctor/appointments" className="flex-1 md:flex-none justify-center px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
             View Appointments
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            to={stat.label === 'Appointments' ? '/doctor/appointments' : stat.label === 'Chat Sessions' ? '/doctor/consultations' : '#'}
            onClick={(e) => {
               if (stat.label === 'AI Insights') {
                  e.preventDefault();
                  document.getElementById('critical-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
               }
            }}
            className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all group block"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Queues Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Queue */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
          >
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-slate-900">Appointment Queue</h2>
            <Link to="/doctor/appointments" className="text-brand-600 font-bold text-sm hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {appointments.length > 0 ? appointments.map((apt) => (
              <div key={apt.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {patientPhotos[apt.patientId] ? (
                     <img src={patientPhotos[apt.patientId]} alt="Patient" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                     <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 
                    onClick={() => apt.patientId && setActivePatientProfileId(apt.patientId)}
                    className="font-bold text-slate-900 truncate cursor-pointer hover:text-brand-600 hover:underline transition-all"
                  >
                    {patientNames[apt.patientId] || apt.patientName}
                  </h4>
                  <p className="text-sm text-slate-500">{apt.type}</p>
                </div>
                <div className="flex flex-col justify-center text-slate-500 font-medium text-sm shrink-0 w-32">
                  <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider mb-0.5">
                    {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{apt.time}</div>
                </div>
                <div className="w-28 shrink-0">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block w-full text-center",
                    apt.status === 'In Progress' ? "bg-brand-50 text-brand-600" :
                    apt.status === 'Waiting' ? "bg-amber-50 text-amber-600" :
                    "bg-slate-50 text-slate-500"
                  )}>
                    {apt.status || 'Scheduled'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No upcoming appointments.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Consultations Queue */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6, delay: 0.5 }}
           className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-slate-900">Consultation Queue</h2>
            <Link to="/doctor/consultations" className="text-brand-600 font-bold text-sm hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {consultations.length > 0 ? consultations.map((cons) => (
              <div key={cons.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {patientPhotos[cons.patientId] ? (
                     <img src={patientPhotos[cons.patientId]} alt="Patient" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                     <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 
                    onClick={() => cons.patientId && setActivePatientProfileId(cons.patientId)}
                    className="font-bold text-slate-900 truncate cursor-pointer hover:text-brand-600 hover:underline transition-all"
                  >
                    {patientNames[cons.patientId] || cons.patientName}
                  </h4>
                  <p className="text-sm text-slate-500">Virtual Chat Session</p>
                </div>
                <div className="flex flex-col justify-center text-slate-500 font-medium text-sm shrink-0 w-32">
                  <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider mb-0.5">
                    {new Date(cons.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{cons.time}</div>
                </div>
                <div className="w-28 shrink-0">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block w-full text-center",
                    cons.status === 'In Progress' ? "bg-emerald-50 text-emerald-600" :
                    cons.status === 'Waiting' ? "bg-amber-50 text-amber-600" :
                    "bg-brand-50 text-brand-600"
                  )}>
                    {cons.status || 'Scheduled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cons.status !== 'Completed' && (
                    <Link 
                      to={`/doctor/consultations`}
                      className="px-5 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3"/> Chat
                    </Link>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p>No upcoming consultations.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

        {/* AI Insights Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-brand-600 rounded-4xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">AI Clinical Assistant</h3>
              <p className="text-brand-100 mb-6 leading-relaxed">I've analyzed patient records today. Here are the critical findings.</p>
              <button 
                onClick={() => document.getElementById('critical-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full py-3 bg-white text-brand-600 rounded-2xl font-bold text-sm hover:bg-brand-50 transition-all">
                Review All Insights
              </button>
            </div>
          </div>

          <div id="critical-alerts" className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Critical Alerts
            </h3>
            <div className="space-y-6">
              {aiInsights.length > 0 ? aiInsights.map((insight) => (
                <div key={insight.id} className="group relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors pr-8">{insight.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0",
                      insight.severity === 'High' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Patient Target: <span className="font-bold text-slate-700">{insight.patient}</span></p>
                  <p className="text-sm text-slate-600 leading-relaxed pr-6">{insight.desc}</p>
                  <button onClick={() => dismissAlert(insight.id)} className="absolute top-1 right-0 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" title="Dismiss Event">
                     ✕
                  </button>
                  <div className="mt-4 h-px bg-slate-50 group-last:hidden" />
                </div>
              )) : (
                 <p className="text-sm font-medium text-slate-400 text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">All active insights resolved.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Health Trends Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-4xl border border-slate-100 shadow-sm p-10"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Practice Performance</h2>
            <p className="text-slate-500">Patient volume and consultation trends over the last 30 days.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setTimeRange('week')}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", timeRange === 'week' ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
            >Week</button>
            <button 
              onClick={() => setTimeRange('month')}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", timeRange === 'month' ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
            >Month</button>
          </div>
        </div>
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={8}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="appointments" name="Appointments" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="consultations" name="Consultations" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {activePatientProfileId && (
        <PatientProfileModal patientId={activePatientProfileId} onClose={() => setActivePatientProfileId(null)} />
      )}
    </div>
  );
};

export default DoctorDashboard;
