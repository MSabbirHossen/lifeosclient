import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { getFormattedDate } from './utils/dateHelpers';
import { LoadingScreen } from './components/LoadingScreen';

// Lazy-loaded Pages (code-split per route for ultra-fast initial bundle load)
const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth || m.default })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard || m.default })));
const Journal = lazy(() => import('./pages/Journal').then((m) => ({ default: m.Journal || m.default })));
const TimeTracker = lazy(() => import('./pages/TimeTracker').then((m) => ({ default: m.TimeTracker || m.default })));
const StudyTracker = lazy(() => import('./pages/StudyTracker').then((m) => ({ default: m.StudyTracker || m.default })));
const FitnessTracker = lazy(() => import('./pages/FitnessTracker').then((m) => ({ default: m.FitnessTracker || m.default })));
const CalorieTracker = lazy(() => import('./pages/CalorieTracker').then((m) => ({ default: m.CalorieTracker || m.default })));
const FinanceTracker = lazy(() => import('./pages/FinanceTracker').then((m) => ({ default: m.FinanceTracker || m.default })));
const IslamicTracker = lazy(() => import('./pages/IslamicTracker').then((m) => ({ default: m.IslamicTracker || m.default })));
const IslamicFastingTracker = lazy(() => import('./pages/IslamicFastingTracker').then((m) => ({ default: m.IslamicFastingTracker || m.default })));
const QadaMatrix = lazy(() => import('./pages/QadaMatrix').then((m) => ({ default: m.QadaMatrix || m.default })));
const HabitsTracker = lazy(() => import('./pages/HabitsTracker').then((m) => ({ default: m.HabitsTracker || m.default })));
const GoalsTracker = lazy(() => import('./pages/GoalsTracker').then((m) => ({ default: m.GoalsTracker || m.default })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports || m.default })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings || m.default })));
const DeveloperInfo = lazy(() => import('./pages/DeveloperInfo').then((m) => ({ default: m.DeveloperInfo || m.default })));

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
        <main className="flex-1 p-2.5 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, selectedDate, setSelectedDate }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen={true} message="Loading Life OS..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>{children}</Layout>;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen={true} message="Authenticating..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const SuspenseFallback = () => (
  <LoadingScreen fullScreen={false} message="Loading module..." size="md" />
);

export function App() {
  const [selectedDate, setSelectedDate] = useState(getFormattedDate());

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Suspense fallback={<SuspenseFallback />}>
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
            </Suspense>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
