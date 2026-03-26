import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Models } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from './lib/appwrite';
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
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { PatientSettings } from './pages/PatientSettings';
import { SolutionsPage } from './pages/SolutionsPage';
import { DashboardLayout } from './layouts/DashboardLayout';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'doctor' | 'patient' }> = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        try {
          const userDoc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.USERS, currentUser.$id);
          setRole(userDoc.role);
        } catch (dbErr) {
          console.warn('User document not found or error fetching role', dbErr);
          setRole(null);
        }
      } catch (error) {
        // User not logged in or session invalid
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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
        <Route path="/billing" element={<ProtectedRoute allowedRole="doctor"><BillingPage /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute allowedRole="patient"><BookAppointment /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
