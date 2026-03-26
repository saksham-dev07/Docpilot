import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Calendar, 
  FileText, 
  Heart, 
  Thermometer, 
  Droplets, 
  ArrowRight,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Video,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChatWidget } from '../components/ChatWidget';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const PatientDashboard: React.FC = () => {
  const [userName, setUserName] = useState('Patient');
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<any[]>([]);
  const [medicalDocuments, setMedicalDocuments] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);
  const [activeChat, setActiveChat] = useState<{ doctorId: string, patientId: string, sessionContext: string } | null>(null);
  const [healthStats, setHealthStats] = useState([
    { label: 'Heart Rate', value: '--', unit: 'bpm', status: 'Pending', icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { label: 'Temperature', value: '--', unit: '°C', status: 'Pending', icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
    { label: 'Blood Glucose', value: '--', unit: 'mg/dL', status: 'Pending', icon: Droplets, color: 'text-blue-500 bg-blue-50' },
    { label: 'Blood Pressure', value: '--', unit: 'mmHg', status: 'Pending', icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
  ]);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'normal': return 'bg-emerald-50 text-emerald-600';
      case 'elevated': return 'bg-yellow-50 text-yellow-600';
      case 'low': 
      case 'high': return 'bg-orange-50 text-orange-600';
      case 'fever':
      case 'critical': return 'bg-rose-50 text-rose-600';
      case 'pending': return 'bg-slate-50 text-slate-400';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const generateHealthAnalysis = (history: any[]) => {
    if (!history || history.length === 0) return "Start logging your vitals to receive personalized health insights and trend analysis.";
    if (history.length === 1) return "First vitals recorded. Log more readings over time to establish a baseline and track health trends.";
    
    const sorted = [...history].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    const previous = sorted[1];
    
    let insights = [];
    
    if (latest.heartRate && previous.heartRate) {
      const diff = latest.heartRate - previous.heartRate;
      if (Math.abs(diff) > 10) insights.push(`Your heart rate has ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} bpm since your last reading.`);
    }
    
    if (latest.bloodPressureStatus === 'High' || latest.bloodPressureStatus === 'Critical') {
      insights.push("Blood pressure remains above optimum levels. Consult your physician.");
    } else if (latest.bloodPressureStatus === 'Low') {
      insights.push("Blood pressure is currently reading as low (hypotension). Please monitor carefully.");
    } else if (latest.bloodPressureStatus === 'Normal' && (previous.bloodPressureStatus === 'High' || previous.bloodPressureStatus === 'Elevated' || previous.bloodPressureStatus === 'Critical')) {
      insights.push("Great job! Your blood pressure has returned to a normal range.");
    }

    if (latest.temperatureStatus === 'Critical') insights.push("Critical body temperature detected. Seek immediate medical attention.");
    else if (latest.temperatureStatus === 'Fever') insights.push("Activity flagged a fever-range body temperature. Please rest and hydrate.");
    else if (latest.temperatureStatus === 'Low') insights.push("Body temperature is reading below average. Please stay warm and monitor.");

    if (insights.length === 0) return "Your recent records show completely stable vital signs with no alarming deviations from your baseline averages.";
    return insights.join(' ');
  };

  const getOverviewColor = (history: any[]) => {
    if (!history || history.length === 0) return 'bg-emerald-600';
    const sorted = [...history].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    const statuses = [latest.heartRateStatus, latest.temperatureStatus, latest.bloodGlucoseStatus, latest.bloodPressureStatus];
    
    if (statuses.includes('Critical')) return 'bg-rose-600';
    if (statuses.includes('Fever') || statuses.includes('High') || statuses.includes('Low')) return 'bg-orange-500';
    if (statuses.includes('Elevated')) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch User Data Snapshot
    const fetchUser = () => {
      return onSnapshot(doc(db, 'users', auth.currentUser!.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(`${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'Patient');
          setUserData(data);
          
          if (data.latestVitals) {
            setHealthStats(prev => prev.map(stat => {
              if (stat.label === 'Heart Rate') return { ...stat, value: data.latestVitals.heartRate?.toString() || '--', status: data.latestVitals.heartRateStatus || 'Pending' };
              if (stat.label === 'Temperature') return { ...stat, value: data.latestVitals.temperature?.toString() || '--', status: data.latestVitals.temperatureStatus || 'Pending' };
              if (stat.label === 'Blood Glucose') return { ...stat, value: data.latestVitals.bloodGlucose?.toString() || '--', status: data.latestVitals.bloodGlucoseStatus || 'Pending' };
              if (stat.label === 'Blood Pressure') return { ...stat, value: data.latestVitals.bloodPressure || '--', status: data.latestVitals.bloodPressureStatus || 'Pending' };
              return stat;
            }));
          }
        }
      });
    };
    const unsubscribeUser = fetchUser();

    // Fetch Appointments (Today and Future)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const aptQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', auth.currentUser.uid),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(3)
    );

    const unsubscribeApts = onSnapshot(aptQuery, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setUpcomingAppointments(apts);
    });

    const consQuery = query(
      collection(db, 'consultations'),
      where('patientId', '==', auth.currentUser.uid),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(3)
    );

    const unsubscribeCons = onSnapshot(consQuery, (snapshot) => {
      const consData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(c => !c.id.endsWith('_chat'));
      setUpcomingConsultations(consData);
    });

    // Fetch Records
    const recordQuery = query(
      collection(db, 'records'),
      where('patientId', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribeRecords = onSnapshot(recordQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedicalDocuments(docs);
    });

    return () => {
      unsubscribeApts();
      unsubscribeCons();
      unsubscribeRecords();
      unsubscribeUser();
    };
  }, []);

  const isPast = (date: string, time: string) => {
    if (!date) return false;
    const pastDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pastDate < today;
  };

  const validAppointments = upcomingAppointments.filter(apt => !isPast(apt.date, apt.time));
  const validConsultations = upcomingConsultations.filter(cons => !isPast(cons.date, cons.time));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Hello, {userName}</h1>
          <p className="text-slate-500 text-lg">Here's your health overview for today.</p>
        </motion.div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <button onClick={() => setShowVitalsModal(true)} className="flex-1 md:flex-none justify-center px-6 py-4 bg-slate-100 text-slate-700 rounded-3xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Log Vitals
          </button>
          <Link to="/book" className="flex-1 md:flex-none justify-center px-8 py-4 bg-brand-600 text-white rounded-3xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2 group">
            Book New Appointment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Health Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthStats.map((stat, i) => (
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
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", getStatusColor(stat.status))}>
                {stat.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
              <span className="text-slate-400 text-sm font-bold">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-slate-900">Upcoming Appointments</h2>
              <Link to="/book" className="text-brand-600 font-bold text-sm hover:underline">View Calendar</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {validAppointments.length > 0 ? validAppointments.map((apt) => (
                <div key={apt.id} className="p-8 flex items-center gap-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="w-16 h-16 rounded-3xl bg-brand-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-brand-600 uppercase">
                      {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { month: 'short' }) : 'MAR'}
                    </span>
                    <span className="text-xl font-display font-black text-brand-700 leading-none">
                      {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { day: 'numeric' }) : '25'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{apt.doctorName}</h4>
                    <p className="text-sm text-slate-500">{apt.type || 'In-person Visit'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-2 text-slate-900 font-bold mb-1">
                      <Clock className="w-4 h-4 text-brand-600" />
                      {apt.time}
                    </div>
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold block mb-3 text-center">
                      {apt.status}
                    </span>
                    <button onClick={() => setActiveChat({ doctorId: apt.doctorId, patientId: auth.currentUser?.uid || '', sessionContext: `${apt.date} • ${apt.time}` })} className="w-full relative py-2 bg-brand-50 text-brand-600 rounded-xl font-bold text-xs hover:bg-brand-100 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5" /> Message Doctor
                      {apt.messages?.length > 0 && apt.messages[apt.messages.length - 1].senderId !== auth.currentUser?.uid && !apt.messages[apt.messages.length - 1].read && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
                      )}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-24 text-center bg-white border border-dashed border-slate-200 rounded-3xl m-8">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Upcoming Visits</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">You don't have any in-person appointments scheduled. Book one to see your doctor.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Consultations */}
          <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-slate-900">Upcoming Chat Consultations</h2>
              <Link to="/book" className="text-brand-600 font-bold text-sm hover:underline">View Calendar</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {validConsultations.length > 0 ? validConsultations.map((cons) => (
                <div key={cons.id} className="p-8 flex items-center gap-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="w-16 h-16 rounded-3xl bg-brand-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-brand-600 uppercase">
                      {cons.date ? new Date(cons.date).toLocaleDateString('en-US', { month: 'short' }) : 'MAR'}
                    </span>
                    <span className="text-xl font-display font-black text-brand-700 leading-none">
                      {cons.date ? new Date(cons.date).toLocaleDateString('en-US', { day: 'numeric' }) : '25'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{cons.doctorName}</h4>
                    <p className="text-sm text-slate-500">Virtual Chat Session</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="flex items-center justify-end gap-2 text-slate-900 font-bold mb-1">
                      <Clock className="w-4 h-4 text-brand-600" />
                      {cons.time}
                    </div>
                    <span className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-bold mb-3 block w-full text-center">
                      {cons.status || 'Scheduled'}
                    </span>
                       <button onClick={() => setActiveChat({ doctorId: cons.doctorId, patientId: auth.currentUser?.uid || '', sessionContext: `${cons.date} • ${cons.time}` })} className="w-full relative py-2.5 bg-brand-50 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-100 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <MessageSquare className="w-4 h-4" /> Start Chat Session
                        {cons.messages?.length > 0 && cons.messages[cons.messages.length - 1].senderId !== auth.currentUser?.uid && !cons.messages[cons.messages.length - 1].read && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </button>
                  </div>
                </div>
              )) : (
                <div className="p-24 text-center bg-white border border-dashed border-slate-200 rounded-3xl m-8">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Virtual Sessions</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">Connect directly with healthcare professionals through secure online chats.</p>
                </div>
              )}
            </div>
          </div>

          {/* Health Insights */}
          <div className={cn("rounded-4xl p-10 text-white relative overflow-hidden transition-colors duration-500", getOverviewColor(userData?.vitalsHistory))}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
              {getOverviewColor(userData?.vitalsHistory) === 'bg-emerald-600' ? <CheckCircle2 className="w-32 h-32" /> : <AlertCircle className="w-32 h-32" />}
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold mb-4">Health Overview</h3>
              <p className="text-white/80 text-lg mb-8 max-w-xl leading-relaxed">
                {generateHealthAnalysis(userData?.vitalsHistory)}
              </p>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl border border-white/10 flex-1">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Blood Type</p>
                  <p className="text-2xl font-bold">{userData?.bloodType || 'Unknown'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl border border-white/10 flex-1">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Alerts / Allergies</p>
                  <p className="text-xl font-bold truncate">{userData?.allergies || 'None listed'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Documents Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-slate-900">Recent Records</h3>
            <Link to="/patient/archive" className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-600 transition-all">
              <FileText className="w-5 h-5" />
            </Link>
          </div>
          <div className="space-y-6">
            {medicalDocuments.length > 0 ? medicalDocuments.map((doc) => (
              <div key={doc.id} className="group cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{doc.title || doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.date} • {doc.type}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-50 group-last:hidden" />
              </div>
            )) : (
              <div className="py-14 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">Archive Empty</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">No medical reports or prescriptions have been filed yet.</p>
              </div>
            )}
          </div>
          <Link to="/patient/archive" className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all text-center block">
            View All Documents
          </Link>

          {userData?.medications ? (
            <div className="mt-10 p-6 bg-brand-50 rounded-3xl border border-brand-100">
              <div className="flex items-center gap-3 mb-3 text-brand-600">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Active Medications</h4>
              </div>
              <p className="text-sm text-brand-700 leading-relaxed font-medium whitespace-pre-wrap">
                {userData.medications}
              </p>
            </div>
          ) : (
            <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
               <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
               <p className="text-xs text-slate-400">No active medications listed in profile.</p>
            </div>
          )}
        </motion.div>
      </div>

      {showVitalsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-display font-bold text-slate-900">Log Current Vitals</h2>
              <button onClick={() => setShowVitalsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!auth.currentUser) return;
              setIsSubmittingVitals(true);
              try {
                const data = new FormData(e.currentTarget);
                const hr = data.get('hr');
                const temp = data.get('temp');
                const bg = data.get('bg');
                const sys = data.get('sys');
                const dia = data.get('dia');

                const payload = {
                  timestamp: new Date().toISOString(),
                  heartRate: hr ? Number(hr) : null,
                  heartRateStatus: hr ? (Number(hr) > 130 ? 'Critical' : Number(hr) > 100 ? 'High' : Number(hr) < 60 ? 'Low' : 'Normal') : 'Pending',
                  temperature: temp ? Number(temp) : null,
                  temperatureStatus: temp ? (Number(temp) > 40 ? 'Critical' : Number(temp) > 38 ? 'Fever' : Number(temp) > 37.2 ? 'Elevated' : Number(temp) < 35 ? 'Low' : 'Normal') : 'Pending',
                  bloodGlucose: bg ? Number(bg) : null,
                  bloodGlucoseStatus: bg ? (Number(bg) > 125 ? 'High' : Number(bg) > 99 ? 'Elevated' : Number(bg) < 70 ? 'Low' : 'Normal') : 'Pending',
                  bloodPressure: sys && dia ? `${sys}/${dia}` : null,
                  bloodPressureStatus: sys && dia ? (Number(sys) > 180 || Number(dia) > 120 ? 'Critical' : Number(sys) < 90 || Number(dia) < 60 ? 'Low' : Number(sys) >= 130 || Number(dia) >= 80 ? 'High' : Number(sys) >= 120 ? 'Elevated' : 'Normal') : 'Pending',
                };
                
                await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
                  latestVitals: payload,
                  vitalsHistory: arrayUnion(payload)
                });
                setShowVitalsModal(false);
              } catch (err) {
                console.error("Failed to save vitals", err);
                alert("Failed to save vitals.");
              }
              setIsSubmittingVitals(false);
            }} className="p-8 space-y-6 overflow-y-auto flex-1 w-full">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Heart Rate (bpm)</label>
                  <input type="number" name="hr" placeholder="e.g. 72" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Temperature (°C)</label>
                  <input type="number" step="0.1" name="temp" placeholder="e.g. 36.5" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Blood Glucose (mg/dL)</label>
                  <input type="number" name="bg" placeholder="e.g. 95" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Blood Pressure</label>
                  <div className="flex items-center gap-2">
                    <input type="number" name="sys" placeholder="Sys" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none" />
                    <span className="text-slate-400 font-bold">/</span>
                    <input type="number" name="dia" placeholder="Dia" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none" />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowVitalsModal(false)} disabled={isSubmittingVitals} className="flex-1 py-4 font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmittingVitals} className="flex-1 py-4 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingVitals ? <><Loader2 className="w-5 h-5 animate-spin"/> Saving...</> : "Record Vitals"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {activeChat && (
        <ChatWidget 
          doctorId={activeChat.doctorId}
          patientId={activeChat.patientId}
          sessionContext={activeChat.sessionContext}
          currentUserId={auth.currentUser?.uid || ''} 
          currentUserName={userName} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};
