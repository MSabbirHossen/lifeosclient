import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { getFormattedDate } from './utils/dateHelpers';

// Pages
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Journal } from './pages/Journal';
import { TimeTracker } from './pages/TimeTracker';
import { StudyTracker } from './pages/StudyTracker';
import { FitnessTracker } from './pages/FitnessTracker';
import { CalorieTracker } from './pages/CalorieTracker';
import { FinanceTracker } from './pages/FinanceTracker';
import { IslamicTracker } from './pages/IslamicTracker';
import { IslamicFastingTracker } from './pages/IslamicFastingTracker';
import { QadaMatrix } from './pages/QadaMatrix';
import { HabitsTracker } from './pages/HabitsTracker';
import { GoalsTracker } from './pages/GoalsTracker';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { DeveloperInfo } from './pages/DeveloperInfo';

const Layout = ({ children, selectedDate, setSelectedDate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed
            ? 'lg:ml-20 rtl:lg:ml-0 rtl:lg:mr-20'
            : 'lg:ml-64 rtl:lg:ml-0 rtl:lg:mr-64'
        }`}
      >
        <Header
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, selectedDate, setSelectedDate }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-secondary">Loading Life OS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>{children}</Layout>;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export function App() {
  const [selectedDate, setSelectedDate] = useState(getFormattedDate());

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

              {/* Dashboard & Tracker Routes */}
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <Dashboard selectedDate={selectedDate} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <Journal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/time-tracker"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <TimeTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <StudyTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fitness"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <FitnessTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calories"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <CalorieTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <FinanceTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/islamic"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <IslamicTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/islamic-fasting"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <IslamicFastingTracker selectedDate={selectedDate} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sawm"
                element={<Navigate to="/islamic-fasting" replace />}
              />
              <Route
                path="/qada-matrix"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <QadaMatrix />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/habits"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <HabitsTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <GoalsTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer"
                element={
                  <ProtectedRoute selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                    <DeveloperInfo />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
