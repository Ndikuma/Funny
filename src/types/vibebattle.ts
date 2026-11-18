export type Language = 'en' | 'fr' | 'rn';

export type QuizTheme = 'coral' | 'cobalt' | 'amber' | 'emerald';

export type QuizVisibility = 'public' | 'unlisted' | 'private';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  bio: string;
  avatarId: string;
  isPublic: boolean;
  showCreatorOnQuizzes: boolean;
  preferredLanguage: Language;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  profile: UserProfile;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: AnswerOption[];
  correctOptionId: string;
}

/**
 * Safe question payload sent to a player BEFORE quiz completion.
 * Never exposes `correctOptionId`.
 */
export interface PlayableQuestion {
  id: string;
  prompt: string;
  options: AnswerOption[];
}

export interface Quiz {
  id: string;
  shareCode: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarId: string;
  showCreator: boolean;
  title: string;
  description: string;
  category: 'friendship' | 'couple' | 'personality' | 'fun';
  theme: QuizTheme;
  visibility: QuizVisibility;
  isPublished: boolean;
  isFeatured: boolean;
  isHiddenByModeration: boolean;
  questions: Question[];
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Safe quiz payload returned to players before completing an attempt.
 */
export interface PlayableQuiz {
  id: string;
  shareCode: string;
  title: string;
  description: string;
  category: Quiz['category'];
  theme: QuizTheme;
  visibility: QuizVisibility;
  creatorLabel: string | null;
  creatorUsername: string | null;
  creatorAvatarId: string | null;
  questionCount: number;
  playCount: number;
  questions: PlayableQuestion[];
  createdAt: string;
}

export interface AttemptAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface AttemptAnswerBreakdown {
  questionId: string;
  prompt: string;
  selectedOptionId: string;
  selectedText: string;
  correctOptionId: string;
  correctText: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  quizShareCode: string;
  playerUserId: string | null;
  playerNickname: string;
  isGuest: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number;
  answers: AttemptAnswerBreakdown[];
  completedAt: string;
}

export interface LeaderboardEntry {
  attemptId: string;
  rank: number;
  playerNickname: string;
  playerUserId: string | null;
  isGuest: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number;
  completedAt: string;
}

export interface QuestionTemplate {
  id: string;
  category: Quiz['category'];
  prompt: Record<Language, string>;
  suggestedOptions: Record<Language, string[]>;
  isActive: boolean;
}

export interface Report {
  id: string;
  quizId: string;
  quizTitle: string;
  quizShareCode: string;
  reporterLabel: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface ModerationAction {
  id: string;
  adminUsername: string;
  actionType: string;
  targetType: 'quiz' | 'user' | 'report' | 'template';
  targetId: string;
  note: string;
  createdAt: string;
}

export interface QuizDraftInput {
  title: string;
  description: string;
  category: Quiz['category'];
  theme: QuizTheme;
  visibility: QuizVisibility;
  isPublished: boolean;
  questions: Question[];
}

export interface DashboardSummary {
  quizzesCreated: number;
  totalPlaysReceived: number;
  attemptsCompleted: number;
  averageScoreReceived: number;
  recentQuizzes: Quiz[];
  recentAttempts: QuizAttempt[];
}

// ---------------- PHASE 2 & 3 TYPES ----------------

export interface FunnyBattlePrompt {
  id: string;
  prompt: string;
}

export interface FunnyBattleVote {
  promptId: string;
  voterKey: string;
  voterName: string;
  nominee: string;
  createdAt: string;
}

export interface FunnyBattle {
  id: string;
  shareCode: string;
  creatorId: string | null;
  creatorName: string;
  title: string;
  nominees: string[];
  prompts: FunnyBattlePrompt[];
  votes: FunnyBattleVote[];
  isHiddenByModeration: boolean;
  createdAt: string;
}

export type CompatibilityCategory =
  | 'couple'
  | 'best_friends'
  | 'compatibility'
  | 'would_you_rather'
  | 'this_or_that'
  | 'friendship_test';

export interface CompatibilityQuestion {
  id: string;
  prompt: string;
  options: AnswerOption[];
}

export interface CompatibilitySession {
  id: string;
  shareCode: string;
  category: CompatibilityCategory;
  title: string;
  creatorName: string;
  creatorUserId: string | null;
  partnerName: string | null;
  questions: CompatibilityQuestion[];
  creatorAnswers: Record<string, string>;
  partnerAnswers: Record<string, string> | null;
  matchPercentage: number | null;
  commonCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DailyChallengeItem {
  id: string;
  dateKey: string;
  type: 'riddle' | 'mini_quiz' | 'sentence';
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  funFact: string;
  xpReward: number;
}

export interface DailyParticipation {
  id: string;
  challengeId: string;
  challengeTitle: string;
  userId: string;
  selectedIndex: number;
  isCorrect: boolean;
  xpAwarded: number;
  completedAt: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  requirementLabel: string;
}

export interface XPTransaction {
  id: string;
  userId: string;
  reason: string;
  amount: number;
  createdAt: string;
}

export interface UserGamification {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastDailyDate: string | null;
  dailyXpDate: string;
  dailyXpToday: number;
  unlockedBadgeIds: string[];
}

export interface GlobalLeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarId: string;
  xp: number;
  level: number;
  streak: number;
  badgesCount: number;
}

export interface FriendshipRecord {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'quiz_play' | 'battle_vote' | 'friend_request' | 'badge' | 'system';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface PerformanceTrendPoint {
  day: string;
  dateKey: string;
  xpEarned: number;
  accuracy: number | null;
  quizzesPlayed: number;
}

