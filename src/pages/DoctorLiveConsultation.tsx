import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize2,
  Zap,
  FileText,
  Clock,
  Activity
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { account } from '../lib/appwrite';

export const DoctorLiveConsultation: React.FC = () => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const currentUser = await account.get();
        if (currentUser.name) setDoctorName(currentUser.name);
      } catch(e) {}
    };
    fetchDoctor();
  }, []);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Video Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 relative bg-slate-900 rounded-5xl overflow-hidden shadow-2xl shadow-slate-900/20 group">
          {/* Main Video (Doctor's View of Patient) */}
          <img 
            src="https://picsum.photos/seed/patient_video/1200/800" 
            alt="Patient Video" 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          
          {/* Patient Label */}
          <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-white">Robert Fox (Patient)</span>
          </div>

          {/* Self View (Doctor) */}
          <div className="absolute bottom-8 right-8 w-64 aspect-video bg-slate-800 rounded-3xl border-4 border-white/10 overflow-hidden shadow-2xl shadow-black/50 group-hover:scale-105 transition-transform duration-500">
            <img 
              src="https://picsum.photos/seed/doctor_video/400/300" 
              alt="Doctor Video" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white">
              You ({doctorName})
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
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <button className="w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
              <Users className="w-6 h-6" />
            </button>
            <button className="w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
              <MessageSquare className="w-6 h-6" />
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <Link to="/doctor/consultations" className="w-14 h-14 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center shadow-xl shadow-rose-600/20 transition-all">
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
            <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">Live Transcription</p>
            <p className="text-slate-600 truncate italic">"Yes, doctor. I've been feeling a slight tightness in my chest when I climb stairs lately..."</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
            <Clock className="w-4 h-4" />
            08:42
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-96 flex flex-col gap-6">
        <div className="bg-brand-600 rounded-5xl p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">AI Clinical Scribe</h3>
            <p className="text-brand-100 text-sm mb-6 leading-relaxed">I'm listening and generating clinical notes in real-time. Focus on your patient.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-200">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Active & Listening
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-5xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-display font-bold text-slate-900">Clinical Notes</h3>
            <button className="p-2 text-slate-400 hover:text-brand-600 transition-all">
              <FileText className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto space-y-8">
            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Chief Complaint</h4>
              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">
                Patient reports intermittent chest tightness during physical exertion (climbing stairs).
              </p>
            </section>

            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Symptoms Analysis</h4>
              <ul className="space-y-3">
                {[
                  'Dyspnea on exertion',
                  'No radiating pain to left arm',
                  'Duration: 5-10 minutes per episode',
                  'Relieved by rest'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">AI Recommendations</h4>
              <div className="space-y-3">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-700 mb-1">Action Required</p>
                  <p className="text-xs text-rose-600 leading-relaxed">Schedule Stress ECG and Echocardiogram within 48 hours.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 mb-1">Medication Check</p>
                  <p className="text-xs text-emerald-600 leading-relaxed">Continue current statin therapy. Monitor BP daily.</p>
                </div>
              </div>
            </section>
          </div>
          <div className="p-6 border-t border-slate-50">
            <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">
              Save & Finalize Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
