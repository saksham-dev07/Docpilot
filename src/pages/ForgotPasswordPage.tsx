import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle={submitted ? "Check your inbox for instructions." : "Enter your email and we'll send you a link to reset your password."}
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="email" 
                required
                placeholder="dr.sharma@hospital.in"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
          >
            Send Reset Link
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-slate-500 font-medium pt-4">
            Remember your password? <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">Sign In</Link>
          </p>
        </form>
      ) : (
        <div className="space-y-8 text-center">
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Check your email</h3>
            <p className="text-slate-500 leading-relaxed">
              We've sent a password reset link to <span className="font-bold text-slate-700">dr.sharma@hospital.in</span>. Please check your inbox and follow the instructions.
            </p>
          </div>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-brand-600 font-bold hover:text-brand-700 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};
