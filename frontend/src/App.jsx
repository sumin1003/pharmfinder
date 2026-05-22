import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PharmacyRegisterPage from './pages/PharmacyRegisterPage';
import MedicineSearchPage from './pages/MedicineSearchPage';
import MedicineDetailPage from './pages/MedicineDetailPage';
import PharmacyMapPage from './pages/PharmacyMapPage';
import PharmacyDetailPage from './pages/PharmacyDetailPage';
import PublicPharmacyDetailPage from './pages/PublicPharmacyDetailPage';
import PharmacyDashboard from './pages/pharmacy/DashboardPage';
import AdminDashboard from './pages/admin/DashboardPage';
import OverviewPage from './pages/admin/OverviewPage';
import FavoritesPage from './pages/FavoritesPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SocialSignupPage from './pages/SocialSignupPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// 앱 루트 — BrowserRouter·AuthProvider·Layout으로 감싸고 전체 라우트를 정의
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/pharmacy" element={<PharmacyRegisterPage />} />
            <Route path="/medicines/search" element={<MedicineSearchPage />} />
            <Route path="/medicines/:id" element={<MedicineDetailPage />} />
            <Route path="/map" element={<PharmacyMapPage />} />
            <Route path="/pharmacies/public/:id" element={<PublicPharmacyDetailPage />} />
            <Route path="/pharmacies/:id" element={<PharmacyDetailPage />} />
            <Route path="/auth-callback" element={<AuthCallbackPage />} />
            <Route path="/social-signup" element={<SocialSignupPage />} />
            <Route
              path="/profile"
              element={<PrivateRoute roles={['user', 'pharmacy', 'admin']}><ProfilePage /></PrivateRoute>}
            />
            <Route
              path="/reset-password"
              element={<PrivateRoute roles={['user', 'pharmacy', 'admin']}><ResetPasswordPage /></PrivateRoute>}
            />
            <Route
              path="/pharmacy/dashboard"
              element={<PrivateRoute roles={['pharmacy']}><PharmacyDashboard /></PrivateRoute>}
            />
            <Route
              path="/admin"
              element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>}
            />
            <Route
              path="/admin/overview"
              element={<PrivateRoute roles={['admin']}><OverviewPage /></PrivateRoute>}
            />
            <Route
              path="/favorites"
              element={<PrivateRoute roles={['user', 'pharmacy']}><FavoritesPage /></PrivateRoute>}
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
