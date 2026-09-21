import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import RegisterPage from "@/pages/Register/RegisterPage";
import { Loader2 } from "lucide-react";

const AnalysisPage = lazy(() => import("@/pages/Dashboard/AnalysisPage"));
const StudyPage = lazy(() => import("@/pages/Study/StudyPage"));
const PlansPage = lazy(() => import("@/pages/Plans/PlansPage"));
const PlanDetailPage = lazy(() => import("@/pages/Plans/PlanDetailPage"));
const SchedulePage = lazy(() => import("@/pages/Schedule/SchedulePage"));
const EditalsPage = lazy(() => import("@/pages/Editals/EditalsPage"));
const EditalDetailPage = lazy(() => import("@/pages/Editals/EditalDetailPage"));
const HistoryPage = lazy(() => import("@/pages/History/HistoryPage"));
const BulkTotalsPage = lazy(() => import("@/pages/History/BulkTotalsPage"));
const SettingsPage = lazy(() => import("@/pages/Settings/SettingsPage"));
const AdminUsersPage = lazy(() => import("@/pages/Admin/UsersPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AnalysisPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/:planId" element={<PlanDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/editals" element={<EditalsPage />} />
            <Route path="/editals/:editalId" element={<EditalDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/totais" element={<BulkTotalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/usuarios" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
