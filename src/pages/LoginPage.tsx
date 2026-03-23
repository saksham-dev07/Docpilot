import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AuthLayout } from '../layouts/AuthLayout';
import { Mail, Lock, ArrowRight, Github, Chrome, Stethoscope, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'patient' ? 'patient' : 'doctor';
  const [role, setRole] = useState<'doctor' | 'patient'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify role in Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          await auth.signOut();
          setError(`This account is registered as a ${userData.role}. Please use the ${userData.role} portal.`);
          setLoading(false);
          return;
        }
      } else {
        // This shouldn't happen if they have an auth account but no firestore doc, 
        // but we should handle it gracefully.
        await auth.signOut();
        setError("User profile not found. Please sign up.");
        setLoading(false);
        return;
      }

      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password login is not enabled in Firebase. Please use Google Login or enable it in the console.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verify role in Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          await auth.signOut();
          setError(`This account is registered as a ${userData.role}. Please use the ${userData.role} portal.`);
          setLoading(false);
          return;
        }
      } else {
        // If Google user doesn't exist in Firestore, they should go to signup
        await auth.signOut();
        setError("Account not found. Please sign up first.");
        setLoading(false);
        return;
      }

      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={role === 'doctor' ? "Doctor Portal" : "Patient Portal"} 
      subtitle={role === 'doctor' 
        ? "Sign in to your clinical dashboard to continue providing care." 
        : "Access your medical records, appointments, and consultations."}
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
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'doctor' ? "dr.chen@aethermed.ai" : "patient@example.com"} 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-brand-600 hover:text-brand-700">Forgot Password?</Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing In..." : "Sign In"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700">
            <Github className="w-5 h-5" />
            GitHub
          </button>
        </div>

        <p className="text-center text-slate-500 font-medium pt-4">
          Don't have an account? <Link to={`/signup?role=${role}`} className="text-brand-600 font-bold hover:text-brand-700">Create Account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
