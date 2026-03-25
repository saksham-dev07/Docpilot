import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { BookAppointment } from './pages/BookAppointment';
import { DoctorAppointments } from './pages/DoctorAppointments';
import { DoctorConsultations } from './pages/DoctorConsultations';
import { PatientConsultations } from './pages/PatientConsultations';
import { OPDManager } from './pages/OPDManager';
import { DocumentWorkflow } from './pages/DocumentWorkflow';
import { ArchivePage } from './pages/ArchivePage';
import { PatientArchive } from './pages/PatientArchive';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PatientSettings } from './pages/PatientSettings';
import { SolutionsPage } from './pages/SolutionsPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { GenericPage } from './pages/GenericPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'doctor' | 'patient' }> = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'doctor' ? '/doctor' : '/patient'} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Marketing/Footer Routes */}
        <Route path="/features" element={<GenericPage title="Platform Features" subtitle="Explore the comprehensive suite of tools designed for modern healthcare practices." content={["DocPilot offers an integrated ecosystem for clinical management. From automated patient queuing to intelligent diagnostic support, our features are built to reduce administrative burden.", "Our AI-powered clinical scribe listens to your consultations and automatically generates accurate, structured medical notes in real-time.", "Experience seamless workflow integration with our robust API, allowing you to connect DocPilot with your existing laboratory and pharmacy systems."]} />} />
        <Route path="/ai-diagnostics" element={<GenericPage title="AI Diagnostics" subtitle="Next-generation clinical decision support powered by advanced neural networks." content={["Our diagnostic AI models are trained on millions of peer-reviewed clinical data points, providing reliable second opinions in real-time.", "The system automatically highlights potential contraindications, flags abnormal lab results, and suggests evidence-based treatment pathways.", "Rest assured, DocPilot AI acts as an augmentative tool, ensuring the final clinical decision always remains firmly in the hands of the attending physician."]} />} />
        <Route path="/opd-manager" element={<GenericPage title="OPD Manager" subtitle="Streamline your outpatient department with smart queuing and automated triage." content={["Eliminate waiting room chaos with our intelligent OPD manager. Patients receive automated status updates and precise wait-time estimations directly on their devices.", "Our digital triage protocol automatically captures vital signs and chief complaints before the patient even steps into the consultation room.", "Staff can easily monitor room occupancy, doctor availability, and overall department throughput from a centralized bird's-eye dashboard."]} />} />
        <Route path="/pricing" element={<GenericPage title="Pricing Plans" subtitle="Transparent, scaleable pricing designed for practices of all sizes." content={["DocPilot operates on a straightforward subscription model. We offer flexible tiers depending on your practice volume and specific feature requirements.", "Solo practitioners can start with our Basic tier, which includes the core OPD manager and AI scribe. Multi-specialty clinics can upgrade to the Enterprise tier for advanced analytics and priority support.", "Contact our sales team today to get a customized quote tailored perfectly to your practice's individual needs."]} />} />
        <Route path="/about" element={<GenericPage title="About Us" subtitle="The platform revolutionizing clinical workflows through applied artificial intelligence." content={["DocPilot was proudly engineered and designed in India, with a singular vision: to eradicate physician burnout through powerful clinical tools.", "Our product was built by a passionate developer dedicated to building software that healthcare professionals actually love to use.", "Our mission is simple: to give doctors their time back, so they can focus entirely on what they do best—saving lives and caring for patients."]} />} />
        <Route path="/careers" element={<GenericPage title="Careers" subtitle="Join the mission to build the future of medical technology." content={["We are always looking for exceptional engineers, product designers, and medical professionals to join our fast-growing team.", "At DocPilot, you will tackle some of the most complex and meaningful challenges in the world. Your work will directly impact patient outcomes and clinician well-being.", "Check our active job listings on LinkedIn or send your resume directly to careers@docpilot.com. We offer competitive equity, comprehensive health coverage, and flexible remote work options."]} />} />
        <Route path="/privacy" element={<GenericPage title="Privacy Policy" subtitle="We take your data security and patient confidentiality seriously." content={["DocPilot is fully HIPAA compliant and adheres strictly to international data protection regulations natively. We utilize end-to-end military-grade encryption for all transmitted and stored health information.", "We will never sell, lease, or share your patient data with third-party advertisers or unauthorized external entities under any circumstances.", "You retain full ownership of all data entered into the platform. You may request a complete structured export or permanent deletion of your records at any time."]} />} />
        <Route path="/terms" element={<GenericPage title="Terms of Service" subtitle="The rules and guidelines for utilizing the DocPilot platform." content={["By accessing and using the DocPilot application, you agree strictly to abide by our standard terms and conditions. The platform is intended exclusively for licensed clinical professionals.", "While our AI provides diagnostic suggestions, it is not a substitute for professional medical judgment. Providers are solely responsible for all final clinical outcomes and treatment plans.", "DocPilot reserves the right to suspend or terminate accounts that violate our usage policies, including unauthorized access attempts or abusive behavior toward our network systems."]} />} />

        {/* Protected Dashboard Routes */}
        <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute allowedRole="doctor"><DoctorAppointments /></ProtectedRoute>} />
        <Route path="/doctor/consultations" element={<ProtectedRoute allowedRole="doctor"><DoctorConsultations /></ProtectedRoute>} />
        <Route path="/doctor/archive" element={<ProtectedRoute allowedRole="doctor"><ArchivePage /></ProtectedRoute>} />
        <Route path="/doctor/settings" element={<ProtectedRoute allowedRole="doctor"><SettingsPage /></ProtectedRoute>} />
        
        <Route path="/patient" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/consultations" element={<ProtectedRoute allowedRole="patient"><PatientConsultations /></ProtectedRoute>} />
        <Route path="/patient/archive" element={<ProtectedRoute allowedRole="patient"><PatientArchive /></ProtectedRoute>} />
        <Route path="/patient/settings" element={<ProtectedRoute allowedRole="patient"><PatientSettings /></ProtectedRoute>} />
        
        <Route path="/opd" element={<ProtectedRoute allowedRole="doctor"><OPDManager /></ProtectedRoute>} />
        <Route path="/workflow" element={<ProtectedRoute allowedRole="doctor"><DocumentWorkflow /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRole="doctor"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute allowedRole="patient"><BookAppointment /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
