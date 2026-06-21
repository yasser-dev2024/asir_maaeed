import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { ClientLayout } from '../layouts/ClientLayout';
import { AssistantPage } from '../pages/AssistantPage';
import { DownloadsPage } from '../pages/DownloadsPage';
import { EventsPage } from '../pages/EventsPage';
import { HomePage } from '../pages/HomePage';
import { JourneyPage } from '../pages/JourneyPage';
import { NearbyPage } from '../pages/NearbyPage';
import { PassportPage } from '../pages/PassportPage';
import { PlanPage } from '../pages/PlanPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route element={<HomePage />} index />
        <Route element={<JourneyPage />} path="journey" />
        <Route element={<PlanPage />} path="plan" />
        <Route element={<EventsPage />} path="events" />
        <Route element={<PassportPage />} path="passport" />
        <Route element={<DownloadsPage />} path="downloads" />
        <Route element={<AssistantPage />} path="assistant" />
        <Route element={<NearbyPage />} path="nearby" />
      </Route>
      <Route element={<AdminLoginPage />} path="/admin/login" />
      <Route element={<AdminLayout />} path="/admin">
        <Route element={<AdminDashboardPage />} index />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
