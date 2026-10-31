import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.jsx';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';

// Pages
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';
import { PublicProfilePage } from '../features/profile/PublicProfilePage.jsx';
import { AcademicsPage } from '../features/academics/AcademicsPage.jsx';
import { CodingCataloguePage } from '../features/coding/CodingCataloguePage.jsx';
import { ProblemSolvePage } from '../features/coding/ProblemSolvePage.jsx';
import { GateCataloguePage } from '../features/gate/GateCataloguePage.jsx';
import { GateTestPage } from '../features/gate/GateTestPage.jsx';
import { GateResultPage } from '../features/gate/GateResultPage.jsx';
import { AiAssistantPage } from '../features/ai-assistant/AiAssistantPage.jsx';
import { InterviewHubPage } from '../features/interviews/InterviewHubPage.jsx';
import { InterviewSessionPage } from '../features/interviews/InterviewSessionPage.jsx';
import { AssessmentCataloguePage } from '../features/assessments/AssessmentCataloguePage.jsx';
import { AssessmentTakePage } from '../features/assessments/AssessmentTakePage.jsx';
import { AssessmentReviewPage } from '../features/assessments/AssessmentReviewPage.jsx';
import { CommunityForumPage } from '../features/community/CommunityForumPage.jsx';
import { PostDetailPage } from '../features/community/PostDetailPage.jsx';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/Card.jsx';

const ModulePlaceholder = ({ title, description, phase }) => (
  <Card className="max-w-xl mx-auto text-center py-12">
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="max-w-md mx-auto mt-2">{description}</CardDescription>
      <div className="mt-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
          Targeted in {phase}
        </span>
      </div>
    </CardHeader>
  </Card>
);

export const router = createBrowserRouter([
  // Public Routes
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/u/:username',
    element: <PublicProfilePage />,
  },

  // Protected Dashboard Routes
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/academics', element: <AcademicsPage /> },
      { path: '/coding', element: <CodingCataloguePage /> },
      { path: '/coding/solve/:slug', element: <ProblemSolvePage /> },
      { path: '/gate', element: <GateCataloguePage /> },
      { path: '/gate/test/:id', element: <GateTestPage /> },
      { path: '/gate/results/:id', element: <GateResultPage /> },
      { path: '/ai-assistant', element: <AiAssistantPage /> },
      { path: '/interviews', element: <InterviewHubPage /> },
      { path: '/interviews/:id', element: <InterviewSessionPage /> },
      { path: '/assessments', element: <AssessmentCataloguePage /> },
      { path: '/assessments/take/:id', element: <AssessmentTakePage /> },
      {
        path: '/assessments/review/:id',
        element: (
          <ProtectedRoute allowedRoles={['contentAdmin', 'platformAdmin']}>
            <AssessmentReviewPage />
          </ProtectedRoute>
        ),
      },
      { path: '/community', element: <CommunityForumPage /> },
      { path: '/community/:id', element: <PostDetailPage /> },
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['contentAdmin', 'platformAdmin']}>
            <ModulePlaceholder
              title="Admin Console"
              description="Platform governance, problem authoring, flag review, and audit logs."
              phase="Phase 6"
            />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 Catch-All
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
