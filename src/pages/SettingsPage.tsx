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
  Loader2,
  Clock,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { account, databases, APPWRITE_DATABASE_ID } from '../lib/appwrite';

const settingsSections = [
  { id: 'profile', label: 'Profile Information', icon: User, desc: 'Update your personal details and professional bio.' },
  { id: 'security', label: 'Security & Password', icon: Lock, desc: 'Manage your password, 2FA, and login sessions.' },
  { id: 'notifications', label: 'Notification Settings', icon: Bell, desc: 'Configure how you receive alerts and reminders.' },
  { id: 'privacy', label: 'Privacy & Compliance', icon: Shield, desc: 'Manage data sharing and HIPAA compliance settings.' },
  { id: 'integrations', label: 'Connected Apps', icon: Globe, desc: 'Manage connections to EMRs, labs, and pharmacies.' },
  { id: 'storage', label: 'Data & Storage', icon: Database, desc: 'Manage your cloud storage and archive preferences.' },
  { id: 'support', label: 'Help & Support', icon: HelpCircle, desc: 'Get assistance or report issues with the platform.' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialty: '',
    phone: '',
    location: '',
    bio: '',
    experience: '',
    consultationFee: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await account.get();
        try {
          const docSnap = await databases.getDocument(APPWRITE_DATABASE_ID, 'users', currentUser.$id);
          const data = docSnap as any;
          setUserData(data);
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            specialty: data.specialty || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            experience: data.experience || '',
            consultationFee: data.consultationFee || ''
          });
        } catch(e) {}
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const currentUser = await account.get();
      await databases.updateDocument(APPWRITE_DATABASE_ID, 'users', currentUser.$id, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setUserData((prev: any) => ({ ...prev, ...formData }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Account Control</h1>
        <p className="text-slate-500 text-lg">Manage your personal settings and practice preferences.</p>
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
                    <div className="w-32 h-32 rounded-5xl bg-slate-200 overflow-hidden border-4 border-white shadow-xl">
                      <img src="https://picsum.photos/seed/doctor_profile/200/200" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-3 bg-brand-600 text-white rounded-2xl shadow-lg hover:bg-brand-700 transition-all">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold text-slate-900 mb-2">{userData?.firstName} {userData?.lastName}</h3>
                    <p className="text-slate-500 font-medium mb-4">{userData?.specialty || 'Medical Professional'} • {userData?.licenseNumber || 'ML-123456789'}</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Verified Professional</span>
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-wider">Premium Plan</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8">
                {success && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Profile updated successfully!
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Specialty</label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        placeholder="e.g. Senior Cardiologist"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="San Francisco, CA"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Years of Experience</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 15+ Years"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Consultation Fee (₹)</label>
                    <div className="relative group">
                      <p className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-focus-within:text-brand-600 transition-colors">₹</p>
                      <input 
                        type="number" 
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Professional Bio</label>
                  <textarea 
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about your professional background..."
                    className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
                  <button 
                    onClick={() => {
                      if (userData) {
                        setFormData({
                          firstName: userData.firstName || '',
                          lastName: userData.lastName || '',
                          specialty: userData.specialty || '',
                          phone: userData.phone || '',
                          location: userData.location || '',
                          bio: userData.bio || '',
                          experience: userData.experience || '',
                          consultationFee: userData.consultationFee || ''
                        });
                      }
                    }}
                    className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-rose-50 rounded-5xl border border-rose-100 p-10">
                <div className="flex items-center gap-4 mb-6 text-rose-600">
                  <AlertCircle className="w-8 h-8" />
                  <h3 className="text-2xl font-display font-bold">Two-Factor Authentication</h3>
                </div>
                <p className="text-rose-700 font-medium mb-8 leading-relaxed">
                  Add an extra layer of security to your account by requiring a verification code from your mobile device when you sign in.
                </p>
                <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all">
                  Enable 2FA
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
