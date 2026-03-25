import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';

export const GenericPage: React.FC<{ title: string; subtitle: string; content: string[] }> = ({ title, subtitle, content }) => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <span className="font-display font-extrabold text-xl">D</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">DocPilot</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 max-w-4xl mx-auto min-h-[calc(100vh-160px)]">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-xs font-bold tracking-wider uppercase mb-6">
            <Activity className="w-4 h-4" />
            DocPilot {title.split(' ')[0]}
          </div>
          <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-6">{title}</h1>
          <p className="text-xl text-slate-500 leading-relaxed">{subtitle}</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none">
          {content.map((paragraph, i) => (
            <p key={i} className="mb-6 text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
              {paragraph}
            </p>
          ))}
        </div>
      </main>

      <footer className="py-8 bg-white border-t border-slate-100 text-center">
        <p className="text-slate-400 text-sm">© 2026 DocPilot. All rights reserved.</p>
      </footer>
    </div>
  );
};
