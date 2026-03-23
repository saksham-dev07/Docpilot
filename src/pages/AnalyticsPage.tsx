import React from 'react';
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

const data = [
  { name: 'Jan', patients: 400, consultations: 240, revenue: 2400 },
  { name: 'Feb', patients: 300, consultations: 139, revenue: 2210 },
  { name: 'Mar', patients: 200, consultations: 980, revenue: 2290 },
  { name: 'Apr', patients: 278, consultations: 390, revenue: 2000 },
  { name: 'May', patients: 189, consultations: 480, revenue: 2181 },
  { name: 'Jun', patients: 239, consultations: 380, revenue: 2500 },
  { name: 'Jul', patients: 349, consultations: 430, revenue: 2100 },
];

const pieData = [
  { name: 'Cardiology', value: 400 },
  { name: 'Neurology', value: 300 },
  { name: 'General', value: 300 },
  { name: 'Pediatrics', value: 200 },
];

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

export const AnalyticsPage: React.FC = () => {
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
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Customize View
          </button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Patient Growth', value: '2,482', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Avg. Consultation', value: '18m', change: '-2.4%', icon: Activity, color: 'text-brand-600 bg-brand-50' },
          { label: 'Patient Satisfaction', value: '4.9/5', change: '+0.2%', icon: Users, color: 'text-amber-600 bg-amber-50' },
          { label: 'Clinical Accuracy', value: '99.8%', change: '+0.5%', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
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
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.change}
                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
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
              <p className="text-slate-500 text-sm">Monthly trends for new and returning patients.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">Week</button>
              <button className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition-all">Month</button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
                  <span className="text-sm font-black text-slate-900">{Math.round((item.value / 1200) * 100)}%</span>
                </div>
              ))}
            </div>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
