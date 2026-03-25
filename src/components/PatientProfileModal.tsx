import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Activity, FileText, Calendar as CalendarIcon, Clock, Loader2, Heart, Droplets, Thermometer, AlertCircle, ArrowRight } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface PatientProfileModalProps {
  patientId: string;
  onClose: () => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ patientId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', patientId));
        if (userSnap.exists()) {
          setPatientData(userSnap.data());
        }

        // Fetch past appointments/consultations securely preventing global permission exceptions
        const aptsQuery = query(
          collection(db, 'appointments'), 
          where('patientId', '==', patientId),
          where('doctorId', '==', auth.currentUser?.uid)
        );
        const consQuery = query(
          collection(db, 'consultations'), 
          where('patientId', '==', patientId),
          where('doctorId', '==', auth.currentUser?.uid)
        );
        
        try {
          const [aptsSnap, consSnap] = await Promise.all([getDocs(aptsQuery), getDocs(consQuery)]);
          const allHistory = [
            ...aptsSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'Clinic Visit' })),
            ...consSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'Video Call' })).filter(c => !c.id.endsWith('_chat'))
          ] as any[];
          
          allHistory.sort((a,b) => b.date.localeCompare(a.date));
          setHistory(allHistory);
        } catch (historyErr) {
          console.error("History query permission crash cleanly caught:", historyErr);
        }

        // Fetch user records explicitly cleanly wrapping Appwrite cloud components
        try {
          const recordsQuery = query(collection(db, 'records'), where('patientId', '==', patientId));
          const recordsSnap = await getDocs(recordsQuery);
          const fsDocs = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          let finalRecords = [...fsDocs];
          
          try {
            const { appwriteStorage, APPWRITE_BUCKET_ID } = await import('../lib/appwrite');
            const bucketResult = await appwriteStorage.listFiles(APPWRITE_BUCKET_ID);
            const externalAppwriteFiles = bucketResult.files
              .filter(f => !fsDocs.some((fs: any) => fs.appwriteFileId === f.$id))
              .map(f => ({
                id: f.$id,
                title: f.name,
                name: f.name,
                type: 'Cloud Bucket',
                date: new Date(f.$createdAt).toLocaleDateString(),
                appwriteFileId: f.$id,
                appwriteViewUrl: appwriteStorage.getFileView(APPWRITE_BUCKET_ID, f.$id),
              }));
              
            finalRecords = [...fsDocs, ...externalAppwriteFiles];
          } catch (appwriteErr) {
            console.error("Appwrite remote bucket fetch disabled:", appwriteErr);
          }
          
          setRecords(finalRecords);
        } catch (recordsErr) {
          console.error("Records query crashed:", recordsErr);
        }

      } catch (error) {
        console.error("Error fetching patient details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchPatientData();
  }, [patientId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Patient Profile Data</h2>
                <p className="text-sm text-slate-500">Comprehensive Medical Overview</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {loading ? (
              <div className="flex flex-col flex-1 items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Retrieving electronic health records...</p>
              </div>
            ) : !patientData ? (
               <div className="py-20 text-center text-slate-500">
                 <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                 <p>Patient core records not found.</p>
               </div>
            ) : (
              <div className="space-y-8">
                {/* Demographics & Vitals Header */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/20">
                    <h3 className="text-2xl font-bold mb-1">{patientData.firstName} {patientData.lastName}</h3>
                    <p className="text-brand-100 mb-6 font-medium text-sm">{patientData.email || 'No email registered'}</p>
                    
                    <div className="space-y-4">
                      {patientData.phone && (
                        <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 text-sm">
                          <span className="text-brand-100">Contact</span>
                          <span className="font-bold">{patientData.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                        <span className="text-brand-100 text-sm">Blood Type</span>
                        <span className="font-bold">{patientData.bloodType || '--'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                        <span className="text-brand-100 text-sm">DOB</span>
                        <span className="font-bold">{patientData.dob || '--'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                        <span className="text-brand-100 text-sm">Gender</span>
                        <span className="font-bold capitalize">{patientData.gender || '--'}</span>
                      </div>
                      {(patientData.height || patientData.weight) && (
                        <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 text-sm">
                          <span className="text-brand-100">H: <span className="font-bold text-white tracking-wide">{patientData.height || '--'}</span></span>
                          <span className="text-brand-100">W: <span className="font-bold text-white tracking-wide">{patientData.weight || '--'}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                       <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                         <Heart className="w-5 h-5" />
                       </div>
                       <p className="text-sm font-bold text-slate-500 mb-1">Latest Heart Rate</p>
                       <p className="text-2xl font-bold text-slate-900">{patientData.latestVitals?.heartRate || '--'} <span className="text-sm text-slate-400 font-normal">bpm</span></p>
                     </div>
                     <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                       <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                         <Droplets className="w-5 h-5" />
                       </div>
                       <p className="text-sm font-bold text-slate-500 mb-1">Blood Pressure</p>
                       <p className="text-2xl font-bold text-slate-900">{patientData.latestVitals?.bloodPressure || '--'} <span className="text-sm text-slate-400 font-normal">mmHg</span></p>
                     </div>
                     <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                       <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                         <Thermometer className="w-5 h-5" />
                       </div>
                       <p className="text-sm font-bold text-slate-500 mb-1">Body Temp</p>
                       <p className="text-2xl font-bold text-slate-900">{patientData.latestVitals?.temperature || '--'} <span className="text-sm text-slate-400 font-normal">°C</span></p>
                     </div>
                     <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                       <div className="w-10 h-10 bg-purple-100 text-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                         <Activity className="w-5 h-5" />
                       </div>
                       <p className="text-sm font-bold text-slate-500 mb-1">Blood Glucose</p>
                       <p className="text-2xl font-bold text-slate-900">{patientData.latestVitals?.bloodGlucose || '--'} <span className="text-sm text-slate-400 font-normal">mg/dL</span></p>
                     </div>
                  </div>
                </div>

                {/* Additional Patient Details Card (Allergies & Medications) */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-rose-700 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Allergies & Medical Alerts
                    </h4>
                    <p className="font-bold leading-relaxed whitespace-pre-wrap">
                      {patientData.allergies || 'No known allergies or alerts reported.'}
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 text-indigo-700 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Current Medications
                    </h4>
                    <p className="font-bold leading-relaxed whitespace-pre-wrap">
                      {patientData.medications || 'No active medications currently on file.'}
                    </p>
                  </div>
                </div>

                {/* Uploaded Records Section */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-600" />
                    Patient Uploaded Records
                  </h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {records.length > 0 ? records.map((doc, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:border-brand-200 transition-all">
                          <FileText className="w-6 h-6 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 truncate">{doc.title || doc.name}</h4>
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                              {doc.type || 'Document'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 mb-2">
                            Uploaded: <span className="text-slate-700 font-bold">{doc.date || 'Unknown'}</span>
                          </p>
                          {(doc.fileUrl || doc.url) && (
                            <a href={doc.fileUrl || doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 text-xs font-bold rounded-lg hover:bg-brand-100 transition-colors">
                              View Document <ArrowRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-6 text-slate-400">No external records uploaded by patient.</p>
                    )}
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-600" />
                    Clinical Encounter History
                  </h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {history.length > 0 ? history.map((event, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:border-brand-200 group-hover:shadow-brand-500/20 transition-all">
                          <span className="text-[10px] font-black text-brand-600 uppercase">
                            {new Date(event.date || new Date()).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-lg font-black text-slate-900 leading-none">
                            {new Date(event.date || new Date()).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900">{event.type || event.specialty || 'General Encounter'}</h4>
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                              {event.source}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 mb-2">
                            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" /> {event.time || '--:--'} • Status: <span className="text-slate-700 font-bold">{event.status || 'Past'}</span>
                          </p>
                          {event.doctorNotes && (
                            <div className="p-4 bg-white rounded-xl text-sm text-slate-600 border border-slate-100 shadow-sm mt-3">
                              <span className="font-bold text-slate-900 text-[10px] block mb-1 uppercase tracking-wider">Clinical Notes</span>
                              "{event.doctorNotes}"
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-6 text-slate-400">No previous clinical encounters on record.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
