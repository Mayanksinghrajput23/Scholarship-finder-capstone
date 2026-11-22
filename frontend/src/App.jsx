import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Find from './pages/Find';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Account from './pages/Account';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';
import { About, Contact, Faqs } from './pages/PublicPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminScholarships from './pages/admin/AdminScholarships';
import AdminApplications from './pages/admin/AdminApplications';
import AdminStudents from './pages/admin/AdminStudents';
import { useAuth } from './context/AuthContext';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/faqs" element={<Faqs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>

      {/* Students only */}
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scholarships" element={<Find />} />
          <Route path="/bookmarks" element={<Applications mode="bookmarks" />} />
          <Route path="/applications" element={<Applications mode="applications" />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admins only */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/scholarships" element={<AdminScholarships />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/students" element={<AdminStudents />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
