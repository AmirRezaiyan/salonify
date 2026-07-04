import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import QRScanner from './pages/QRScanner';
import SalonQRCode from './pages/SalonQRCode';
import { Loading } from './components/Loading';
import { useEffect } from 'react';
import ResetPassword from './pages/ResetPassword';
import './styles/globals.css';
import './App.css';
import Salons from './pages/salons';
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  return isAuthenticated ? children : <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
};

function AppContent() {
  const { loading } = useAuth();

  useEffect(() => {
    // Debug fonts
    console.log('═══════════════════════════════════════');
    console.log('🔍 FONT DEBUGGING');
    console.log('═══════════════════════════════════════\n');

    const computedFont = getComputedStyle(document.documentElement).fontFamily;
    const bodyFont = getComputedStyle(document.body).fontFamily;
    
    console.log('📋 Computed Font Families:');
    console.log('   Root (:root):', computedFont);
    console.log('   Body:', bodyFont);
    console.log('');

    console.log('📦 Testing Font URLs:');
    const fontFiles = [
      '/fonts/Vazirmatn%5Bwght%5D.woff2',
      '/fonts/Vazirmatn-Regular.woff2',
      '/fonts/Vazirmatn-Bold.woff2',
      '/fonts/Vazirmatn-Light.woff2',
      '/fonts/Vazirmatn-Medium.woff2',
      '/fonts/Vazirmatn-SemiBold.woff2',
      '/fonts/Vazirmatn-ExtraBold.woff2'
    ];

    fontFiles.forEach(file => {
      fetch(file)
        .then(r => {
          const status = r.ok ? '✅' : '❌';
          const code = r.ok ? r.status : '404';
          console.log(`   ${status} ${file} (${code})`);
        })
        .catch(e => console.log(`   ❌ ${file} (ERROR: ${e.message})`));
    });

    console.log('\n🎨 CSS Variables Check:');
    const root = document.documentElement;
    const fontVar = getComputedStyle(root).getPropertyValue('--font-family').trim();
    console.log('   --font-family:', fontVar);
    
    console.log('\n═══════════════════════════════════════\n');
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/qr/:qrCode" element={<QRScanner />} />
        <Route path="/salon/qr-code" element={<ProtectedRoute><SalonQRCode /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/:salonId" element={<Booking />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/owner-bookings" element={<ProtectedRoute><OwnerBookingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/salons" element={<Salons />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;