import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AuthLayout } from '../layouts/AuthLayout';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Stethoscope, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'patient' ? 'patient' : 'doctor';
  const [role, setRole] = useState<'doctor' | 'patient'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    licenseNumber: '',
  });

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document already exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const existingRole = docSnap.data().role;
        if (existingRole !== role) {
          await auth.signOut();
          setError(`An account already exists with the role of ${existingRole}. Please sign in through the ${existingRole} portal.`);
          setLoading(false);
          return;
        }
      } else {
        const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
        const userData: any = {
          uid: user.uid,
          email: user.email,
          firstName: firstName || 'User',
          lastName: lastNameParts.join(' ') || '',
          role: role,
          createdAt: new Date().toISOString(),
        };

        if (role === 'doctor') {
          userData.licenseNumber = 'PENDING';
        } else {
          userData.patientId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
        }

        await setDoc(docRef, userData);
      }
      
      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userData: any = {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: role,
        createdAt: new Date().toISOString(),
      };

      if (role === 'doctor') {
        userData.licenseNumber = formData.licenseNumber;
      } else {
        userData.patientId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password signup is not enabled in Firebase. Please use Google Signup or enable it in the console.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={role === 'doctor' ? "Doctor Registration" : "Patient Registration"} 
      subtitle={role === 'doctor' 
        ? "Join the network of elite medical professionals using AI to save lives." 
        : "Start your journey to better health with AI-powered medical care."}
    >
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
        <button 
          onClick={() => setRole('doctor')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            role === 'doctor' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Stethoscope className="w-4 h-4" />
          Doctor
        </button>
        <button 
          onClick={() => setRole('patient')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            role === 'patient' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <User className="w-4 h-4" />
          Patient
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="text" 
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Sarah" 
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
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Chen" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={role === 'doctor' ? "dr.chen@aethermed.ai" : "patient@example.com"} 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>
        </div>

        {role === 'doctor' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Medical License Number</label>
            <div className="relative group">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="text" 
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="ML-123456789" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100">
          <ShieldCheck className="w-5 h-5 text-brand-600 mt-0.5" />
          <p className="text-xs text-brand-700 leading-relaxed">
            By creating an account, you agree to our <a href="#" className="font-bold underline">Terms of Service</a> and <a href="#" className="font-bold underline">Privacy Policy</a>. All medical data is handled with strict HIPAA compliance.
          </p>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Create Account"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full py-4 border-2 border-slate-100 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Chrome className="w-6 h-6" />
          Sign up with Google
        </button>

        <p className="text-center text-slate-500 font-medium pt-4">
          Already have an account? <Link to={`/login?role=${role}`} className="text-brand-600 font-bold hover:text-brand-700">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
