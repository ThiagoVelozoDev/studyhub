import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import RegisterPage from "@/pages/Register/RegisterPage";
import { Loader2 } from "lucide-react";

const DashboardPage = lazy(() => import("@/pages/Dashboard/DashboardPage"));
const StudyPage = lazy(() => import("@/pages/Study/StudyPage"));
const PlansPage = lazy(() => import("@/pages/Plans/PlansPage"));
const PlanDetailPage = lazy(() => import("@/pages/Plans/PlanDetailPage"));
const EditalsPage = lazy(() => import("@/pages/Editals/EditalsPage"));
const EditalDetailPage = lazy(() => import("@/pages/Editals/EditalDetailPage"));
const StatisticsPage = lazy(() => import("@/pages/Statistics/StatisticsPage"));
const HistoryPage = lazy(() => import("@/pages/History/HistoryPage"));
const SettingsPage = lazy(() => import("@/pages/Settings/SettingsPage"));
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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/:planId" element={<PlanDetailPage />} />
            <Route path="/editals" element={<EditalsPage />} />
            <Route path="/editals/:editalId" element={<EditalDetailPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
