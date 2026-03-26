import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Globe, 
  Database, 
  HelpCircle, 
  ChevronRight,
  Camera,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Heart,
  Activity,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const settingsSections = [
  { id: 'profile', label: 'Personal Profile', icon: User, desc: 'Update your personal details and health information.' },
  { id: 'security', label: 'Security & Password', icon: Lock, desc: 'Manage your password, 2FA, and login sessions.' },
  { id: 'notifications', label: 'Notification Settings', icon: Bell, desc: 'Configure how you receive alerts and reminders.' },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield, desc: 'Manage data sharing and HIPAA compliance settings.' },
  { id: 'support', label: 'Help & Support', icon: HelpCircle, desc: 'Get assistance or report issues with the platform.' },
];

export const PatientSettings: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalStorageUsed, setTotalStorageUsed] = useState("0 MB");
  const [storagePercentage, setStoragePercentage] = useState("0%");
  const [authApp, setAuthApp] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingImage(true);
    try {
      const { appwriteStorage, APPWRITE_BUCKET_ID } = await import('../lib/appwrite');
      const { ID } = await import('appwrite');
      
      const response = await appwriteStorage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        file
      );

      const downloadURL = appwriteStorage.getFileView(APPWRITE_BUCKET_ID, response.$id);
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { photoURL: downloadURL });
      
      setUserData((prev: any) => ({ ...prev, photoURL: downloadURL }));
      alert("Profile photo updated successfully!");
    } catch (error) {
      console.error("Error uploading image: ", error);
      alert("Upload failed. Appwrite Server connection blocked or File too large.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const data = new FormData(e.currentTarget);
      const updates = Object.fromEntries(data.entries());
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
      setUserData({ ...userData, ...updates });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please see the console.");
    }
    setIsSaving(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;
    const data = new FormData(e.currentTarget);
    const current = data.get('currentPassword') as string;
    const newPass = data.get('newPassword') as string;
    const confirmPass = data.get('confirmPassword') as string;

    if (newPass !== confirmPass) return alert('New passwords do not match!');
    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);
      alert('Password updated successfully!');
      e.currentTarget.reset();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update password. Check your current password.');
    }
    setIsSaving(false);
  };

  const handleToggleNotification = async (key: string) => {
    if (!auth.currentUser) return;
    const currentPrefs = userData?.notifications || {};
    const updated = { ...currentPrefs, [key]: !currentPrefs[key] };
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { notifications: updated });
    setUserData({ ...userData, notifications: updated });
  };

  const handleInitiateIntegration = (app: string) => {
    if (userData?.integrations?.[app]) {
       handleToggleIntegration(app, true);
    } else {
       setAuthApp(app);
    }
  };

  const handleToggleIntegration = async (app: string, isDisconnect = false) => {
    if (!auth.currentUser) return;
    
    if (!isDisconnect) setIsAuthorizing(true);
    if (!isDisconnect) await new Promise(r => setTimeout(r, 1500));
    
    const currentIntegrations = userData?.integrations || {};
    let payload = null;
    if (!isDisconnect) {
      if (app.includes('Health') || app.includes('Fit')) {
         payload = { steps: Math.floor(Math.random()*4000) + 4000 };
      } else if (app.includes('Pharmacy')) {
         payload = { prescriptions: 2 };
      } else {
         payload = { reports: 12 };
      }
    }
    
    const updated = { ...currentIntegrations, [app]: isDisconnect ? false : payload };
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { integrations: updated });
    setUserData({ ...userData, integrations: updated });
    
    if (!isDisconnect) {
       setIsAuthorizing(false);
       setAuthApp(null);
    }
  };

  const handleExportData = async () => {
    if (!auth.currentUser) return;
    try {
      const recordsSnapshot = await getDocs(query(collection(db, 'records'), where('patientId', '==', auth.currentUser.uid)));
      const records = recordsSnapshot.docs.map(d => d.data());
      const exportData = { profile: userData, medical_records: records };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docpilot_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export data", err);
      alert("Failed to export data.");
    }
  };

  const handleTogglePrivacy = async () => {
    if (!auth.currentUser) return;
    const newState = !(userData?.shareData ?? true);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { shareData: newState });
    setUserData({ ...userData, shareData: newState });
  };

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear your local document cache? You will need to re-download viewed files.")) {
      const dbRequest = indexedDB.deleteDatabase('DocPilotFiles');
      dbRequest.onsuccess = () => {
        alert("Local cache cleared successfully.");
      };
      dbRequest.onerror = () => {
        alert("Failed to clear cache.");
      };
    }
  };

  useEffect(() => {
    const fetchUserDataAndStorage = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          
          const q = query(collection(db, 'records'), where('patientId', '==', auth.currentUser.uid));
          const recSnapshot = await getDocs(q);
          let totalMB = 0;
          recSnapshot.forEach(doc => {
             const data = doc.data();
             if (data.size) {
               const num = parseFloat(data.size.replace(' MB', '').trim());
               if (!isNaN(num)) totalMB += num;
             }
          });
          
          if (totalMB > 1024) {
            setTotalStorageUsed(`${(totalMB / 1024).toFixed(2)} GB`);
          } else {
            setTotalStorageUsed(`${totalMB.toFixed(2)} MB`);
          }
          
          // Assuming 50GB total capacity (51200 MB), calculate percentage
          const pct = Math.min((totalMB / 51200) * 100, 100).toFixed(1);
          setStoragePercentage(`${pct}%`);
          
        } catch (error) {
          console.error("Error fetching user/storage data:", error);
        }
      }
      setLoading(false);
    };
    fetchUserDataAndStorage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">My Settings</h1>
        <p className="text-slate-500 text-lg">Manage your personal information and account preferences.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                "w-full p-6 rounded-4xl border-2 text-left transition-all group",
                activeTab === section.id 
                  ? "border-brand-600 bg-brand-50/30 shadow-lg shadow-brand-500/5" 
                  : "border-slate-50 bg-white hover:border-slate-200"
              )}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  activeTab === section.id ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                )}>
                  <section.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-bold transition-colors",
                    activeTab === section.id ? "text-slate-900" : "text-slate-700"
                  )}>{section.label}</h4>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 transition-transform",
                  activeTab === section.id ? "text-brand-600 translate-x-1" : "text-slate-300"
                )} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-16">{section.desc}</p>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-5xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div 
                      className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-100 overflow-hidden relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img src={userData?.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200"} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploadingImage ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} 
                      disabled={uploadingImage} 
                      className="absolute -bottom-2 -right-2 p-3 bg-brand-600 text-white rounded-2xl shadow-lg hover:bg-brand-700 transition-all disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold text-slate-900 mb-2">
                      {userData?.firstName || userData?.lastName ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : (userData?.name || 'Patient')}
                    </h3>
                    <p className="text-slate-500 font-medium mb-4">Patient ID: #{auth.currentUser?.uid?.slice(-5).toUpperCase() || '12024'} • Age: {userData?.age || 'Not Provided'}</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Verified Identity</span>
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-wider">Standard Plan</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="p-10 space-y-8">
                {/* Basic Demographics */}
                <h4 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Demographics</h4>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        name="firstName"
                        defaultValue={userData?.firstName || ''}
                        placeholder="Ramesh"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        name="lastName"
                        defaultValue={userData?.lastName || ''}
                        placeholder="Kumar"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <h4 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Contact Information</h4>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="email" 
                        name="email"
                        defaultValue={userData?.email || auth.currentUser?.email || ''}
                        readOnly
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-500 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="tel" 
                        name="phone"
                        defaultValue={userData?.phone || ''}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Emergency Contact</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="tel" 
                        name="emergencyPhone"
                        defaultValue={userData?.emergencyPhone || ''}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Profile */}
                <h4 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Medical Profile</h4>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob"
                      defaultValue={userData?.dob || ''}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                    <input 
                      type="number" 
                      name="age"
                      defaultValue={userData?.age || ''}
                      placeholder="e.g. 34"
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                    <select 
                      name="gender"
                      defaultValue={userData?.gender || ''}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Height (cm)</label>
                    <input 
                      type="number" 
                      name="height"
                      defaultValue={userData?.height || ''}
                      placeholder="175"
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      name="weight"
                      defaultValue={userData?.weight || ''}
                      placeholder="70"
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Blood Type</label>
                    <select 
                      name="bloodType"
                      defaultValue={userData?.bloodType || ''}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    >
                      <option value="">Select Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Known Allergies</label>
                  <div className="relative group">
                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                    <input 
                      type="text" 
                      name="allergies"
                      defaultValue={userData?.allergies || ''}
                      placeholder="e.g. Penicillin, Peanuts (leave blank if none)"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Current Medications</label>
                  <textarea 
                    name="medications"
                    defaultValue={userData?.medications || ''}
                    placeholder="List your current active medications, dosages, and frequencies, or leave blank..."
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none min-h-[120px]"
                  />
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
                  <button type="button" className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">
                    Discard Changes
                  </button>
                  <button type="submit" disabled={isSaving} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50">
                    <CheckCircle2 className="w-5 h-5" />
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-5xl border border-slate-100 shadow-sm p-10">
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-8">Password Management</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      required
                      placeholder="••••••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                      <input 
                        type="password" 
                        name="newPassword"
                        required
                        placeholder="••••••••••••"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        required
                        placeholder="••••••••••••"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50">
                    {isSaving ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-white rounded-5xl border border-slate-100 shadow-sm p-10">
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-8">Notification Preferences</h3>
                <div className="space-y-6">
                  {['Email Updates', 'SMS Text Alerts', 'Push Notifications', 'Appointment Reminders'].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900">{pref}</h4>
                        <p className="text-sm text-slate-500">Receive important alerts securely via {pref.toLowerCase()}.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleNotification(pref)}
                        className={cn("w-14 h-8 rounded-full relative transition-colors shadow-inner", userData?.notifications?.[pref] ? "bg-brand-600" : "bg-slate-300")}
                      >
                        <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all", userData?.notifications?.[pref] ? "right-1" : "left-1")} />
                      </button>
                    </div>
                  ))}
                  <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all mt-4">
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-white rounded-5xl border border-slate-100 shadow-sm p-10">
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-8">Privacy & Data Control</h3>
                <div className="space-y-6">
                  <div className="p-6 bg-brand-50 border border-brand-100 rounded-3xl">
                    <h4 className="font-bold text-brand-900 mb-2">HIPAA Compliance Active</h4>
                    <p className="text-sm text-brand-700">Your data is strictly encrypted and protected under healthcare regulations.</p>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900">Share Clinical Data</h4>
                      <p className="text-sm text-slate-500">Automatically share health metrics with assigned practitioners.</p>
                    </div>
                    <button 
                      onClick={handleTogglePrivacy}
                      className={cn("w-14 h-8 rounded-full relative transition-colors shadow-inner", (userData?.shareData ?? true) ? "bg-brand-600" : "bg-slate-300")}
                    >
                      <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all", (userData?.shareData ?? true) ? "right-1" : "left-1")} />
                    </button>
                  </div>
                  <button onClick={handleExportData} className="w-full py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
                    Request Data Export
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-white rounded-5xl border border-slate-100 shadow-sm p-10 text-center">
                <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">We're here to help!</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Having trouble with your patient portal? Our support team is available 24/7 to assist you.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a href="mailto:support@docpilot.com" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all">
                    <Mail className="w-5 h-5" />
                    Email Support
                  </a>
                  <a href="#" className="px-8 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200">
                    <AlertCircle className="w-5 h-5" />
                    View FAQs
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
