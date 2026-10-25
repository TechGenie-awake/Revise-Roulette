import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { SyncManager } from './components/Account';
import { Layout } from './components/Layout';
import { useStore } from './lib/store';
import Onboarding from './pages/Onboarding';
import SessionPage from './pages/SessionPage';
import SettingsPage from './pages/SettingsPage';
import TopicsPage from './pages/TopicsPage';
import WheelPage from './pages/WheelPage';

const StatsPage = lazy(() => import('./pages/StatsPage'));

export default function App() {
  const onboarded = useStore((s) => s.plan.onboarded);

  return (
    <>
      <SyncManager />
      {onboarded ? <AppRoutes /> : <Onboarding />}
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<WheelPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route
            path="stats"
            element={
              <Suspense fallback={<p className="p-6 text-ink-soft">Loading stats…</p>}>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
