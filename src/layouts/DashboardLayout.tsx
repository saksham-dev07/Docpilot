import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Video, 
  FileText, 
  Archive, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut,
  Search,
  Bell,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

const doctorSidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor' },
  { icon: Users, label: 'OPD Manager', path: '/opd' },
  { icon: Calendar, label: 'Appointments', path: '/doctor/appointments' },
  { icon: Video, label: 'Consultation', path: '/doctor/consultations' },
  { icon: FileText, label: 'Workflow', path: '/workflow' },
  { icon: Archive, label: 'Archive', path: '/doctor/archive' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: CreditCard, label: 'Billing', path: '/billing' },
  { icon: Settings, label: 'Settings', path: '/doctor/settings' },
];

const patientSidebarItems = [
  { icon: LayoutDashboard, label: 'My Health', path: '/patient' },
  { icon: Calendar, label: 'Book Appointment', path: '/book' },
  { icon: Video, label: 'My Consultations', path: '/patient/consultations' },
  { icon: Archive, label: 'My Records', path: '/patient/archive' },
  { icon: Settings, label: 'Settings', path: '/patient/settings' },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDoctorPath = location.pathname.startsWith('/doctor') || 
                       ['/opd', '/workflow', '/analytics', '/billing'].includes(location.pathname);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSubtext, setUserSubtext] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsCleared, setNotificationsCleared] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const conductSearch = async () => {
      if (!auth.currentUser) return;
      setIsSearching(true);
      const q = searchQuery.toLowerCase().trim();
      const results: any[] = [];
      
      try {
        if (isDoctorPath) {
           const aptSnap = await getDocs(query(collection(db, 'appointments'), where('doctorId', '==', auth.currentUser.uid)));
           aptSnap.forEach(d => {
             const data = d.data();
             if (data.patientName?.toLowerCase().includes(q) || data.type?.toLowerCase().includes(q)) {
               results.push({ type: 'Appointment', title: `${data.patientName} - ${data.type}`, desc: data.date, id: d.id, link: '/doctor/appointments' });
             }
           });
           
           const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'patient')));
           usersSnap.forEach(d => {
             const data = d.data();
             const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase();
             if (fullName.includes(q) || data.email?.toLowerCase().includes(q)) {
               results.push({ type: 'Patient Index', title: `${data.firstName || ''} ${data.lastName || ''}`, desc: data.email, id: d.id, link: '/opd' });
             }
           });

        } else {
           const recSnap = await getDocs(query(collection(db, 'records'), where('patientId', '==', auth.currentUser.uid)));
           recSnap.forEach(d => {
             const data = d.data();
             if (data.title?.toLowerCase().includes(q) || data.type?.toLowerCase().includes(q) || data.category?.toLowerCase().includes(q)) {
               results.push({ type: 'Clinical Record', title: data.title || 'Untitled Document', desc: `${data.type} • ${data.date}`, id: d.id, link: '/patient/archive' });
             }
           });
           
           const aptSnap = await getDocs(query(collection(db, 'appointments'), where('patientId', '==', auth.currentUser.uid)));
           aptSnap.forEach(d => {
             const data = d.data();
             if (data.doctorName?.toLowerCase().includes(q) || data.type?.toLowerCase().includes(q)) {
               results.push({ type: 'Consultation', title: `Dr. ${data.doctorName?.replace('Dr. ','')}`, desc: `${data.type} on ${data.date}`, id: d.id, link: '/patient/consultations' });
             }
           });
        }
      } catch (err) { }
      
      setSearchResults(results.slice(0, 6)); 
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      conductSearch();
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isDoctorPath]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(`${data.firstName} ${data.lastName}`);
          setUserRole(data.role);
          if (data.role === 'doctor') {
            setUserSubtext(data.specialty || 'Medical Professional');
          } else {
            setUserSubtext(`Patient ID: ${data.patientId || '#12024'}`);
          }
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarItems = isDoctorPath ? doctorSidebarItems : patientSidebarItems;

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-xl">A</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">AetherMed AI</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                  isActive 
                    ? "bg-brand-50 text-brand-600 font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-900"
                )} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-3xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img 
                  src={isDoctorPath ? "https://picsum.photos/seed/doctor/100/100" : "https://picsum.photos/seed/patient/100/100"} 
                  alt="User" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">{userSubtext}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex-1 max-w-xl">
            <div className="relative group z-50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isDoctorPath ? "Search patients, clinic records, or insights..." : "Search doctors, hospitals, or documents..."}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
              />
              
              {searchQuery.trim().length > 1 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform origin-top transition-all max-h-[400px] overflow-y-auto">
                   {isSearching ? (
                     <div className="p-8 text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                       <span className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                       Scanning database...
                     </div>
                   ) : searchResults.length > 0 ? (
                     <div className="py-2 divide-y divide-slate-50">
                       {searchResults.map((res, i) => (
                         <Link key={i} to={res.link} onClick={() => setSearchQuery('')} className="block px-6 py-4 hover:bg-slate-50 transition-colors group/item">
                           <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1 opacity-70 group-hover/item:opacity-100 transition-opacity">{res.type}</p>
                           <p className="font-bold text-slate-900 group-hover/item:text-brand-700 transition-colors">{res.title}</p>
                           <p className="text-xs text-slate-500 mt-0.5">{res.desc}</p>
                         </Link>
                       ))}
                     </div>
                   ) : (
                     <div className="p-8 text-center">
                       <p className="font-bold text-slate-900 text-sm">No results found</p>
                       <p className="text-xs text-slate-500 mt-1">Try searching for different keywords.</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {!notificationsCleared && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
            </button>
            
            {showNotifications && (
              <div className="absolute right-32 top-14 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform origin-top-right transition-all z-50">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <h4 className="font-bold text-slate-900">Notifications</h4>
                  {!notificationsCleared && <button onClick={() => setNotificationsCleared(true)} className="text-xs font-bold text-brand-600 hover:text-brand-700">Mark all read</button>}
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {!notificationsCleared ? [
                    { title: isDoctorPath ? 'New Patient Assigned' : 'Appointment Reminder', desc: isDoctorPath ? 'Saksham Agarwal was assigned to your OPD.' : 'Your consultation with Dr. Agarwal is scheduled for 2:00 PM.', time: '1h ago', dot: 'bg-brand-500' },
                    { title: 'New Lab Report', desc: 'Secure blood test results are available.', time: '5h ago', dot: 'bg-emerald-500' },
                    { title: 'System Warning', desc: 'AetherMed platform background tracking updated.', time: '1d ago', dot: 'bg-slate-400' }
                  ].map((n, i) => (
                    <div key={i} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex gap-4">
                      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${n.dot}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{n.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-1">{n.desc}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{n.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center">
                      <p className="text-sm font-bold text-slate-400">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-1">You have no new notifications.</p>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-50 text-center">
                  <button onClick={() => setShowNotifications(false)} className="text-xs font-bold text-slate-500 hover:text-slate-900">Close Panel</button>
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-100 mx-2" />
            <Link to={isDoctorPath ? '/doctor/settings' : '/patient/settings'} className="flex items-center gap-3 pl-2 pr-4 py-2 bg-slate-50 rounded-2xl hover:bg-brand-50 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-700">{userName.split(' ')[0] || 'Profile'}</span>
            </Link>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
};
