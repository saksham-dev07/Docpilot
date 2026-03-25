import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Brain, 
  Microscope, 
  Stethoscope, 
  Zap, 
  Shield, 
  Users, 
  Activity, 
  MessageSquare, 
  CheckCircle2 
} from 'lucide-react';

const solutions = [
  {
    icon: Heart,
    title: "Cardiology Suite",
    desc: "Advanced ECG analysis, real-time hemodynamic monitoring, and AI-driven risk stratification for cardiovascular health.",
    features: ["Automated ECG Interpretation", "Heart Failure Prediction", "Remote Patient Monitoring"],
    color: "bg-rose-50 text-rose-600"
  },
  {
    icon: Brain,
    title: "Neurology & Psychiatry",
    desc: "Cognitive assessment tools and neuro-imaging analysis for precise mental health diagnostics.",
    features: ["Seizure Detection", "Cognitive Decline Tracking", "Mood Pattern Analysis"],
    color: "bg-purple-50 text-purple-600"
  },
  {
    icon: Microscope,
    title: "Precision Oncology",
    desc: "Genomic data integration and tumor progression modeling for personalized cancer treatment.",
    features: ["Genomic Sequencing Analysis", "Tumor Growth Modeling", "Treatment Response Prediction"],
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    icon: Stethoscope,
    title: "Primary Care",
    desc: "Comprehensive patient management with automated triage and preventive health insights.",
    features: ["Automated Triage", "Preventive Care Alerts", "Chronic Disease Management"],
    color: "bg-orange-50 text-orange-600"
  }
];

export const SolutionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-xl">A</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">DocPilot</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-display font-extrabold text-slate-900 mb-8">
              Specialized <span className="text-brand-600">AI Solutions</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-12">
              DocPilot adapts to your specific clinical needs, providing specialized tools and intelligence for various medical fields.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          {solutions.map((solution, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className={`w-20 h-20 ${solution.color} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                <solution.icon className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-6">{solution.title}</h3>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">{solution.desc}</p>
              <div className="space-y-4 mb-12">
                {solution.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-brand-600" />
                    {feature}
                  </div>
                ))}
              </div>
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                Learn More
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-brand-600 rounded-[3rem] p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl font-display font-bold mb-6">Need a custom solution?</h2>
            <p className="text-brand-100 text-lg mb-10">Our team can help you build specialized AI models for your specific clinical requirements.</p>
            <button className="px-10 py-5 bg-white text-brand-600 rounded-3xl font-bold text-lg shadow-xl hover:bg-brand-50 transition-all">
              Contact Our Experts
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SolutionsPage;
