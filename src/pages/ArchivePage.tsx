import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  History, 
  MoreVertical, 
  Download, 
  Eye,
  ChevronRight,
  Database,
  ArrowLeft,
  FolderOpen,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const ArchivePage: React.FC = () => {
  const [patientFolders, setPatientFolders] = useState<{id: string, name: string, lastVisit: string}[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [patientNamesCache, setPatientNamesCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auth.currentUser) return;

    // Phase 1: Fetch unique patients from appointments to act as Folders
    const aptsQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(aptsQuery, async (snapshot) => {
      const pMap = new Map<string, {name: string, date: string}>();
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.patientId) {
          // Keep the latest date if available
          if (!pMap.has(data.patientId) || (data.date && pMap.get(data.patientId)?.date < data.date)) {
            pMap.set(data.patientId, { name: data.patientName || 'Unknown', date: data.date || 'Unknown' });
          }
        }
      });

      const pList: {id: string, name: string, lastVisit: string}[] = [];
      const nameCache: Record<string, string> = {};
      
      for (const [uid, meta] of Array.from(pMap.entries())) {
        try {
          const uSnap = await getDoc(doc(db, 'users', uid));
          if (uSnap.exists() && uSnap.data().firstName) {
            const realName = `${uSnap.data().firstName} ${uSnap.data().lastName}`;
            pList.push({ id: uid, name: realName, lastVisit: meta.date });
            nameCache[uid] = realName;
          } else {
            pList.push({ id: uid, name: meta.name, lastVisit: meta.date });
            nameCache[uid] = meta.name;
          }
        } catch (e) {
          pList.push({ id: uid, name: meta.name, lastVisit: meta.date });
        }
      }
      
      setPatientFolders(pList);
      setPatientNamesCache(nameCache);
      setLoadingFolders(false);
    });

    return () => unsubscribe();
  }, []);

  // Phase 2: Fetch specific records when a folder is clicked
  useEffect(() => {
    if (!activePatientId) return;
    setLoadingRecords(true);

    const recordsQuery = query(
      collection(db, 'records'),
      where('patientId', '==', activePatientId)
    );

    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Descending sort manually since requiring composite index would break dynamically
      docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setPatientRecords(docs);
      setLoadingRecords(false);
    });

    return () => unsubscribeRecords();
  }, [activePatientId]);

  const activePatientName = activePatientId ? patientNamesCache[activePatientId] || 'Patient' : '';

  const handleExportArchive = () => {
    let content = '';
    if (!activePatientId) {
      content = "DOCPILOT GLOBAL PATIENT ARCHIVE\n==========================================\n\n";
      patientFolders.forEach(folder => {
        content += `Patient Name: ${folder.name}\nPatient ID: ${folder.id}\nLast Encounter: ${folder.lastVisit}\n------------------------------------------\n`;
      });
    } else {
      content = `DOCPILOT PATIENT RECORD EXPORT\n==========================================\nPatient Name: ${activePatientName}\nPatient ID: ${activePatientId}\nGenerated: ${new Date().toLocaleDateString()}\n------------------------------------------\n\n`;
      patientRecords.forEach(record => {
        content += `Document: ${record.name || record.title || 'Untitled Document'}\nCategory: ${record.category || 'General'}\nType: ${record.type}\nDate: ${record.date}\nSource: ${record.doctorId === auth.currentUser?.uid ? 'Doctor Prescribed' : 'Patient Uploaded'}\n------------------------------------------\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocPilot_Archive_${activePatientName ? activePatientName.replace(/\s+/g, '_') : 'Global'}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const handleBulkArchive = () => {
    alert("Enterprise Action: Bulk Archiving explicitly shifts physical records into HIPAA-compliant cold storage buckets. Production authorization required to execute.");
  };

  const filteredFolders = patientFolders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecords = patientRecords.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activePatientId ? (
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => setActivePatientId(null)}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 hover:text-brand-600 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-4xl font-display font-extrabold text-slate-900">{activePatientName}'s Archive</h1>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Patient Records Archive</h1>
              <p className="text-slate-500 text-lg">Secure, searchable repository for all historical clinical data.</p>
            </>
          )}
        </motion.div>
        <div className="flex gap-3">
          <button onClick={handleExportArchive} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Database className="w-4 h-4" />
            Export Archive
          </button>
          <button onClick={handleBulkArchive} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Bulk Archive
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input 
            type="text" 
            placeholder={activePatientId ? "Search specific files, presciptions..." : "Search by patient name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
          />
        </div>
        {!activePatientId && (
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent
            </button>
            <button className="flex-1 md:flex-none px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
              <Filter className="w-4 h-4" />
              A - Z
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activePatientId ? (
          /* Folder Grid View */
          <motion.div 
            key="folders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loadingFolders ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">Scanning Medical Database...</div>
            ) : filteredFolders.length > 0 ? filteredFolders.map((folder, i) => (
              <motion.button
                key={folder.id}
                onClick={() => { setActivePatientId(folder.id); setSearchQuery(''); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all group overflow-hidden text-left relative outline-none focus:ring-4 focus:ring-brand-500/20 block w-full"
              >
                <div className="p-8 pb-6 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-all text-slate-400 shrink-0">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-black text-slate-900 group-hover:text-brand-600 transition-colors">{folder.name}</h3>
                    <p className="text-sm font-bold text-slate-500">Patient ID: {folder.id.slice(0, 6)}</p>
                  </div>
                </div>
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-brand-50 transition-colors">
                  <span className="text-xs font-bold text-slate-500">Last Encounter: {folder.lastVisit}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No patients found matching your search.</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* File Grid View */
          <motion.div 
            key="files"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loadingRecords ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">Unlocking Secure Archive...</div>
            ) : filteredRecords.length > 0 ? filteredRecords.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                      item.doctorId === auth.currentUser?.uid ? "bg-brand-50 text-brand-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {item.type?.includes('Prescription') ? <FileText className="w-5 h-5" /> : <History className="w-5 h-5" />}
                    </div>
                    {item.doctorId === auth.currentUser?.uid ? (
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Doctor Prescribed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Patient Uploaded
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{item.name || item.title || 'Untitled Document'}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">
                    {item.type}
                  </p>

                  <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl mb-6 items-center">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">{item.date}</span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewRecord(item)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button 
                      onClick={() => window.open(item.appwriteDownloadUrl || item.appwriteViewUrl, '_blank')}
                      className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:text-brand-600 hover:bg-brand-50 transition-all shrink-0">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No records have been filed for this patient.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewer Modal */}
      <AnimatePresence>
        {viewRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewRecord(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-brand-600">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight text-left">
                    {viewRecord.type === 'Online Prescription' ? 'Medical Prescription' : viewRecord.name || viewRecord.title || 'Document Viewer'}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 text-left">
                    {viewRecord.doctorId === auth.currentUser?.uid ? `Dr. ${viewRecord.doctorName}` : 'Patient Uploaded'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-600 mb-1">{viewRecord.date}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-black">ID: {viewRecord.id?.slice(0,8)}</p>
                </div>
              </div>

              {viewRecord.type === 'Online Prescription' ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-brand-600" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Rx Details</h4>
                    </div>
                    <div className="space-y-4">
                      {viewRecord.prescriptionData?.medicines?.map((med: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-left">
                          <div>
                            <p className="font-bold text-slate-900 text-lg mb-1">{med.name}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                                💊 Dosage: <span className="text-slate-900">{med.dosage}</span>
                              </span>
                              <span className="px-2.5 py-1 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold border border-brand-100">
                                ⏱️ Frequency: <span className="text-brand-900">{med.frequency}</span>
                              </span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                                📅 Duration: <span className="text-emerald-900">{med.duration}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {viewRecord.prescriptionData?.notes && (
                    <div className="mb-8 text-left">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">Instructions</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                        {viewRecord.prescriptionData.notes}
                      </p>
                    </div>
                  )}
                </>
              ) : (viewRecord.fileExtension?.match(/(png|jpg|jpeg|gif|webp)/i) || viewRecord.type?.match(/(png|jpg|jpeg|gif|webp)/i) || viewRecord.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i) || viewRecord.fileName?.match(/\.(png|jpg|jpeg|gif|webp)$/i) || viewRecord.category === 'Imaging') ? (
                <div className="w-full h-[500px] mb-8 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-4">
                  <img src={viewRecord.appwriteViewUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : (viewRecord.appwriteViewUrl) ? (
                <div className="w-full h-[500px] mb-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <iframe 
                    src={viewRecord.appwriteViewUrl}
                    className="w-full h-full border-0"
                    title="Document Viewer"
                  />
                </div>
              ) : (
                <div className="w-full p-8 mb-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                  No preview available for this document type.
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {viewRecord.doctorId === auth.currentUser?.uid ? 'Digitally Verified' : 'Patient Upload'}
                </p>
                <button onClick={() => setViewRecord(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">Close Viewer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArchivePage;
