import { BrowserRouter as Router, Routes, Route, useLocation,Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import MyUploads from './pages/MyUpload';
import QrPages from './pages/Qr';
import AdminPages from './pages/Admin';

import Scoreboard from './pages/Scoreboard';


function AppWrapper() {
  const location = useLocation();
  const hideSidebarPaths = ['/profile', '/azp',  '/myupload', '/register', '/qr','/admin'];
  const shouldShowSidebar = !hideSidebarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefce8] via-[#f0f4ff] to-[#ecfdf5] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-white font-inter">
      {shouldShowSidebar && <Sidebar />}

      <Routes>
        <Route path="/" element={<Home />} />
       
       
        <Route path="/azp" element={<Login />} />
        

        
        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <QrPages />
            </ProtectedRoute>
          }
        />
         <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPages/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/myupload"
          element={
            <ProtectedRoute>
              <MyUploads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Navigate to scoreboard */}
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Scoreboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
