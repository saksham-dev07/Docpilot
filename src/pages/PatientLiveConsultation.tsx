import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize2,
  Zap,
  FileText,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Droplets
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const PatientLiveConsultation: React.FC = () => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [patientName, setPatientName] = useState('Patient');

  useEffect(() => {
    const fetchPatient = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPatientName(docSnap.data().name);
        }
      }
    };
    fetchPatient();
  }, []);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Video Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 relative bg-slate-900 rounded-5xl overflow-hidden shadow-2xl shadow-slate-900/20 group">
          {/* Main Video (Patient's View of Doctor) */}
          <img 
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1200&h=800" 
            alt="Doctor Video" 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          {/* Doctor Label */}
          <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-white">Dr. Sarah Chen (Doctor)</span>
          </div>

          {/* Self View (Patient) */}
            <div className="absolute bottom-6 right-6 w-72 aspect-[4/3] bg-slate-800 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-black/50 z-10">
              <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=300" 
              alt="Self" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white">
              You ({patientName})
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-2xl rounded-4xl border border-white/10">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                isMuted ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                isVideoOff ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
            </button>
            <button className="w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
              <MessageSquare className="w-6 h-6" />
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <Link to="/patient/consultations" className="w-14 h-14 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center shadow-xl shadow-rose-600/20 transition-all">
              <PhoneOff className="w-6 h-6" />
            </Link>
          </div>

          {/* Top Right Controls */}
          <div className="absolute top-8 right-8 flex items-center gap-3">
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-all">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Transcription Bar */}
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">Doctor is speaking</p>
            <p className="text-slate-600 truncate italic">"I'm reviewing your ECG results now, Robert. Everything looks stable, but I want to discuss the tightness you mentioned..."</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
            <Clock className="w-4 h-4" />
            08:42
          </div>
        </div>
      </div>

      {/* Patient Health Sidebar */}
      <div className="w-96 flex flex-col gap-6">
        <div className="bg-emerald-600 rounded-5xl p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">Real-time Vitals</h3>
            <p className="text-emerald-100 text-sm mb-6 leading-relaxed">Your doctor is currently monitoring your live health metrics during this call.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Secure Data Stream Active
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-5xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-xl font-display font-bold text-slate-900">Current Health Data</h3>
          </div>
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Heart Rate</p>
                  <p className="text-xl font-bold text-rose-700">82 BPM</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-rose-400 uppercase">Normal</span>
              </div>
            </div>

            <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Temperature</p>
                  <p className="text-xl font-bold text-orange-700">36.6 °C</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-orange-400 uppercase">Normal</span>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Blood Oxygen</p>
                  <p className="text-xl font-bold text-blue-700">98%</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-blue-400 uppercase">Optimal</span>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Doctor's Shared Notes</h4>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "We will review your recent blood work results and discuss the next steps for your cardiology follow-up."
              </p>
            </div>
          </div>
          <div className="p-6 border-t border-slate-50">
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Request Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLiveConsultation;
