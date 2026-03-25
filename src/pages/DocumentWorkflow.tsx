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
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { ID } from 'appwrite';
import { appwriteStorage, APPWRITE_BUCKET_ID } from '../lib/appwrite';

export const DocumentWorkflow: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Reports' | 'Imaging'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState([
    { title: 'Pending Review', count: '0', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Verified Reports', count: '0', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Missing Information', count: '0', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'medical_records'),
      where('doctorId', '==', auth.currentUser.uid)
    );

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

      await addDoc(collection(db, 'medical_records'), {
        name: file.name,
        type: fileExt,
        category: isImg ? 'Imaging' : 'Reports',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        patientName: 'Unassigned',
        status: 'Pending Review',
        doctorId: auth.currentUser.uid,
        appwriteFileId: response.$id,
        appwriteViewUrl: viewUrl,
        appwriteDownloadUrl: downloadUrl
      });
    } catch(err) {
      console.error(err);
      alert('Upload failed safely connecting endpoints.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50">
            {isUploading ? <Activity className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
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
                    <p className="font-bold text-slate-900 text-sm">{doc.patientName}</p>
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
                      <button onClick={() => doc.appwriteViewUrl && window.open(doc.appwriteViewUrl, '_blank')} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" title="View">
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
    </div>
  );
};

export default DocumentWorkflow;
