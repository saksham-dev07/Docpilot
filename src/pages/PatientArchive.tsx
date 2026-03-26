import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronRight,
  Clock,
  Calendar,
  Activity,
  User,
  Upload,
  X,
  Loader2,
  Trash
} from 'lucide-react';
import { Query } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID } from '../lib/appwrite';
import { ID } from 'appwrite';
import { appwriteStorage, APPWRITE_BUCKET_ID } from '../lib/appwrite';

const DB_NAME = 'DocPilotFiles';
const STORE_NAME = 'documents';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFile = async (id: string, file: File) => {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const readFile = async (id: string): Promise<File | null> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const deleteLocalFile = async (id: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const PatientArchive: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('Lab Report');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [fileViewUrl, setFileViewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (viewRecord && viewRecord.appwriteViewUrl) {
      setFileViewUrl(viewRecord.appwriteViewUrl);
    } else if (viewRecord && viewRecord.fileData) {
      setFileViewUrl(viewRecord.fileData);
    } else if (viewRecord && viewRecord.fileUrl) {
      setFileViewUrl(viewRecord.fileUrl);
    } else if (viewRecord && viewRecord.localFileId) {
      readFile(viewRecord.localFileId).then(file => {
        if (file) setFileViewUrl(URL.createObjectURL(file));
      }).catch(err => console.error("Error reading preview file:", err));
    }
    return () => {
      if (fileViewUrl && fileViewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileViewUrl);
        setFileViewUrl(null);
      }
    };
  }, [viewRecord]);

  const handleDownload = async (record: any) => {
    if (record.appwriteDownloadUrl) {
      window.open(record.appwriteDownloadUrl, '_blank');
      return;
    }
    if (record.fileData) {
      const a = document.createElement('a');
      a.href = record.fileData;
      a.download = record.fileName || record.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (record.fileUrl) {
      window.open(record.fileUrl, '_blank');
      return;
    }
    if (record.localFileId) {
      try {
        const file = await readFile(record.localFileId);
        if (file) {
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = record.fileName || file.name || 'document.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return;
        } else {
          alert("Attached file not found in local browser cache.");
        }
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }

    const text = `MEDICAL RECORD\n------------------\nName: ${record.name || record.title || 'Unknown'}\nDate: ${record.date || 'Unknown'}\nCategory: ${record.type || 'Unknown'}\nDoctor: ${record.doctorName || record.doctor || 'Self Uploaded'}\nSecure ID: ${record.id}\n\nThis is a securely generated prototype document.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.name || record.title || 'Record'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < filteredRecords.length; i++) {
      await new Promise(r => setTimeout(r, 800)); // Sequential delay to prevent browser block
      await handleDownload(filteredRecords[i]);
    }
  };

  const handleDelete = async (record: any) => {
    if (window.confirm(`Are you sure you want to completely delete "${record.name || record.title || 'this document'}"?`)) {
      try {
        if (record.id) {
          await databases.deleteDocument(APPWRITE_DATABASE_ID, 'records', record.id);
        }
        if (record.appwriteFileId) {
          await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, record.appwriteFileId);
        } else if (record.localFileId) {
          await deleteLocalFile(record.localFileId);
        }
        
        // Refresh local state
        setRecords(prev => prev.filter(r => r.id !== record.id));
      } catch (err) {
        console.error("Failed to delete record: ", err);
        alert("Deletion failed.");
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('File too large. Please keep Appwrite uploads under 20MB.');
      return;
    }

    setIsUploading(true);
    try {
      const currentUser = await account.get();
      const response = await appwriteStorage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        selectedFile
      );

      const viewUrl = appwriteStorage.getFileView(APPWRITE_BUCKET_ID, response.$id);
      const downloadUrl = appwriteStorage.getFileDownload(APPWRITE_BUCKET_ID, response.$id);

      await databases.createDocument(APPWRITE_DATABASE_ID, 'records', ID.unique(), {
        patientId: currentUser.$id,
        name: uploadName,
        type: uploadType,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: `${(selectedFile.size / 1024 / 1024).toFixed(3)} MB`, 
        appwriteFileId: response.$id,
        appwriteViewUrl: viewUrl.toString(),
        appwriteDownloadUrl: downloadUrl.toString(),
        fileName: selectedFile.name,
      });
      
      setShowUploadModal(false);
      setUploadName('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading to Appwrite:', error);
      alert('Failed to connect to Appwrite Server. Please verify your Project keys in src/lib/appwrite.ts.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;
    const init = async () => {
      let currentUser: any;
      try {
        currentUser = await account.get();
      } catch(e) { return; }

      const fetchRecords = async () => {
        try {
          const snap = await databases.listDocuments(APPWRITE_DATABASE_ID, 'records', [
            Query.equal('patientId', currentUser.$id)
          ]);

          const fsDocs = snap.documents.map(doc => ({ id: doc.$id, ...doc }));

          try {
            const bucketResult = await appwriteStorage.listFiles(APPWRITE_BUCKET_ID);
            const externalAppwriteFiles = bucketResult.files
              .filter(f => !fsDocs.some((fs: any) => fs.appwriteFileId === f.$id))
              .map(f => ({
                id: f.$id,
                title: f.name,
                name: f.name,
                fileName: f.name,
                type: 'Cloud Bucket',
                doctorName: 'Manual Upload',
                date: new Date(f.$createdAt).toLocaleDateString(),
                size: `${(f.sizeOriginal / 1024 / 1024).toFixed(3)} MB`,
                appwriteFileId: f.$id,
                appwriteViewUrl: appwriteStorage.getFileView(APPWRITE_BUCKET_ID, f.$id),
                appwriteDownloadUrl: appwriteStorage.getFileDownload(APPWRITE_BUCKET_ID, f.$id),
              }));
              
            setRecords([...fsDocs, ...externalAppwriteFiles]);
          } catch (err) {
            console.error("Could not sync external Appwrite Bucket files:", err);
            setRecords(fsDocs);
          }
          
          setLoading(false);
        } catch(e) { setLoading(false); }
      };

      fetchRecords();
      if (!isMounted) return;
      interval = setInterval(fetchRecords, 5000);
    };
    init();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const filteredRecords = records.filter(record => 
    (record.title?.toLowerCase() || record.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (record.doctorName?.toLowerCase() || record.doctor?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (record.type?.toLowerCase() || record.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
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
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">My Medical Records</h1>
          <p className="text-slate-500 text-lg">Access and manage your complete medical history securely.</p>
        </motion.div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button 
            onClick={handleDownloadAll}
            className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records by name, doctor, or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
          />
        </div>
        <button className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter Records
        </button>
      </div>

      {/* Records List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <p>Loading records...</p>
          </div>
        ) : filteredRecords.length > 0 ? filteredRecords.map((record, i) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-center gap-8"
          >
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{record.title || record.name}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {record.date}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {record.doctorName || record.doctor}
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {record.type}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-400 mr-2">{record.size || '1.2 MB'}</span>
              <button 
                onClick={() => setViewRecord(record)}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition-all"
                title="View Record"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDownload(record)}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition-all"
                title="Download Record"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(record)}
                className="p-3 bg-slate-50 text-red-300 rounded-2xl hover:text-red-600 hover:bg-red-50 transition-all"
                title="Delete Record"
              >
                <Trash className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewRecord(record)}
                className="p-3 ml-2 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                title="View Details"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="py-20 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No medical records found.</p>
          </div>
        )}
      </div>

      {/* Storage Plan widget hidden for demo deployment */}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                <Upload className="w-6 h-6 text-brand-600" />
                Upload Record
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Document Name</label>
                <input 
                  type="text" 
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Previous Blood Test Results" 
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                >
                  <option value="Lab Report">Lab Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Scan/X-Ray">Scan/X-Ray</option>
                  <option value="Clinical Note">Clinical Note</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-brand-400 transition-colors bg-slate-50/50 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <Upload className="w-8 h-8 text-brand-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">
                  {selectedFile ? selectedFile.name : 'Click to browse files'}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, JPG, PNG up to 10MB'}
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      Upload File
                      <Upload className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Record Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand-600" />
                Record Details
              </h3>
              <button 
                onClick={() => setViewRecord(null)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {fileViewUrl ? (
                <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center relative group">
                  {viewRecord?.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img 
                      src={fileViewUrl} 
                      alt="Document Preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe 
                      src={fileViewUrl} 
                      className="w-full h-full"
                      title="Document Preview"
                    />
                  )}
                  <a 
                    href={fileViewUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-4 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                  >
                    Open Full Screen Externally
                  </a>
                </div>
              ) : null}

              <div className="flex items-center gap-4 p-5 bg-brand-50 rounded-3xl border border-brand-100">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-wider mb-1">Document Name</p>
                  <p className="font-bold text-brand-900 text-lg">{viewRecord.name || viewRecord.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-bold text-slate-900">{viewRecord.date}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Category</p>
                  <p className="font-bold text-slate-900">{viewRecord.type}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Added By</p>
                <p className="font-bold text-slate-900">{viewRecord.doctorName || viewRecord.doctor || 'Patient Upload'}</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => handleDownload(viewRecord)}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Download File
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientArchive;
