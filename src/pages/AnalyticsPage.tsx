import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie
} from 'recharts';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Computed Metrics
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalConsults, setTotalConsults] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Chart & Filter States
  const [timeFrame, setTimeFrame] = useState<'week' | 'month'>('month');
  const [rawApts, setRawApts] = useState<any[]>([]);
  
  // Chart Arrays
  const [chartData, setChartData] = useState<{name: string, patients: number, consultations: number, revenue: number}[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);

  // Export Logic
  const handleExportData = () => {
    let content = `DOCPILOT CLINICAL INTELLIGENCE EXPORT\nGenerated: ${new Date().toLocaleString()}\n==========================================\n\n`;
    content += `LIFETIME METRICS:\n------------------------------------------\n`;
    content += `Unique Patients: ${totalPatients}\nTotal Consultations: ${totalConsults}\nGross Revenue: ₹${totalRevenue}\nRecords Filed: ${totalRecords}\n\n`;
    
    content += `CHART DATA (${timeFrame.toUpperCase()}): \n------------------------------------------\n`;
    chartData.forEach(node => {
      content += `[${node.name}] - Consultations: ${node.consultations} | Value: ₹${node.revenue} | Unique Patients: ${node.patients}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocPilot_Analytics_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const aptsQuery = query(collection(db, 'appointments'), where('doctorId', '==', auth.currentUser.uid));
    const recsQuery = query(collection(db, 'records'), where('doctorId', '==', auth.currentUser.uid));

    let aptsUnsubscribe = () => {};
    let recsUnsubscribe = () => {};

    const loadData = async () => {
      recsUnsubscribe = onSnapshot(recsQuery, (snapshot) => {
        setTotalRecords(snapshot.docs.length);
      });

      aptsUnsubscribe = onSnapshot(aptsQuery, (snapshot) => {
        const apts = snapshot.docs.map(document => document.data());
        setRawApts(apts);
        
        let revenue = 0;
        const patientSet = new Set<string>();
        const typeCount: Record<string, number> = {};
        
        apts.forEach(apt => {
          if (apt.patientId) patientSet.add(apt.patientId);
          
          const validStatus = ['completed', 'scheduled', 'done'].includes(apt.status?.toLowerCase() || 'completed');
          const finalAmount = Number(apt.amount) || 0;
          
          if (validStatus) {
             revenue += finalAmount;
          }
          if (apt.type) {
             typeCount[apt.type] = (typeCount[apt.type] || 0) + 1;
          } else {
             typeCount['In-Person'] = (typeCount['In-Person'] || 0) + 1;
          }
        });

        const finalPie = Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] }));

        setTotalPatients(patientSet.size);
        setTotalConsults(apts.length);
        setTotalRevenue(revenue);
        setPieData(finalPie.length > 0 ? finalPie : [{ name: 'No Encounters', value: 1 }]);
        setLoading(false);
      });
    };

    loadData();

    return () => {
      aptsUnsubscribe();
      recsUnsubscribe();
    };
  }, []);

  // Time-Frame Graph Reducer
  useEffect(() => {
    if (rawApts.length === 0) return;

    if (timeFrame === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = months.map(m => ({
        name: m, patients: 0, consultations: 0, revenue: 0, _pSet: new Set<string>()
      }));
      rawApts.forEach(apt => {
        if (apt.date) {
           const d = new Date(apt.date);
           if (!isNaN(d.getTime())) {
              const monthIdx = d.getMonth();
              const node = monthlyData[monthIdx];
              node.consultations += 1;
              
              const validStatus = ['completed', 'scheduled', 'done'].includes(apt.status?.toLowerCase() || 'completed');
              const finalAmount = Number(apt.amount) || 0;
              node.revenue += validStatus ? finalAmount : 0;
              
              if (apt.patientId) node._pSet.add(apt.patientId);
           }
        }
      });
      monthlyData.forEach(m => m.patients = m._pSet.size);
      setChartData(monthlyData);
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = days.map(d => ({
        name: d, patients: 0, consultations: 0, revenue: 0, _pSet: new Set<string>()
      }));
      
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);

      rawApts.forEach(apt => {
        if (apt.date) {
           const d = new Date(apt.date);
           if (!isNaN(d.getTime()) && d >= startOfWeek) {
              const dayIdx = d.getDay();
              const node = weeklyData[dayIdx];
              node.consultations += 1;
              
              const validStatus = ['completed', 'scheduled', 'done'].includes(apt.status?.toLowerCase() || 'completed');
              const finalAmount = Number(apt.amount) || 0;
              node.revenue += validStatus ? finalAmount : 0;
              
              if (apt.patientId) node._pSet.add(apt.patientId);
           }
        }
      });
      weeklyData.forEach(m => m.patients = m._pSet.size);
      setChartData(weeklyData);
    }
  }, [rawApts, timeFrame]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Clinical Intelligence</h1>
          <p className="text-slate-500 text-lg">Deep insights into patient outcomes and practice performance.</p>
        </motion.div>
        <div className="flex gap-3">
          <button onClick={() => alert("Advanced analytical configurations and visual overrides are exclusively available in DocPilot Pro via our upcoming Customization Engine. Contact support to migrate.")} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Customize View
          </button>
          <button onClick={handleExportData} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unique Patients', value: totalPatients.toString(), change: '+Active', icon: Users, color: 'text-emerald-600 bg-emerald-50', desc: 'Total individual patients seen.' },
          { label: 'Total Consultations', value: totalConsults.toString(), change: '+Active', icon: Activity, color: 'text-brand-600 bg-brand-50', desc: 'All incoming appointments.' },
          { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+Active', icon: TrendingUp, color: 'text-amber-600 bg-amber-50', desc: 'Total revenue from completed sessions.' },
          { label: 'Records Filed', value: totalRecords.toString(), change: '+Active', icon: BarChart3, color: 'text-purple-600 bg-purple-50', desc: 'Total uploaded clinical documents.' },
        ].map((stat, i) => (
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
              <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {stat.change}
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 mb-2">
              {loading ? '...' : stat.value}
            </h3>
            <p className="text-xs text-slate-400 font-medium">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Patient Volume Area Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-900">Patient Volume</h3>
              <p className="text-slate-500 text-sm">Targeted trends for new and returning encounters.</p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setTimeFrame('week')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                  timeFrame === 'week' ? "bg-white text-slate-900" : "bg-transparent text-slate-500 hover:text-slate-700"
                )}>
                Week
              </button>
              <button 
                onClick={() => setTimeFrame('month')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                  timeFrame === 'month' ? "bg-white text-slate-900" : "bg-transparent text-slate-500 hover:text-slate-700"
                )}>
                Month
              </button>
            </div>
          </div>
          <div className="h-80 w-full">
            {loading ? (
               <div className="flex w-full h-full items-center justify-center text-slate-400 font-bold">Syncing Records...</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#6366F1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPatients)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Consultation Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-900">Specialty Distribution</h3>
              <p className="text-slate-500 text-sm">Consultation volume by medical specialty.</p>
            </div>
            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-600 transition-all">
              <PieChartIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="h-80 w-full flex items-center">
            {loading ? (
                <div className="flex w-full h-full items-center justify-center text-slate-400 font-bold">Syncing Records...</div>
            ) : (
             <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-4 pl-10">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{((item.value / Math.max(1, totalConsults)) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
             </>
            )}
          </div>
        </motion.div>

        {/* Consultation Trends Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="lg:col-span-2 bg-white p-10 rounded-4xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-900">Consultation Trends</h3>
              <p className="text-slate-500 text-sm">Comparing monthly consultations and revenue growth.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-600" />
                <span className="text-xs font-bold text-slate-500">Consultations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-500">Revenue</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
             {loading ? (
                <div className="flex w-full h-full items-center justify-center text-slate-400 font-bold">Syncing Records...</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#F8F9FB' }}
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Bar dataKey="consultations" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
