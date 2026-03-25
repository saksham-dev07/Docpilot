import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Users, 
  Activity, 
  MessageSquare, 
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  User,
  Heart,
  Brain,
  Microscope
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <span className="font-display font-extrabold text-xl">A</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">DocPilot</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Features</a>
            <Link to="/solutions" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Solutions</Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-6">
              <div className="group relative">
                <button className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1">
                  Sign In
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
                  <Link to="/login?role=doctor" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-50 text-slate-700 hover:text-brand-600 transition-colors">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-sm font-bold">Doctor Portal</span>
                  </Link>
                  <Link to="/login?role=patient" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-50 text-slate-700 hover:text-brand-600 transition-colors">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-bold">Patient Portal</span>
                  </Link>
                </div>
              </div>
              <Link to="/signup" className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all">
                Get Started
              </Link>
            </div>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-xs font-bold tracking-wider uppercase mb-8">
              <Zap className="w-4 h-4" />
              Next-Gen Medical Intelligence
            </div>
            <h1 className="text-7xl font-display font-extrabold text-slate-900 leading-[1.1] mb-8">
              Healthcare <span className="text-brand-600 italic">Reimagined</span> with AI
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-12 max-w-lg">
              Empower your clinical practice with real-time AI diagnostics, seamless patient management, and automated workflows. Built for the modern physician.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="px-8 py-4 bg-brand-600 text-white rounded-3xl font-bold text-lg shadow-xl shadow-brand-500/25 hover:bg-brand-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-3xl font-bold text-lg hover:bg-slate-50 hover:border-slate-200 transition-all">
                Watch Demo
              </button>
            </div>
            
            <div className="mt-16 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 overflow-hidden">
                    <img src={`https://picsum.photos/seed/doctor${i}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Trusted by 2,000+ Doctors</p>
                <div className="flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Activity key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="Dashboard Preview" 
                className="rounded-[2rem] w-full h-auto shadow-inner"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-6">Everything you need to run a modern practice</h2>
            <p className="text-lg text-slate-500 leading-relaxed">DocPilot combines clinical intelligence with operational excellence to help you focus on what matters most: your patients.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "AI Diagnostics", 
                desc: "Real-time clinical decision support powered by advanced neural networks.",
                color: "bg-brand-50 text-brand-600"
              },
              { 
                icon: Shield, 
                title: "HIPAA Compliant", 
                desc: "Enterprise-grade security with end-to-end encryption for all patient data.",
                color: "bg-emerald-50 text-emerald-600"
              },
              { 
                icon: Users, 
                title: "OPD Manager", 
                desc: "Streamlined outpatient management with automated queueing and triage.",
                color: "bg-orange-50 text-orange-600"
              },
              { 
                icon: MessageSquare, 
                title: "Smart Consultation", 
                desc: "Integrated video calls with live transcription and AI note-taking.",
                color: "bg-blue-50 text-blue-600"
              },
              { 
                icon: Activity, 
                title: "Clinical Analytics", 
                desc: "Deep insights into patient outcomes and practice performance.",
                color: "bg-purple-50 text-purple-600"
              },
              { 
                icon: CheckCircle2, 
                title: "Auto Workflow", 
                desc: "Automate prescriptions, lab orders, and follow-up reminders.",
                color: "bg-rose-50 text-rose-600"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-4xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-8`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-display font-bold text-slate-900 mb-6 leading-tight">
                Tailored solutions for <span className="text-brand-600">every specialty</span>
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed">
                DocPilot adapts to your specific clinical needs, providing specialized tools and intelligence for various medical fields.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 font-display font-bold text-xs uppercase tracking-widest rotate-12">
                Specialized
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-slate-900 rounded-[3rem] p-12 overflow-hidden text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8">
                  <Heart className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-3xl font-display font-bold mb-6">Cardiology Suite</h3>
                <p className="text-slate-400 text-lg leading-relaxed mb-10">
                  Advanced ECG analysis, real-time hemodynamic monitoring, and AI-driven risk stratification for cardiovascular health.
                </p>
                <ul className="space-y-4 mb-12">
                  {['Automated ECG Interpretation', 'Heart Failure Prediction', 'Remote Patient Monitoring'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-brand-50 transition-all">
                  Explore Cardiology
                </button>
              </div>
            </motion.div>

            <div className="grid gap-8">
              {[
                {
                  icon: Brain,
                  title: "Neurology & Psychiatry",
                  desc: "Cognitive assessment tools and neuro-imaging analysis for precise mental health diagnostics.",
                  color: "bg-purple-50 text-purple-600"
                },
                {
                  icon: Microscope,
                  title: "Precision Oncology",
                  desc: "Genomic data integration and tumor progression modeling for personalized cancer treatment.",
                  color: "bg-emerald-50 text-emerald-600"
                },
                {
                  icon: Stethoscope,
                  title: "Primary Care",
                  desc: "Comprehensive patient management with automated triage and preventive health insights.",
                  color: "bg-orange-50 text-orange-600"
                }
              ].map((solution, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-8 group"
                >
                  <div className={`w-16 h-16 shrink-0 ${solution.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <solution.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{solution.title}</h4>
                    <p className="text-slate-500 leading-relaxed">{solution.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-brand-600 rounded-[3rem] p-16 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-5xl font-display font-extrabold text-white mb-8 leading-tight">Ready to transform your clinical workflow?</h2>
            <p className="text-xl text-brand-100 mb-12">Join thousands of doctors who are already using DocPilot to provide better care.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-10 py-5 bg-white text-brand-600 rounded-3xl font-bold text-lg shadow-xl hover:bg-brand-50 transition-all">
                Get Started for Free
              </Link>
              <button className="px-10 py-5 bg-brand-700 text-white rounded-3xl font-bold text-lg hover:bg-brand-800 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                <span className="font-display font-bold text-xl">A</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">DocPilot</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
              The world's most advanced AI-driven medical suite, designed to empower healthcare professionals and improve patient outcomes.
            </p>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer">
                  <Activity className="w-5 h-5" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">AI Diagnostics</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">OPD Manager</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-brand-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-100 flex flex-col md:row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm">© 2026 DocPilot. All rights reserved.</p>
          <div className="flex gap-8 text-sm font-semibold text-slate-500">
            <a href="#" className="hover:text-brand-600 transition-colors">Status</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Security</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
