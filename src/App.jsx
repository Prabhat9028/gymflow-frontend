import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ChangePasswordModal from './components/common/ChangePasswordModal';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import AttendancePage from './pages/AttendancePage';
import PlansPage from './pages/PlansPage';
import TrainersPage from './pages/TrainersPage';
import StaffPage from './pages/StaffPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import BiometricPage from './pages/BiometricPage';
import GymsPage from './pages/GymsPage';
import ChurnPage from './pages/ChurnPage';
import LeadsPage from './pages/LeadsPage';

function ProtectedRoute({children}){
  const{isAuthenticated,loading,user}=useAuth();
  if(loading)return<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if(!isAuthenticated)return<Navigate to="/login"/>;
  // Force password change on first login
  const needsPasswordChange = user && user.passwordChanged === false;
  return<>{needsPasswordChange && <ChangePasswordModal open={true}/>}{children}</>;
}

function AppRoutes(){const{isAuthenticated}=useAuth();return(<Routes>
  <Route path="/login" element={isAuthenticated?<Navigate to="/"/>:<LoginPage/>}/>
  <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
    <Route index element={<DashboardPage/>}/><Route path="members" element={<MembersPage/>}/>
    <Route path="members/:id" element={<MemberDetailPage/>}/>
    <Route path="attendance" element={<AttendancePage/>}/><Route path="biometric" element={<BiometricPage/>}/>
    <Route path="plans" element={<PlansPage/>}/><Route path="trainers" element={<TrainersPage/>}/>
    <Route path="staff" element={<StaffPage/>}/><Route path="payments" element={<PaymentsPage/>}/>
    <Route path="reports" element={<ReportsPage/>}/><Route path="leads" element={<LeadsPage/>}/><Route path="ai-churn" element={<ChurnPage/>}/><Route path="gyms" element={<GymsPage/>}/>
  </Route></Routes>);}

export default function App(){return(<BrowserRouter><AuthProvider><AppRoutes/><Toaster position="top-right" toastOptions={{style:{borderRadius:'12px',background:'#1e293b',color:'#f8fafc',fontSize:'14px'}}}/></AuthProvider></BrowserRouter>);}
