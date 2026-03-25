import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen flex bg-white relative overflow-hidden">
      {/* Exit Button */}
      <Link 
        to="/" 
        className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 hover:text-slate-900 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 h-full bg-brand-600 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-10">
              <span className="font-display font-black text-3xl">D</span>
            </div>
            <h1 className="text-6xl font-display font-extrabold leading-tight mb-8">
              The Future of <span className="text-brand-200 italic">Clinical Intelligence</span>
            </h1>
            <p className="text-xl text-brand-100/80 leading-relaxed mb-12">
              Empowering healthcare professionals with AI-driven insights, seamless workflows, and empathetic patient care.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-4xl border border-white/10">
                <p className="text-3xl font-bold mb-1">99.8%</p>
                <p className="text-sm text-brand-200">Diagnostic Accuracy</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-4xl border border-white/10">
                <p className="text-3xl font-bold mb-1">40%</p>
                <p className="text-sm text-brand-200">Time Saved on Admin</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-500 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-20 -left-20 w-64 h-64 bg-brand-700 rounded-full blur-3xl opacity-50" />
      </div>

    {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col p-8 sm:p-20 relative">
        <div className="w-full max-w-md m-auto">
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">{title}</h2>
              <p className="text-slate-500 text-lg">{subtitle}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
