import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Eye, 
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FilePlus,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, getDoc, doc } from 'firebase/firestore';
import { ID } from 'appwrite';
import { appwriteStorage, APPWRITE_BUCKET_ID } from '../lib/appwrite';
import { AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';

export const DocumentWorkflow: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Reports' | 'Imaging'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [patientsList, setPatientsList] = useState<{id: string, name: string}[]>([]);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<any | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [patientNamesCache, setPatientNamesCache] = useState<Record<string, string>>({});
  const [stats, setStats] = useState([
    { title: 'Pending Review', count: '0', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Verified Reports', count: '0', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Missing Information', count: '0', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'records'),
      where('doctorId', '==', auth.currentUser.uid)
    );

    // Fetch patients from appointments securely pulling exact User names
    const aptsQuery = query(collection(db, 'appointments'), where('doctorId', '==', auth.currentUser.uid));
    getDocs(aptsQuery).then(async snap => {
      const pUids = new Set<string>();
      let dName = 'Doctor';
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.doctorName) dName = data.doctorName;
        if (data.patientId) pUids.add(data.patientId);
      });
      setDoctorName(dName);

      const pList: {id: string, name: string}[] = [];
      const nameCache: Record<string, string> = {};
      
      for (const uid of Array.from(pUids)) {
        try {
          const uSnap = await getDoc(doc(db, 'users', uid));
          if (uSnap.exists() && uSnap.data().firstName) {
            const realName = `${uSnap.data().firstName} ${uSnap.data().lastName}`;
            pList.push({ id: uid, name: realName });
            nameCache[uid] = realName;
          } else {
            pList.push({ id: uid, name: 'Patient' });
          }
        } catch (e) {
          pList.push({ id: uid, name: 'Patient' });
        }
      }
      setPatientsList(pList);
      setPatientNamesCache(nameCache);
    }).catch(console.error);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDocuments(recordsData);
      
      // Update stats
      const pending = recordsData.filter((doc: any) => doc.status === 'Pending Review').length;
      const verified = recordsData.filter((doc: any) => doc.status === 'Verified').length;
      
      setStats([
        { ...stats[0], count: pending.toString() },
        { ...stats[1], count: verified.toString() },
        { ...stats[2], count: '0' } // Mocking missing info for now
      ]);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    if (!selectedPatientId) {
      alert("Please select a patient before uploading.");
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large securely bypassing 20MB limit.");
      return;
    }
    
    setIsUploading(true);
    try {
      const response = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), file);
      const viewUrl = appwriteStorage.getFileView(APPWRITE_BUCKET_ID, response.$id);
      const downloadUrl = appwriteStorage.getFileDownload(APPWRITE_BUCKET_ID, response.$id);
      
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'DOC';
      const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'DICOM'].includes(fileExt);
      const pName = patientsList.find(p => p.id === selectedPatientId)?.name || 'Unknown Patient';

      const recordPayload = {
        name: `Prescription - ${new Date().toLocaleDateString('en-GB')}`,
        type: 'Handwritten Prescription',
        fileExtension: fileExt,
        category: isImg ? 'Imaging' : 'Reports',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        patientName: pName,
        patientId: selectedPatientId,
        doctorId: auth.currentUser.uid,
        doctorName: doctorName || 'Doctor',
        appwriteFileId: response.$id,
        appwriteViewUrl: viewUrl,
        appwriteDownloadUrl: downloadUrl,
        createdAt: new Date().toISOString(),
        status: 'Verified'
      };

      try {
        await addDoc(collection(db, 'records'), recordPayload);
      } catch (e2: any) {
        console.error("Error adding to records:", e2);
        alert("Failed to securely connect to Patient bucket: " + e2.message);
        throw e2;
      }
      setShowUploadModal(false);
    } catch(err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreatePrescription = async () => {
    if (!auth.currentUser) return;
    if (!selectedPatientId || medicines.length === 0 || !medicines[0].name) {
      alert("Please select a patient and add at least one medicine.");
      return;
    }

    // Validate frequency format (x-x-x)
    for (const med of medicines) {
      if (!/^\d-\d-\d$/.test(med.frequency)) {
        alert(`Invalid frequency format for ${med.name || 'medicine'}. Please use the exact format X-X-X (e.g., 1-0-1 or 1-1-1).`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const pName = patientsList.find(p => p.id === selectedPatientId)?.name || 'Unknown Patient';
      
      // Auto Append 'mg' to dosage
      const formattedMedicines = medicines.map(med => {
        let cleanDosage = med.dosage.trim();
        // Remove trailing "mg" or " mg" if user accidentally typed it so we don't duplicate
        cleanDosage = cleanDosage.replace(/\s*mg$/i, '');
        return {
          ...med,
          dosage: cleanDosage ? `${cleanDosage}mg` : ''
        };
      });

      const prescriptionData = {
        medicines: formattedMedicines,
        notes: prescriptionNotes
      };
      
      const recordPayload = {
        name: `Prescription - ${new Date().toLocaleDateString('en-GB')}`,
        type: 'Online Prescription',
        category: 'Reports',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        patientName: pName,
        patientId: selectedPatientId,
        doctorId: auth.currentUser.uid,
        doctorName: doctorName || 'Doctor',
        prescriptionData,
        createdAt: new Date().toISOString(),
        status: 'Verified'
      };

      try {
        await addDoc(collection(db, 'records'), recordPayload);
      } catch (e2: any) {
        console.error("Error adding to records:", e2);
        alert("Failed to securely generate Online Prescription schema: " + e2.message);
        throw e2;
      }
      
      setShowPrescriptionModal(false);
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setPrescriptionNotes('');
    } catch (e: any) {
      console.error(e);
      alert("Failed to emit prescription securely: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab !== 'All' && doc.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return doc.name?.toLowerCase().includes(q) || doc.patientName?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Document Workflow</h1>
          <p className="text-slate-500 text-lg">Manage prescriptions, lab reports, and medical imaging.</p>
        </motion.div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={() => setShowUploadModal(true)} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button onClick={() => setShowPrescriptionModal(true)} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <FilePlus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-display font-bold text-slate-900">{stat.count}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Document List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-display font-bold text-slate-900">Recent Documents</h2>
            <div className="flex bg-white p-1 rounded-xl border border-slate-100">
              <button onClick={() => setActiveTab('All')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'All' ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:bg-slate-50")}>All</button>
              <button onClick={() => setActiveTab('Reports')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'Reports' ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:bg-slate-50")}>Reports</button>
              <button onClick={() => setActiveTab('Imaging')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'Imaging' ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:bg-slate-50")}>Imaging</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..." 
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
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Size</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500">Loading documents...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500">No documents found.</td>
                </tr>
              ) : filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 text-sm">{(doc.patientId && patientNamesCache[doc.patientId]) ? patientNamesCache[doc.patientId] : doc.patientName}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 text-sm">{doc.date}</p>
                    <p className="text-xs text-slate-400">{doc.size || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                      doc.status === 'Verified' ? "bg-emerald-50 text-emerald-600" :
                      doc.status === 'Pending Review' ? "bg-amber-50 text-amber-600" :
                      "bg-rose-50 text-rose-600"
                    )}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setViewingPrescription(doc)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View Document"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => doc.appwriteDownloadUrl && window.open(doc.appwriteDownloadUrl, '_blank')} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Download">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Share">
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* AI Document Assistant */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <FileText className="w-64 h-64" />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-brand-600/20">
              <Activity className="w-7 h-7" />
            </div>
            <h2 className="text-4xl font-display font-extrabold mb-6 leading-tight">Automate your medical documentation</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Our AI can automatically extract clinical data from scanned reports, summarize patient history, and generate standardized clinical notes.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all">
                Try Auto-Summarize
              </button>
              <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all">
                Learn More
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-4xl border border-white/10">
              <h4 className="text-brand-400 font-black text-3xl mb-2">95%</h4>
              <p className="text-slate-400 text-sm font-medium">Extraction Accuracy</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-4xl border border-white/10">
              <h4 className="text-brand-400 font-black text-3xl mb-2">2s</h4>
              <p className="text-slate-400 text-sm font-medium">Processing Time</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-4xl border border-white/10 col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm">HIPAA Compliant Storage</p>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">All documents are encrypted at rest and in transit with enterprise-grade security protocols.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Upload Patient Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Patient</label>
                  <select 
                    value={selectedPatientId} 
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setShowUploadModal(false)} className="px-6 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all">Cancel</button>
                <button 
                  onClick={() => {
                    if (!selectedPatientId) { alert("Select patient first"); return; }
                    fileInputRef.current?.click();
                  }} 
                  disabled={isUploading || !selectedPatientId}
                  className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-brand-500/20 shadow-lg hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isUploading ? <Activity className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Browse & Upload'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPrescriptionModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Create Online Prescription</h3>
                <button onClick={() => setShowPrescriptionModal(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Patient</label>
                  <select 
                    value={selectedPatientId} 
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-slate-700">Prescribed Medicines</label>
                    <button onClick={() => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }])} className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:text-brand-700 px-3 py-1 bg-brand-50 rounded-lg transition-all">
                      <Plus className="w-3 h-3" /> Add Medicine
                    </button>
                  </div>
                  
                  {/* Grid Headers for Context */}
                  {medicines.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 mb-2">
                       <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Medicine Name</span>
                       <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Dosage (e.g. 500mg)</span>
                       <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Frequency (e.g. 1-0-1)</span>
                       <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Duration (e.g. 5 Days)</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="flex gap-2 items-start relative bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                          <input type="text" placeholder="Medicine Name" value={med.name} onChange={(e) => { const m = [...medicines]; m[idx].name = e.target.value; setMedicines(m); }} className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-500 transition-colors" />
                          <input type="text" placeholder="e.g. 500mg" value={med.dosage} onChange={(e) => { const m = [...medicines]; m[idx].dosage = e.target.value; setMedicines(m); }} className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-500 transition-colors" />
                          <input type="text" placeholder="e.g. 1-0-1" value={med.frequency} onChange={(e) => { const m = [...medicines]; m[idx].frequency = e.target.value; setMedicines(m); }} className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-500 transition-colors" />
                          <input type="text" placeholder="e.g. 5 Days" value={med.duration} onChange={(e) => { const m = [...medicines]; m[idx].duration = e.target.value; setMedicines(m); }} className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-500 transition-colors" />
                        </div>
                        <button onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 transition-colors mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Notes & Instructions</label>
                  <textarea 
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    rows={3} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium resize-none shadow-sm" 
                    placeholder="Enter diet restrictions, follow-up advice, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setShowPrescriptionModal(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all">Cancel</button>
                <button onClick={handleCreatePrescription} disabled={isUploading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-emerald-500/20 shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                  {isUploading ? 'Generating...' : 'Issue Prescription'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Prescription Viewer Modal */}
      <AnimatePresence>
        {viewingPrescription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingPrescription(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-brand-600">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight text-left">
                    {viewingPrescription.type === 'Online Prescription' ? 'Medical Prescription' : viewingPrescription.name || 'Document Viewer'}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 text-left">Dr. {viewingPrescription.doctorName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-600 mb-1">{viewingPrescription.date}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-black">ID: {viewingPrescription.id?.slice(0,8)}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 flex items-center justify-between">
                 <div className="text-left">
                   <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Patient Name</p>
                   <p className="font-bold text-slate-900 text-lg">{(viewingPrescription.patientId && patientNamesCache[viewingPrescription.patientId]) ? patientNamesCache[viewingPrescription.patientId] : viewingPrescription.patientName}</p>
                 </div>
              </div>

              {viewingPrescription.type === 'Online Prescription' ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-brand-600" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Rx Details</h4>
                    </div>
                    <div className="space-y-4">
                      {viewingPrescription.prescriptionData?.medicines?.map((med: any, idx: number) => (
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

                  {viewingPrescription.prescriptionData?.notes && (
                    <div className="mb-8 text-left">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">Instructions</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                        {viewingPrescription.prescriptionData.notes}
                      </p>
                    </div>
                  )}
                </>
              ) : (viewingPrescription.fileExtension?.match(/(png|jpg|jpeg|gif|webp)/i) || viewingPrescription.type?.match(/(png|jpg|jpeg|gif|webp)/i) || viewingPrescription.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i) || viewingPrescription.category === 'Imaging') ? (
                <div className="w-full h-[500px] mb-8 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-4">
                  <img src={viewingPrescription.appwriteViewUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : (
                <div className="w-full h-[500px] mb-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <iframe 
                    src={viewingPrescription.appwriteViewUrl}
                    className="w-full h-full border-0"
                    title="Document Viewer"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digitally Verified</p>
                <button onClick={() => setViewingPrescription(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">Close Prescription</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentWorkflow;
