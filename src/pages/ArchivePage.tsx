import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
  Share2,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Query, ID } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID } from '../lib/appwrite';

export const ArchivePage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;
    const fetchRecords = async () => {
      try {
        const currentUser = await account.get();
        
        const fetchData = async () => {
          try {
            const snap = await databases.listDocuments(APPWRITE_DATABASE_ID, 'records', [
              Query.equal('doctorId', currentUser.$id),
              Query.orderDesc('date'),
              Query.limit(100)
            ]);
            setRecords(snap.documents.map(d => ({ id: d.$id, ...d })));
            setLoading(false);
          } catch(e) { setLoading(false); }
        };
        
        fetchData();
        if (!isMounted) return;
        interval = setInterval(fetchData, 5000);
      } catch(e) { setLoading(false); }
    };
    
    fetchRecords();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const filteredRecords = records.filter(record => 
    record.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Patient Records Archive</h1>
          <p className="text-slate-500 text-lg">Secure, searchable repository for all historical clinical data.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Database className="w-4 h-4" />
            Export Archive
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
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
            placeholder="Search by patient name, ID, or record type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
          <button className="flex-1 md:flex-none px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <p>Loading records...</p>
          </div>
        ) : filteredRecords.length > 0 ? filteredRecords.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                  <History className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    Active
                  </span>
                  <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{item.patientName}</h3>
              <p className="text-slate-500 font-medium mb-8 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {item.title}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-bold text-slate-700">{item.date}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-700">{item.type}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition-all">
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center group-hover:bg-brand-50/50 transition-colors">
              <span className="text-xs font-bold text-slate-400 group-hover:text-brand-600 transition-colors">Record ID: #{item.id.slice(0, 8)}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Archive className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No records found in the archive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
