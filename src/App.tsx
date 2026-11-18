import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';
import { PrivacyPolicyPage, TermsOfServicePage } from './pages/LegalPages';
import { QuizEditorPage } from './pages/QuizEditorPage';
import { PlayQuizPage } from './pages/PlayQuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyQuizzesPage } from './pages/MyQuizzesPage';
import { EditProfilePage, MyProfilePage, PublicProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { FunnyBattlePage } from './pages/FunnyBattlePage';
import { CompatibilityPage } from './pages/CompatibilityPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import {
  AchievementsPage,
  FriendsPage,
  LeaderboardsPage,
  NotificationsPage,
} from './pages/SocialHubPages';
import { LiveBattlePage } from './pages/LiveBattlePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MotionConfig reducedMotion="user">
                <BrowserRouter>
                  <div className="flex min-h-screen flex-col bg-slate-50 pb-20 text-slate-900 md:pb-0 dark:bg-[#0B0F17] dark:text-slate-100">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsOfServicePage />} />

                        <Route path="/create" element={<QuizEditorPage />} />
                        <Route path="/quiz/:id/edit" element={<QuizEditorPage />} />
                        <Route path="/q/:code" element={<PlayQuizPage />} />
                        <Route path="/results/:attemptId" element={<ResultsPage />} />

                        <Route path="/battles" element={<FunnyBattlePage />} />
                        <Route path="/battles/:code" element={<FunnyBattlePage />} />
                        <Route path="/compatibility" element={<CompatibilityPage />} />
                        <Route path="/compatibility/:code" element={<CompatibilityPage />} />
                        <Route path="/daily" element={<DailyChallengePage />} />
                        <Route path="/live" element={<LiveBattlePage />} />
                        <Route path="/live/:code" element={<LiveBattlePage />} />

                        <Route path="/leaderboards" element={<LeaderboardsPage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                        <Route path="/friends" element={<FriendsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />

                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/my-quizzes" element={<MyQuizzesPage />} />
                        <Route path="/profile" element={<MyProfilePage />} />
                        <Route path="/profile/edit" element={<EditProfilePage />} />
                        <Route path="/settings" element={<EditProfilePage />} />
                        <Route path="/u/:username" element={<PublicProfilePage />} />
                        <Route path="/admin" element={<AdminPage />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                    <Footer />
                    <BottomNav />
                  </div>
                </BrowserRouter>
              </MotionConfig>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
